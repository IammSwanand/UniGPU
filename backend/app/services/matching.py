from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.gpu import GPU, GPUStatus


async def find_available_gpu(db: AsyncSession, min_vram: int = 0) -> GPU | None:
    """Find the best available GPU with at least min_vram VRAM (MB).

    Returns the GPU with the lowest sufficient VRAM (best fit).
    """
    result = await db.execute(
        select(GPU)
        .where(GPU.status == GPUStatus.online, GPU.vram_mb >= min_vram)
        .order_by(GPU.vram_mb.asc())
        .limit(1)
    )
    return result.scalar_one_or_none()
