import os
import uuid
import asyncio
from pathlib import Path
from typing import List
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.deps import get_current_user, require_role
from app.config import get_settings
from app.models.user import User
from app.models.job import Job, JobStatus
from app.models.gpu import GPU, GPUStatus
from app.schemas.job import JobOut
from app.security_utils import (
    check_job_submission_limit, check_upload_limit, record_job_submission
)

router = APIRouter()
settings = get_settings()


async def _save_file(file: UploadFile, job_id: str, filename: str) -> tuple[str, int]:
    """
    Save an uploaded file either to Oracle Cloud Object Storage (production)
    or the local filesystem (development fallback).

    Returns:
        (path_or_key, bytes_written)
        In OCI mode:   path_or_key is the object key  e.g. "jobs/<uuid>/train.py"
        In local mode: path_or_key is the filesystem path e.g. "uploads/<uuid>/train.py"
    """
    content = await file.read()
    size = len(content)

    # ── Try Oracle Cloud Object Storage first ──
    if settings.oci_storage_enabled:
        from app.services.storage import get_storage
        key = f"jobs/{job_id}/{filename}"
        get_storage().upload(key, content, content_type="application/octet-stream")
        return key, size

    # ── Local filesystem fallback (dev / OCI not configured) ──
    job_dir = os.path.join(settings.UPLOAD_DIR, job_id)
    os.makedirs(job_dir, exist_ok=True)
    path = os.path.join(job_dir, filename)
    with open(path, "wb") as f:
        f.write(content)
    return path, size


@router.post("/submit", response_model=JobOut, status_code=status.HTTP_201_CREATED)
async def submit_job(
    script: UploadFile = File(...),
    requirements: UploadFile | None = File(None),
    gpu_id: str | None = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("client", "admin")),
):
    # ── Rate Limiting: Check job submission quota ──
    is_allowed, reason = await check_job_submission_limit(current_user.id)
    if not is_allowed:
        raise HTTPException(status_code=429, detail=reason)
    
    job_id = str(uuid.uuid4())

    # Save files (OCI Object Storage or local filesystem)
    script_path, script_size = await _save_file(script, job_id, script.filename)
    req_path = None
    req_size = 0
    if requirements:
        req_path, req_size = await _save_file(requirements, job_id, requirements.filename)

    total_size = script_size + req_size

    # Check daily upload limit after reading the bytes so we use the actual size
    is_allowed, reason = await check_upload_limit(current_user.id, total_size)
    if not is_allowed:
        raise HTTPException(status_code=429, detail=reason)

    job = Job(
        id=job_id,
        client_id=current_user.id,
        script_path=script_path,
        requirements_path=req_path,
        status=JobStatus.pending,
    )
    db.add(job)
    await db.flush()
    
    # Record successful submission
    await record_job_submission(current_user.id, total_size)

    # Try to match with a GPU and dispatch
    from app.services.matching import find_available_gpu_and_lock, unlock_gpu
    from app.services.connection_manager import manager
    from pathlib import Path

    gpu = None
    if gpu_id:
        # Client selected a specific GPU
        print(f"📌 Client requested GPU: {gpu_id}")
        # Try to lock the specific GPU
        result = await db.execute(
            select(GPU)
            .where(GPU.id == gpu_id)
            .with_for_update()  # Lock the row
        )
        gpu = result.scalar_one_or_none()
        
        if gpu and gpu.status == GPUStatus.online:
            # Check if it's available
            now = datetime.now(timezone.utc)
            if gpu.locked_until is None or gpu.locked_until <= now:
                # Lock it for this job (30 second reservation)
                gpu.locked_by_job_id = job_id
                gpu.locked_until = now + timedelta(seconds=30)
                print(f"🔒 Locked GPU {gpu_id} for job {job_id}")
            else:
                # Already locked
                print(f"🔐 GPU {gpu_id} is already locked")
                gpu = None
        else:
            print(f"⚠️  Requested GPU {gpu_id} not available (offline or not found)")
            gpu = None
        
        # If specific GPU not available, fall back to auto-match
        if not gpu:
            print("🔄 Falling back to auto-match...")
            gpu = await find_available_gpu_and_lock(db, job_id, min_vram=0)
    else:
        print("🔄 No GPU selected, auto-matching...")
        gpu = await find_available_gpu_and_lock(db, job_id, min_vram=0)

    print(f"🎯 Matched GPU: {gpu.id if gpu else 'NONE'}")
    print(f"🔌 Connected GPUs: {manager.get_active_gpu_ids()}")

    if gpu and manager.is_connected(gpu.id):
        # Assign GPU to job
        job.gpu_id = gpu.id
        job.status = JobStatus.queued
        gpu.status = GPUStatus.busy

        # Build download URLs
        script_name = Path(script_path).name
        script_url = f"/jobs/{job_id}/download/{script_name}"
        req_url = None
        if req_path:
            req_name = Path(req_path).name
            req_url = f"/jobs/{job_id}/download/{req_name}"

        await db.commit()

        # Send assign_job via WebSocket
        print(f"🚀 Dispatching job {job_id} to GPU {gpu.id}")
        await manager.send_to_gpu(gpu.id, {
            "type": "assign_job",
            "job_id": job_id,
            "script_url": script_url,
            "requirements_url": req_url,
        })
    else:
        print(f"❌ Cannot dispatch — GPU found: {gpu is not None}, Connected: {manager.is_connected(gpu.id) if gpu else 'N/A'}")
        await db.commit()

    return job


