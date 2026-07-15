import io
import os
import uuid
import mimetypes
import asyncio
import zipfile
from pathlib import Path
from typing import List
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse, RedirectResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.deps import get_current_user, require_role, get_current_user_optional_query
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


def _content_type_for(filename: str) -> str:
    """Guess MIME type from filename extension."""
    ct, _ = mimetypes.guess_type(filename)
    return ct or "application/octet-stream"


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
    # ── Dataset (CSV direct upload) ──
    dataset: UploadFile | None = File(None),
    # ── Google Drive (backend-only OAuth) ──
    gdrive_auth_code: str | None = Form(None),
    gdrive_file_id: str | None = Form(None),
    gdrive_redirect_uri: str | None = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("client", "admin")),
):
    # ── Rate Limiting: Check job submission quota ──
    is_allowed, reason = await check_job_submission_limit(current_user.id)
    if not is_allowed:
        raise HTTPException(status_code=429, detail=reason)

    job_id = str(uuid.uuid4())

    # Save script + requirements (OCI Object Storage or local filesystem)
    script_path, script_size = await _save_file(script, job_id, script.filename)
    req_path = None
    req_size = 0
    if requirements:
        req_path, req_size = await _save_file(requirements, job_id, requirements.filename)

    # ── Dataset: direct CSV upload ──
    dataset_path = None
    dataset_size = 0
    if dataset:
        # Validate CSV extension
        if not (dataset.filename or "").lower().endswith(".csv"):
            raise HTTPException(
                status_code=400,
                detail="Only .csv files are accepted for dataset uploads.",
            )
        # Validate size before reading
        content = await dataset.read()
        dataset_size = len(content)
        if dataset_size > settings.MAX_DATASET_SIZE_BYTES:
            size_gb = dataset_size / (1024 ** 3)
            raise HTTPException(
                status_code=413,
                detail=f"Dataset too large ({size_gb:.2f} GB). Maximum allowed is 2 GB.",
            )
        # Save as dataset.csv (normalise filename so agent always knows the name)
        import io as _io
        dataset_upload = UploadFile(filename="dataset.csv", file=_io.BytesIO(content))
        dataset_path, _ = await _save_file(dataset_upload, job_id, "dataset.csv")

    total_size = script_size + req_size + dataset_size

    # Check daily upload limit
    is_allowed, reason = await check_upload_limit(current_user.id, total_size)
    if not is_allowed:
        raise HTTPException(status_code=429, detail=reason)

    # ── Google Drive: store auth code for background download ──
    gdrive_refresh_token_enc = None
    if gdrive_auth_code and gdrive_file_id:
        if not gdrive_redirect_uri:
            raise HTTPException(
                status_code=400,
                detail="gdrive_redirect_uri is required when using Google Drive.",
            )
        from app.services.gdrive import get_gdrive
        gdrive = get_gdrive()
        if not gdrive or not gdrive.is_configured:
            raise HTTPException(
                status_code=503,
                detail="Google Drive integration is not configured on this server.",
            )
        try:
            token_data = gdrive.exchange_code(gdrive_auth_code, gdrive_redirect_uri)
            gdrive_refresh_token_enc = gdrive.encrypt_token(token_data["refresh_token"])
        except Exception as exc:
            raise HTTPException(
                status_code=400,
                detail=f"Google Drive authentication failed: {exc}",
            )

    job = Job(
        id=job_id,
        client_id=current_user.id,
        script_path=script_path,
        requirements_path=req_path,
        dataset_path=dataset_path,
        gdrive_file_id=gdrive_file_id if gdrive_refresh_token_enc else None,
        gdrive_refresh_token_enc=gdrive_refresh_token_enc,
        status=JobStatus.pending,
    )
    db.add(job)
    await db.flush()

    # Record successful submission
    await record_job_submission(current_user.id, total_size)

    # ── If GDrive dataset requested, queue background download task ──
    # The job stays pending until the Celery task downloads the file and
    # updates dataset_path, then triggers GPU matching.
    if gdrive_refresh_token_enc and gdrive_file_id:
        await db.commit()
        from app.worker.tasks import download_gdrive_dataset
        download_gdrive_dataset.delay(job_id)
        return job

    # ── Match with a GPU and dispatch ──
    from app.services.matching import find_available_gpu_and_lock
    from app.services.connection_manager import manager

    gpu = None
    if gpu_id:
        print(f"📌 Client requested GPU: {gpu_id}")
        result = await db.execute(
            select(GPU)
            .where(GPU.id == gpu_id)
            .with_for_update()
        )
        gpu = result.scalar_one_or_none()

        if gpu and gpu.status == GPUStatus.online:
            now = datetime.now(timezone.utc)
            if gpu.locked_until is None or gpu.locked_until <= now:
                gpu.locked_by_job_id = job_id
                gpu.locked_until = now + timedelta(seconds=30)
                print(f"🔒 Locked GPU {gpu_id} for job {job_id}")
            else:
                print(f"🔐 GPU {gpu_id} is already locked")
                gpu = None
        else:
            print(f"⚠️  Requested GPU {gpu_id} not available (offline or not found)")
            gpu = None

        if not gpu:
            print("🔄 Falling back to auto-match...")
            gpu = await find_available_gpu_and_lock(db, job_id, min_vram=0)
    else:
        print("🔄 No GPU selected, auto-matching...")
        gpu = await find_available_gpu_and_lock(db, job_id, min_vram=0)

    print(f"🎯 Matched GPU: {gpu.id if gpu else 'NONE'}")
    print(f"🔌 Connected GPUs: {manager.get_active_gpu_ids()}")

    if gpu and manager.is_connected(gpu.id):
        job.gpu_id = gpu.id
        job.status = JobStatus.queued
        gpu.status = GPUStatus.busy

        script_name = Path(script_path).name
        script_url = f"/jobs/{job_id}/download/{script_name}"
        req_url = None
        if req_path:
            req_name = Path(req_path).name
            req_url = f"/jobs/{job_id}/download/{req_name}"

        # Dataset URL — agent is source-agnostic (CSV looks the same regardless of origin)
        dataset_url = None
        if dataset_path:
            ds_name = Path(dataset_path).name
            dataset_url = f"/jobs/{job_id}/download/{ds_name}"

        await db.commit()

        print(f"🚀 Dispatching job {job_id} to GPU {gpu.id}")
        await manager.send_to_gpu(gpu.id, {
            "type": "assign_job",
            "job_id": job_id,
            "script_url": script_url,
            "requirements_url": req_url,
            "dataset_url": dataset_url,
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
        media_type=_content_type_for(safe_name),
    )


# ══════════════════════════════════════════════════════════
# Artifact endpoints — agent uploads, client downloads
# ══════════════════════════════════════════════════════════


async def _get_artifact_zip_bytes(job: Job) -> bytes:
    """
    Retrieve the artifacts zip as bytes.
    OCI mode: downloads from object storage.
    Local mode: reads directly from filesystem.
    """
    if settings.oci_storage_enabled:
        from app.services.storage import get_storage
        import boto3
        storage = get_storage()
        obj = storage._s3.get_object(Bucket=storage.bucket, Key=job.artifacts_path)
        return obj["Body"].read()
    else:
        file_path = Path(job.artifacts_path)
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Artifacts file not found on disk.")
        return file_path.read_bytes()


@router.post("/{job_id}/artifacts", status_code=status.HTTP_201_CREATED)
async def upload_job_artifacts(
    job_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Called by the GPU agent after job completion to upload output artifacts.
    The agent sends a zip of everything in /workspace/output/.
    Only the provider whose GPU ran the job (or an admin) may call this.
    """
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Only the provider of the assigned GPU or admin may upload artifacts
    is_provider = False
    if job.gpu_id:
        gpu_result = await db.execute(select(GPU).where(GPU.id == job.gpu_id))
        gpu = gpu_result.scalar_one_or_none()
        if gpu and gpu.provider_id == current_user.id:
            is_provider = True

    if current_user.role.value != "admin" and not is_provider:
        raise HTTPException(status_code=403, detail="Access denied")

    if not file.filename or not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Artifact upload must be a .zip file.")

    artifacts_path, _ = await _save_file(file, job_id, "artifacts.zip")
    job.artifacts_path = artifacts_path
    await db.commit()

    return {"job_id": job_id, "artifacts_path": artifacts_path}


@router.get("/{job_id}/artifacts/list")
async def list_job_artifacts(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List individual files inside the artifacts zip.
    Returns [{name, size_bytes, content_type}] for the UI file-card grid.
    Only the job owner or admin may call this.
    """
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if current_user.role.value != "admin" and job.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    if not job.artifacts_path:
        return []

    try:
        zip_bytes = await _get_artifact_zip_bytes(job)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not read artifacts: {exc}")

    files = []
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        for info in zf.infolist():
            if info.is_dir():
                continue
            name = Path(info.filename).name  # strip leading directory components
            files.append({
                "name": name,
                "size_bytes": info.file_size,
                "content_type": _content_type_for(name),
            })

    return files


@router.get("/{job_id}/artifacts/{filename}")
async def download_artifact_file(
    job_id: str,
    filename: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_optional_query),
):
    """
    Download a single file extracted from the artifacts zip.
    Only the job owner or admin may call this.
    """
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if current_user.role.value != "admin" and job.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    if not job.artifacts_path:
        raise HTTPException(status_code=404, detail="No artifacts available for this job.")

    safe_name = Path(filename).name

    try:
        zip_bytes = await _get_artifact_zip_bytes(job)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not read artifacts: {exc}")

    # Extract the specific file from the zip
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        # Find the entry (may be nested, match on name only)
        matched = [n for n in zf.namelist() if Path(n).name == safe_name]
        if not matched:
            raise HTTPException(status_code=404, detail=f"File '{safe_name}' not found in artifacts.")
        file_bytes = zf.read(matched[0])

    return StreamingResponse(
        io.BytesIO(file_bytes),
        media_type=_content_type_for(safe_name),
        headers={"Content-Disposition": f'attachment; filename="{safe_name}"'},
    )


@router.get("/{job_id}/artifacts")
async def download_artifacts_zip(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_optional_query),
):
    """
    Download the full artifacts zip (all output files bundled together).
    OCI mode: 302 redirect to a 15-minute presigned URL.
    Local mode: streams the file directly.
    Only the job owner or admin may call this.
    """
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if current_user.role.value != "admin" and job.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    if not job.artifacts_path:
        raise HTTPException(status_code=404, detail="No artifacts available for this job.")

    if settings.oci_storage_enabled:
        from app.services.storage import get_storage
        if not get_storage().key_exists(job.artifacts_path):
            raise HTTPException(status_code=404, detail="Artifacts not found in storage.")
        presigned_url = get_storage().get_presigned_url(job.artifacts_path, expires_in=900)
        return RedirectResponse(url=presigned_url, status_code=302)

    file_path = Path(job.artifacts_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Artifacts file not found.")

    return FileResponse(
        path=str(file_path),
        filename=f"artifacts-{job_id}.zip",
        media_type="application/zip",
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
