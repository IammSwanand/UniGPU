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

