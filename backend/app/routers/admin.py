from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.deps import require_role
from app.models.user import User
from app.models.gpu import GPU, GPUStatus
from app.models.job import Job, JobStatus
from app.schemas.user import UserOut
from app.schemas.gpu import GPUOut
from app.schemas.job import JobOut

router = APIRouter()


@router.get("/gpus", response_model=List[GPUOut])
async def admin_list_gpus(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    result = await db.execute(select(GPU))
    return result.scalars().all()


@router.get("/jobs", response_model=List[JobOut])
async def admin_list_jobs(
    status: JobStatus | None = None,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    query = select(Job)
    if status:
        query = query.where(Job.status == status)
    result = await db.execute(query.order_by(Job.created_at.desc()))
    return result.scalars().all()


@router.get("/users", response_model=List[UserOut])
async def admin_list_users(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    result = await db.execute(select(User))
    return result.scalars().all()


@router.get("/stats")
async def admin_stats(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    total_gpus = (await db.execute(select(func.count(GPU.id)))).scalar() or 0
    online_gpus = (
        await db.execute(select(func.count(GPU.id)).where(GPU.status == GPUStatus.online))
    ).scalar() or 0
    busy_gpus = (
        await db.execute(select(func.count(GPU.id)).where(GPU.status == GPUStatus.busy))
    ).scalar() or 0
    total_jobs = (await db.execute(select(func.count(Job.id)))).scalar() or 0
    active_jobs = (
        await db.execute(
            select(func.count(Job.id)).where(Job.status.in_([JobStatus.queued, JobStatus.running]))
        )
    ).scalar() or 0
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0

    return {
        "total_gpus": total_gpus,
        "online_gpus": online_gpus,
        "busy_gpus": busy_gpus,
        "total_jobs": total_jobs,
        "active_jobs": active_jobs,
        "total_users": total_users,
    }
