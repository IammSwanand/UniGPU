from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from app.models.gpu import GPU, GPUStatus
from app.services.connection_manager import manager
from datetime import datetime, timedelta, timezone


async def find_available_gpu(db: AsyncSession, min_vram: int = 0) -> GPU | None:
    """Find the best available GPU with at least min_vram VRAM (MB).

    Returns the GPU with the lowest sufficient VRAM (best fit) whose agent
    hasn't reported Docker as down (in-memory only — unknown/never-reported
    GPUs are still considered available).
    """
    result = await db.execute(
        select(GPU)
        .where(GPU.status == GPUStatus.online, GPU.vram_mb >= min_vram)
        .order_by(GPU.vram_mb.asc())
        .limit(10)
    )
    candidates = result.scalars().all()
    return next((gpu for gpu in candidates if manager.get_docker_status(gpu.id) is not False), None)


async def find_available_gpu_and_lock(
    db: AsyncSession,
    job_id: str,
    min_vram: int = 0,
    lock_duration_seconds: int = 30
) -> GPU | None:
    """Find available GPU, lock it pessimistically, and return it.

    This uses database-level locking (FOR UPDATE) to ensure only one job
    can acquire a GPU at a time, preventing race conditions. Candidates whose
    agent has reported Docker as down (in-memory only) are skipped.

    Args:
        db: Database session
        job_id: ID of the job acquiring the lock
        min_vram: Minimum VRAM required (MB)
        lock_duration_seconds: How long to hold the lock

    Returns:
        GPU if found and locked, None otherwise
    """
    now = datetime.now(timezone.utc)
    lock_expiry = now + timedelta(seconds=lock_duration_seconds)

    lock_available = or_(
        GPU.locked_until.is_(None),
        GPU.locked_until <= now  # Lock expired
    )

    # Fetch a bounded candidate pool (best-fit order) so we can skip any
    # whose Docker daemon is known to be down without needing a DB column.
    result = await db.execute(
        select(GPU)
        .where(
            and_(
                GPU.status == GPUStatus.online,
                GPU.vram_mb >= min_vram,
                lock_available,
            )
        )
        .order_by(GPU.vram_mb.asc())
        .limit(10)
    )
    candidates = result.scalars().all()
    chosen = next((gpu for gpu in candidates if manager.get_docker_status(gpu.id) is not False), None)
    if chosen is None:
        return None

    # Re-fetch and lock the chosen row atomically — re-checks lock_available
    # in case another request claimed it between the two queries above.
    result = await db.execute(
        select(GPU)
        .where(GPU.id == chosen.id, lock_available)
        .with_for_update()  # ← PESSIMISTIC LOCK: Hold row lock until commit
    )
    gpu = result.scalar_one_or_none()

    if gpu:
        # Acquire lock for this job
        gpu.locked_by_job_id = job_id
        gpu.locked_until = lock_expiry

    return gpu


async def unlock_gpu(gpu: GPU) -> None:
    """Release lock on a GPU."""
    gpu.locked_by_job_id = None
    gpu.locked_until = None


async def cleanup_expired_locks(db: AsyncSession) -> int:
    """Clean up expired GPU locks.
    
    Periodically called to release locks that have expired.
    Returns the number of locks cleaned up.
    """
    now = datetime.now(timezone.utc)
    
    result = await db.execute(
        select(GPU)
        .where(
            and_(
                GPU.locked_until.isnot(None),
                GPU.locked_until <= now
            )
        )
    )
    expired_gpus = result.scalars().all()
    
    for gpu in expired_gpus:
        await unlock_gpu(gpu)
    
    if expired_gpus:
        await db.commit()
    
    return len(expired_gpus)
