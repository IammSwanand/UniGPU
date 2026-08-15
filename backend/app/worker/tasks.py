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
from app.models.user_activity import UserActivity

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
                
                # Mark associated running/queued jobs as failed
                job_result = await db.execute(
                    select(Job).where(
                        Job.gpu_id == gpu.id,
                        Job.status.in_([JobStatus.queued, JobStatus.running])
                    )
                )
                orphaned_jobs = job_result.scalars().all()
                for job in orphaned_jobs:
                    job.status = JobStatus.failed
                    job.completed_at = datetime.now(timezone.utc)
                    job.logs = (job.logs or "") + "\n[System] GPU provider disconnected abruptly. Job failed."
                    print(f"Job {job.id} marked as failed due to provider disconnect")
                    
                    
            # Check for jobs running longer than 12 hours
            job_cutoff = datetime.now(timezone.utc) - timedelta(hours=12)
            stale_jobs_result = await db.execute(
                select(Job).where(
                    Job.status == JobStatus.running,
                    Job.started_at.isnot(None),
                    Job.started_at < job_cutoff
                )
            )
            stale_running_jobs = stale_jobs_result.scalars().all()
            for job in stale_running_jobs:
                job.status = JobStatus.failed
                job.completed_at = datetime.now(timezone.utc)
                job.logs = (job.logs or "") + "\n[System] Job exceeded maximum execution time of 12 hours. Forcefully terminated."
                print(f"Job {job.id} marked as failed due to 12-hour timeout")

            if stale_gpus or stale_running_jobs:
                await db.commit()
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


@celery_app.task(name="app.worker.tasks.cleanup_old_activities")
def cleanup_old_activities():
    """Delete activity logs older than 90 days to prevent database bloat."""
    _run_async(_cleanup_old_activities_async())


async def _cleanup_old_activities_async():
    engine, session_factory = _get_async_session()
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(days=90)
        async with session_factory() as db:
            from sqlalchemy import delete
            result = await db.execute(
                delete(UserActivity).where(UserActivity.timestamp < cutoff)
            )
            await db.commit()
            print(f"[cleanup] Deleted {result.rowcount} old activity logs")
    finally:
        await engine.dispose()


@celery_app.task(name="app.worker.tasks.backup_logs_to_supabase")
def backup_logs_to_supabase():
    """Upload rotated activity log files to Supabase Storage and delete them locally."""
    _run_async(_backup_logs_to_supabase_async())


async def _backup_logs_to_supabase_async():
    import os
    import httpx

    # 1. Ensure Supabase credentials are provided
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        print("[backup] Supabase credentials not configured, skipping log backup.")
        return

    log_dir = getattr(settings, "ACTIVITY_LOG_DIR", None) or os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "logs"
    )

    if not os.path.exists(log_dir):
        return

    # 2. Find all rotated log files (e.g. activity.log.1, activity.log.2)
    rotated_files = []
    for filename in os.listdir(log_dir):
        # Guard: only accept expected names — prevents path-traversal via odd filenames
        parts = filename.split(".")
        if (
            filename.startswith("activity.log.")
            and len(parts) == 3
            and parts[-1].isdigit()
            and "/" not in filename
            and "\\" not in filename
        ):
            rotated_files.append(filename)

    if not rotated_files:
        print("[backup] No rotated log files found to backup.")
        return

    headers = {
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        "apiKey": settings.SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": "application/x-ndjson",
    }

    # Fix #3: strip trailing slash so the URL never gets a double-slash
    supabase_base = settings.SUPABASE_URL.rstrip("/")
    base_url = f"{supabase_base}/storage/v1/object/audit-logs"

    uploaded_count = 0
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    async with httpx.AsyncClient(timeout=120.0) as client:
        for filename in rotated_files:
            file_path = os.path.join(log_dir, filename)

            # Fix #4: use the numeric suffix (1-5) as the unique key, not a timestamp.
            # This is stable, collision-free, and matches the rotation index Supabase-side.
            rotation_index = filename.split(".")[-1]   # e.g. "1", "2"
            object_name = f"{today_str}/activity-{rotation_index}.jsonl"
            upload_url = f"{base_url}/{object_name}"

            try:
                # Fix #2: stream the file instead of reading all 10 MB into RAM at once
                with open(file_path, "rb") as f:
                    response = await client.post(upload_url, headers=headers, content=f)

                response.raise_for_status()

                print(f"[backup] Successfully uploaded {filename} → {object_name}")

                # Only delete the local file AFTER a confirmed successful upload
                os.remove(file_path)
                uploaded_count += 1

            except FileNotFoundError:
                # File vanished between listdir and open (TOCTOU) — harmless, skip it
                print(f"[backup] {filename} disappeared before upload, skipping.")
            except Exception as e:
                # Never delete the file if the upload failed — keep it for next run
                print(f"[backup] Failed to upload {filename}: {e}")

    print(f"[backup] Finished backing up {uploaded_count} log files.")

