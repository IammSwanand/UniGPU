from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.deps import require_role
from app.models.user import User
from app.models.gpu import GPU, GPUStatus
from app.models.job import Job, JobStatus
from app.models.user_activity import UserActivity
from app.schemas.user import UserOut
from app.schemas.gpu import GPUOut
from app.schemas.job import JobOut
from app.schemas.user_activity import UserActivityRead
from app.models.settings import SystemSettings
from app.models.wallet import Wallet, Transaction, TransactionType
from app.config import get_settings
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
import httpx

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


@router.get("/users/{user_id}/wallet")
async def admin_get_user_wallet(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    result = await db.execute(select(Wallet).where(Wallet.user_id == user_id))
    wallet = result.scalar_one_or_none()
    if not wallet:
        return {"balance": 0.0, "transactions": []}
    
    transactions = sorted(wallet.transactions, key=lambda t: t.created_at, reverse=True)
    
    return {
        "balance": wallet.balance,
        "transactions": [
            {
                "id": t.id,
                "amount": t.amount,
                "type": t.type,
                "description": t.description,
                "created_at": t.created_at.isoformat()
            } for t in transactions
        ]
    }


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

@router.post("/agent-release")
async def upload_agent_release(
    file: UploadFile = File(...),
    version: str = Form(...),
    patch_notes: str = Form(...),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    settings_cfg = get_settings()
    
    if not settings_cfg.SUPABASE_URL or not settings_cfg.SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase credentials not configured in backend."
        )

    # Clean the filename and construct bucket path
    file_bytes = await file.read()
    bucket_name = "UniGPU_Agent.exe"  # Current public bucket
    object_name = f"UniGPU_Agent_{version.replace(' ', '_')}.exe"

    upload_url = f"{settings_cfg.SUPABASE_URL}/storage/v1/object/{bucket_name}/{object_name}"
    
    headers = {
        "Authorization": f"Bearer {settings_cfg.SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": file.content_type or "application/octet-stream"
    }

    async with httpx.AsyncClient(timeout=300.0) as client:
        resp = await client.post(upload_url, content=file_bytes, headers=headers)
        if resp.status_code not in (200, 201):
            # Try PUT if object already exists
            resp = await client.put(upload_url, content=file_bytes, headers=headers)
            if resp.status_code not in (200, 201):
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Failed to upload to Supabase: {resp.text}"
                )
    
    public_url = f"{settings_cfg.SUPABASE_URL}/storage/v1/object/public/{bucket_name}/{object_name}"

    # Update DB
    result = await db.execute(select(SystemSettings).where(SystemSettings.id == "default"))
    settings_row = result.scalar_one_or_none()
    if not settings_row:
        settings_row = SystemSettings(id="default")
        db.add(settings_row)
    
    settings_row.agent_version = version
    settings_row.agent_patch_notes = patch_notes
    settings_row.agent_download_url = public_url

    await db.commit()
    await db.refresh(settings_row)

    return {
        "message": "Release uploaded successfully",
        "version": settings_row.agent_version,
        "download_url": settings_row.agent_download_url
    }


@router.get("/activities", response_model=List[UserActivityRead])
async def admin_list_activities(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    result = await db.execute(
        select(UserActivity).order_by(UserActivity.timestamp.desc()).offset(skip).limit(limit)
    )
    return result.scalars().all()