@router.get("/", response_model=List[JobOut])
async def list_jobs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.value == "admin":
        result = await db.execute(select(Job).order_by(Job.created_at.desc()))
    elif current_user.role.value == "provider":
        # Find GPUs owned by provider, then fetch jobs assigned to those GPUs
        result = await db.execute(
            select(Job)
            .join(GPU, Job.gpu_id == GPU.id)
            .where(GPU.provider_id == current_user.id)
            .order_by(Job.created_at.desc())
        )
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

    is_owner = job.client_id == current_user.id
    is_provider = job.gpu_id and (await db.execute(
        select(GPU).where(GPU.id == job.gpu_id, GPU.provider_id == current_user.id)
    )).scalar_one_or_none() is not None
    is_admin = current_user.role.value == "admin"

    if not (is_owner or is_provider or is_admin):
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

    is_owner = job.client_id == current_user.id
    is_provider = job.gpu_id and (await db.execute(
        select(GPU).where(GPU.id == job.gpu_id, GPU.provider_id == current_user.id)
    )).scalar_one_or_none() is not None
    is_admin = current_user.role.value == "admin"

    if not (is_owner or is_provider or is_admin):
        raise HTTPException(status_code=403, detail="Access denied")
    return {"job_id": job.id, "logs": job.logs or ""}


@router.get("/{job_id}/download/{filename}")
async def download_job_file(
    job_id: str,
    filename: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Download a job file (script or requirements).

    In production (OCI enabled): generates a 15-minute pre-signed URL and
    returns a 302 redirect. The agent's httpx client follows it automatically.

    In development (local filesystem): streams the file directly.

    Only the job owner, GPU provider, or admin can download.
    """
    # Verify access: must be job owner, GPU provider, or admin
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    is_owner = job.client_id == current_user.id
    is_provider = job.gpu_id and (await db.execute(
        select(GPU).where(GPU.id == job.gpu_id, GPU.provider_id == current_user.id)
    )).scalar_one_or_none() is not None
    is_admin = current_user.role.value == "admin"

    if not (is_owner or is_provider or is_admin):
        raise HTTPException(status_code=403, detail="Access denied")

    safe_name = Path(filename).name

    # ── OCI mode: redirect to presigned URL ──
    if settings.oci_storage_enabled:
        from app.services.storage import get_storage
        # Determine the object key: stored in script_path / requirements_path
        if job.script_path and job.script_path.endswith(safe_name):
            key = job.script_path
        elif job.requirements_path and job.requirements_path.endswith(safe_name):
            key = job.requirements_path
        else:
            # Construct key as fallback
            key = f"jobs/{job_id}/{safe_name}"

        if not get_storage().key_exists(key):
            raise HTTPException(status_code=404, detail="File not found in storage")

        presigned_url = get_storage().get_presigned_url(key, expires_in=900)
        return RedirectResponse(url=presigned_url, status_code=302)

    # ── Local filesystem fallback ──
    file_path = Path(settings.UPLOAD_DIR) / job_id / safe_name
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        path=str(file_path),
        filename=safe_name,
        media_type="application/octet-stream",
    )


@router.post("/{job_id}/cancel", response_model=JobOut)
async def cancel_job(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cancel a pending, queued, or running job."""
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if current_user.role.value != "admin" and job.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    if job.status.value in ("completed", "failed", "cancelled"):
        raise HTTPException(status_code=400, detail=f"Job already {job.status.value}")

    # If the job is running on a GPU, tell the agent to stop it
    if job.gpu_id and job.status in (JobStatus.running, JobStatus.queued):
        from app.services.connection_manager import manager

        if manager.is_connected(job.gpu_id):
            await manager.send_to_gpu(job.gpu_id, {
                "type": "cancel_job",
                "job_id": job.id,
            })

        # Free up the GPU
        gpu_result = await db.execute(select(GPU).where(GPU.id == job.gpu_id))
        gpu = gpu_result.scalar_one_or_none()
        if gpu and gpu.status == GPUStatus.busy:
            gpu.status = GPUStatus.online

    job.status = JobStatus.cancelled
    job.completed_at = __import__("datetime").datetime.now(__import__("datetime").timezone.utc)
    await db.commit()
    return job


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a completed, failed, or cancelled job."""
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    is_provider = False
    if job.gpu_id:
        gpu_result = await db.execute(select(GPU).where(GPU.id == job.gpu_id))
        gpu = gpu_result.scalar_one_or_none()
        if gpu and gpu.provider_id == current_user.id:
            is_provider = True

    if current_user.role.value != "admin" and not is_provider:
        raise HTTPException(status_code=403, detail="Access denied")

    if job.status.value in ("queued", "running"):
        raise HTTPException(status_code=400, detail="Stop the job before deleting it")

    # ── Clean up stored files ──
    if settings.oci_storage_enabled:
        # Delete from Oracle Cloud Object Storage
        from app.services.storage import get_storage
        storage = get_storage()
        if job.script_path:
            storage.delete(job.script_path)
        if job.requirements_path:
            storage.delete(job.requirements_path)
    else:
        # Delete from local filesystem
        import shutil
        job_dir = os.path.join(settings.UPLOAD_DIR, job_id)
        if os.path.isdir(job_dir):
            shutil.rmtree(job_dir, ignore_errors=True)

    await db.delete(job)
    await db.commit()
