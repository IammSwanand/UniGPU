import asyncio
from datetime import datetime, timezone, timedelta
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.worker.celery_app import celery_app
from app.config import get_settings

# Import ALL models so SQLAlchemy relationships resolve properly
from app.models.user import User  # noqa: F401
from app.models.wallet import Wallet, Transaction  # noqa: F401
from app.models.gpu import GPU, GPUStatus
from app.models.job import Job, JobStatus

settings = get_settings()


def _get_async_session():
    """Create a fresh engine + session for each task invocation.
    This avoids 'Future attached to a different loop' and
    'another operation is in progress' errors in Celery workers.
    """
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    return engine, session_factory


def _run_async(coro):
    """Helper to run async code from a synchronous Celery task."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(name="app.worker.tasks.process_job")
def process_job(job_id: str):
    """Match a pending job to an available GPU and dispatch via WebSocket."""
    _run_async(_process_job_async(job_id))


async def _process_job_async(job_id: str):
    engine, session_factory = _get_async_session()
    try:
        async with session_factory() as db:
            result = await db.execute(select(Job).where(Job.id == job_id))
            job = result.scalar_one_or_none()
            if not job or job.status != JobStatus.pending:
                return

            # Find an available GPU
            from app.services.matching import find_available_gpu  # avoid circular import
            gpu = await find_available_gpu(db, min_vram=0)

            if not gpu:
                # No GPU available — mark as queued; will be retried
                job.status = JobStatus.queued
                await db.commit()
                return

            # Assign GPU to job
            job.gpu_id = gpu.id
            job.status = JobStatus.queued
            gpu.status = GPUStatus.busy
            await db.commit()

            # Dispatch to agent via WebSocket
            from app.services.connection_manager import manager
            if manager.is_connected(gpu.id):
                # Build download URLs for the agent
                script_name = Path(job.script_path).name
                script_url = f"/jobs/{job.id}/download/{script_name}"
                req_url = None
                if job.requirements_path:
                    req_name = Path(job.requirements_path).name
                    req_url = f"/jobs/{job.id}/download/{req_name}"
                
                dataset_url = None
                if job.dataset_path:
                    ds_name = Path(job.dataset_path).name
                    dataset_url = f"/jobs/{job.id}/download/{ds_name}"

                await manager.send_to_gpu(gpu.id, {
                    "type": "assign_job",
                    "job_id": job.id,
                    "script_url": script_url,
                    "requirements_url": req_url,
                    "dataset_url": dataset_url,
                })
    finally:
        await engine.dispose()


@celery_app.task(name="app.worker.tasks.check_heartbeats")
def check_heartbeats():
    """Mark GPUs as offline if heartbeat is stale."""
    _run_async(_check_heartbeats_async())


async def _check_heartbeats_async():
    engine, session_factory = _get_async_session()
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(seconds=settings.HEARTBEAT_TIMEOUT_SECONDS)
        async with session_factory() as db:
            result = await db.execute(
                select(GPU).where(
                    GPU.status != GPUStatus.offline,
                    GPU.last_heartbeat.isnot(None),
                    GPU.last_heartbeat < cutoff,
                )
            )
            stale_gpus = result.scalars().all()
            for gpu in stale_gpus:
                gpu.status = GPUStatus.offline
                print(f"GPU {gpu.id} ({gpu.name}) marked offline -- stale heartbeat")
            if stale_gpus:
                await db.commit()
    finally:
        await engine.dispose()


@celery_app.task(name="app.worker.tasks.download_gdrive_dataset")
def download_gdrive_dataset(job_id: str):
    """
    Download a Google Drive dataset file for a pending job.

    Called immediately after job submission when the client chose the
    Google Drive dataset option. The job stays in 'pending' status until
    this task completes and updates job.dataset_path.

    Flow:
      1. Fetch job from DB
      2. Decrypt refresh token → get fresh Google access token
      3. Get file metadata (name, size)
      4. Download the file to local/OCI storage as dataset.csv
      5. Update job.dataset_path; clear sensitive token fields
      6. Attempt immediate GPU dispatch (mirrors process_job logic)
    """
    _run_async(_download_gdrive_dataset_async(job_id))


async def _download_gdrive_dataset_async(job_id: str):
    engine, session_factory = _get_async_session()
    try:
        async with session_factory() as db:
            result = await db.execute(select(Job).where(Job.id == job_id))
            job = result.scalar_one_or_none()
            if not job:
                print(f"[gdrive_download] Job {job_id} not found")
                return
            if not job.gdrive_file_id or not job.gdrive_refresh_token_enc:
                print(f"[gdrive_download] Job {job_id} has no GDrive credentials — skipping")
                return

            # ── Get Google access token ──
            from app.services.gdrive import get_gdrive
            gdrive = get_gdrive()
            if not gdrive or not gdrive.is_configured:
                print(f"[gdrive_download] GDrive service not configured — cannot download for job {job_id}")
                job.status = JobStatus.failed
                job.logs = "Google Drive integration is not configured on this server."
                await db.commit()
                return

            try:
                access_token = gdrive.get_access_token(job.gdrive_refresh_token_enc)
            except Exception as exc:
                print(f"[gdrive_download] Token refresh failed for job {job_id}: {exc}")
                job.status = JobStatus.failed
                job.logs = f"Failed to refresh Google Drive access token: {exc}"
                await db.commit()
                return

            # ── Download file to local/OCI storage ──
            import tempfile, os as _os
            with tempfile.TemporaryDirectory() as tmp_dir:
                tmp_path = Path(tmp_dir) / "dataset.csv"
                try:
                    await gdrive.download_file(access_token, job.gdrive_file_id, tmp_path)
                except Exception as exc:
                    print(f"[gdrive_download] Download failed for job {job_id}: {exc}")
                    job.status = JobStatus.failed
                    job.logs = f"Failed to download dataset from Google Drive: {exc}"
                    # Clear sensitive token (no longer needed after failure)
                    job.gdrive_refresh_token_enc = None
                    await db.commit()
                    return

                # Save to OCI/local under the job directory
                from app.config import get_settings as _get_settings
                _settings = _get_settings()
                if _settings.oci_storage_enabled:
                    from app.services.storage import get_storage
                    key = f"jobs/{job_id}/dataset.csv"
                    get_storage().upload(key, tmp_path.read_bytes(), content_type="text/csv")
                    dataset_path = key
                else:
                    job_dir = _os.path.join(_settings.UPLOAD_DIR, job_id)
                    _os.makedirs(job_dir, exist_ok=True)
                    dest = Path(job_dir) / "dataset.csv"
                    import shutil
                    shutil.copy(str(tmp_path), str(dest))
                    dataset_path = str(dest)

            # ── Update job record ──
            job.dataset_path = dataset_path
            # Clear the refresh token — it's no longer needed now that the file is downloaded
            job.gdrive_refresh_token_enc = None
            await db.commit()
            print(f"[gdrive_download] Dataset saved for job {job_id} at {dataset_path}")

            # ── Attempt GPU dispatch (same logic as process_job) ──
            if job.status != JobStatus.pending:
                return  # Job status changed while we were downloading

            from app.services.matching import find_available_gpu
            from app.services.connection_manager import manager

            gpu = await find_available_gpu(db, min_vram=0)
            if not gpu:
                print(f"[gdrive_download] No GPU available for job {job_id} — stays pending")
                return

            job.gpu_id = gpu.id
            job.status = JobStatus.queued
            gpu.status = GPUStatus.busy
            await db.commit()

            if manager.is_connected(gpu.id):
                script_name = Path(job.script_path).name
                script_url = f"/jobs/{job.id}/download/{script_name}"
                req_url = None
                if job.requirements_path:
                    req_url = f"/jobs/{job.id}/download/{Path(job.requirements_path).name}"
                dataset_url = f"/jobs/{job.id}/download/dataset.csv"

                await manager.send_to_gpu(gpu.id, {
                    "type": "assign_job",
                    "job_id": job.id,
                    "script_url": script_url,
                    "requirements_url": req_url,
                    "dataset_url": dataset_url,
                })
                print(f"[gdrive_download] Dispatched job {job_id} to GPU {gpu.id}")
    finally:
        await engine.dispose()


@celery_app.task(name="app.worker.tasks.cleanup_stale_job_files")
def cleanup_stale_job_files():
    """Delete OCI storage files for jobs that finished more than 3 days ago.

    Runs daily via Celery Beat. The 3-day window gives users time to retry
    failed jobs before their scripts are permanently removed.
    """
    _run_async(_cleanup_stale_job_files_async())


async def _cleanup_stale_job_files_async():
    engine, session_factory = _get_async_session()
    try:
        # Jobs completed/failed more than 3 days ago that still have files stored
        cutoff = datetime.now(timezone.utc) - timedelta(days=3)
        terminal_statuses = [JobStatus.completed, JobStatus.failed, JobStatus.cancelled]

        async with session_factory() as db:
            result = await db.execute(
                select(Job).where(
                    Job.status.in_(terminal_statuses),
                    Job.completed_at < cutoff,
                    Job.script_path.isnot(None),  # still has files to clean up
                )
            )
            stale_jobs = result.scalars().all()

            if not stale_jobs:
                return

            deleted_count = 0

            if settings.oci_storage_enabled:
                from app.services.storage import get_storage
                storage = get_storage()
                for job in stale_jobs:
                    try:
                        if job.script_path:
                            storage.delete(job.script_path)
                        if job.requirements_path:
                            storage.delete(job.requirements_path)
                        if job.dataset_path:
                            storage.delete(job.dataset_path)
                        if job.artifacts_path:
                            storage.delete(job.artifacts_path)
                        # Clear paths so this job isn't processed again
                        job.script_path = None
                        job.requirements_path = None
                        job.dataset_path = None
                        job.artifacts_path = None
                        deleted_count += 1
                    except Exception as exc:
                        print(f"[cleanup] Failed to delete files for job {job.id}: {exc}")
            else:
                import shutil, os
                for job in stale_jobs:
                    try:
                        job_dir = os.path.join(settings.UPLOAD_DIR, job.id)
                        if os.path.isdir(job_dir):
                            shutil.rmtree(job_dir, ignore_errors=True)
                        job.script_path = None
                        job.requirements_path = None
                        job.dataset_path = None
                        job.artifacts_path = None
                        deleted_count += 1
                    except Exception as exc:
                        print(f"[cleanup] Failed to delete local files for job {job.id}: {exc}")

            await db.commit()
            print(f"[cleanup] Cleaned up files for {deleted_count} stale jobs")
    finally:
        await engine.dispose()

