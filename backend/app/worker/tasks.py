import asyncio
from datetime import datetime, timezone, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.worker.celery_app import celery_app
from app.config import get_settings
from app.models.gpu import GPU, GPUStatus
from app.models.job import Job, JobStatus
from app.services.connection_manager import manager

settings = get_settings()

# Worker needs its own async engine (runs in a separate process)
_engine = create_async_engine(settings.DATABASE_URL, echo=False)
_async_session = async_sessionmaker(_engine, class_=AsyncSession, expire_on_commit=False)


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
    async with _async_session() as db:
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
        if manager.is_connected(gpu.id):
            await manager.send_to_gpu(gpu.id, {
                "type": "assign_job",
                "job_id": job.id,
                "script_path": job.script_path,
                "requirements_path": job.requirements_path,
            })


@celery_app.task(name="app.worker.tasks.check_heartbeats")
def check_heartbeats():
    """Mark GPUs as offline if heartbeat is stale."""
    _run_async(_check_heartbeats_async())


async def _check_heartbeats_async():
    cutoff = datetime.now(timezone.utc) - timedelta(seconds=settings.HEARTBEAT_TIMEOUT_SECONDS)
    async with _async_session() as db:
        result = await db.execute(
            select(GPU).where(
                GPU.status != GPUStatus.offline,
                GPU.last_heartbeat < cutoff,
            )
        )
        stale_gpus = result.scalars().all()
        for gpu in stale_gpus:
            gpu.status = GPUStatus.offline
            print(f"⏰ GPU {gpu.id} ({gpu.name}) marked offline — stale heartbeat")
        if stale_gpus:
            await db.commit()
