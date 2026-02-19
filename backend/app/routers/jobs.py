import os
import uuid
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.deps import get_current_user, require_role
from app.config import get_settings
from app.models.user import User
from app.models.job import Job, JobStatus
from app.schemas.job import JobOut

router = APIRouter()
settings = get_settings()


async def _save_upload(file: UploadFile, job_id: str, filename: str) -> str:
    """Save an uploaded file to uploads/<job_id>/<filename>."""
    job_dir = os.path.join(settings.UPLOAD_DIR, job_id)
    os.makedirs(job_dir, exist_ok=True)
    path = os.path.join(job_dir, filename)
    content = await file.read()
    with open(path, "wb") as f:
        f.write(content)
    return path


@router.post("/submit", response_model=JobOut, status_code=status.HTTP_201_CREATED)
async def submit_job(
    script: UploadFile = File(...),
    requirements: UploadFile | None = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("client", "admin")),
):
    job_id = str(uuid.uuid4())

    # Save files
    script_path = await _save_upload(script, job_id, script.filename)
    req_path = None
    if requirements:
        req_path = await _save_upload(requirements, job_id, requirements.filename)

    job = Job(
        id=job_id,
        client_id=current_user.id,
        script_path=script_path,
        requirements_path=req_path,
        status=JobStatus.pending,
    )
    db.add(job)
    await db.flush()
    return job


@router.get("/", response_model=List[JobOut])
async def list_jobs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.value == "admin":
        result = await db.execute(select(Job).order_by(Job.created_at.desc()))
    else:
        result = await db.execute(
            select(Job).where(Job.client_id == current_user.id).order_by(Job.created_at.desc())
        )
    return result.scalars().all()


@router.get("/{job_id}", response_model=JobOut)
async def get_job(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if current_user.role.value != "admin" and job.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return job


@router.get("/{job_id}/logs")
async def get_job_logs(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if current_user.role.value != "admin" and job.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return {"job_id": job.id, "logs": job.logs or ""}


@router.get("/{job_id}/download/{filename}")
async def download_job_file(job_id: str, filename: str):
    """Download a job file (script or requirements).

    Used by GPU agents to fetch job files over HTTP.
    No auth required — job UUID is unguessable.
    """
    # Sanitise filename to prevent path traversal
    safe_name = Path(filename).name
    file_path = Path(settings.UPLOAD_DIR) / job_id / safe_name

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        path=str(file_path),
        filename=safe_name,
        media_type="application/octet-stream",
    )
