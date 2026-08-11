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
from app.models.settings import SystemSettings
from app.models.wallet import Wallet, Transaction, TransactionType

router = APIRouter()

@router.get("/settings")
async def get_system_settings(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    result = await db.execute(select(SystemSettings).where(SystemSettings.id == "default"))
    settings = result.scalar_one_or_none()
    if not settings:
        settings = SystemSettings(id="default", overdraft_limit=-50.0)
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    return {"overdraft_limit": settings.overdraft_limit}

@router.patch("/settings")
async def update_system_settings(
    data: dict,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    result = await db.execute(select(SystemSettings).where(SystemSettings.id == "default"))
    settings = result.scalar_one_or_none()
    if not settings:
        settings = SystemSettings(id="default", overdraft_limit=-50.0)
        db.add(settings)
    
    if "overdraft_limit" in data:
        settings.overdraft_limit = float(data["overdraft_limit"])
        
    await db.commit()
    await db.refresh(settings)
    return {"overdraft_limit": settings.overdraft_limit}

@router.post("/users/{user_id}/unblock-wallet")
async def admin_unblock_wallet(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    from fastapi import HTTPException, status
    result = await db.execute(select(Wallet).where(Wallet.user_id == user_id))
    wallet = result.scalar_one_or_none()
    if not wallet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Wallet not found")

    if wallet.balance < 0:
        amount_to_add = abs(wallet.balance)
        wallet.balance = 0.0
        tx = Transaction(
            wallet_id=wallet.id,
            amount=amount_to_add,
            type=TransactionType.credit,
            description="Admin Manual Unblock (Debt Forgiven)"
        )
        db.add(tx)
        await db.commit()
    return {"status": "success", "message": "Wallet unblocked and balance reset to 0."}


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


@router.patch("/users/{user_id}/toggle-active", response_model=UserOut)
async def admin_toggle_user_active(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    from fastapi import HTTPException, status
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Don't let the admin disable themselves accidentally? Optional.
    if user.id == _admin.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot toggle your own status")

    user.is_active = not user.is_active
    await db.commit()
    await db.refresh(user)
    return user



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
