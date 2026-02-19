import json
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select

from app.database import async_session
from app.models.gpu import GPU, GPUStatus
from app.models.job import Job, JobStatus
from app.services.connection_manager import manager
from app.services.billing import charge_client

router = APIRouter()


@router.websocket("/ws/agent/{gpu_id}")
async def agent_websocket(websocket: WebSocket, gpu_id: str):
    """WebSocket endpoint for GPU agents.

    Protocol messages (JSON):
      Agent → Server:
        {"type": "heartbeat"}
        {"type": "job_status", "job_id": "...", "status": "running|completed|failed"}
        {"type": "log", "job_id": "...", "data": "..."}

      Server → Agent:
        {"type": "assign_job", "job_id": "...", "script_url": "/jobs/.../download/...", "requirements_url": "..."|null}
    """
    # Optional: validate token via query param (token = websocket.query_params.get("token"))
    await manager.connect(gpu_id, websocket)
    print(f"🔌 GPU agent connected: {gpu_id}")

    # Mark GPU as online
    async with async_session() as db:
        result = await db.execute(select(GPU).where(GPU.id == gpu_id))
        gpu = result.scalar_one_or_none()
        if gpu:
            gpu.status = GPUStatus.online
            gpu.last_heartbeat = datetime.now(timezone.utc)
            await db.commit()

    try:
        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)
            msg_type = msg.get("type")

            if msg_type == "heartbeat":
                async with async_session() as db:
                    result = await db.execute(select(GPU).where(GPU.id == gpu_id))
                    gpu = result.scalar_one_or_none()
                    if gpu:
                        gpu.last_heartbeat = datetime.now(timezone.utc)
                        await db.commit()

            elif msg_type == "job_status":
                job_id = msg.get("job_id")
                new_status = msg.get("status")
                async with async_session() as db:
                    result = await db.execute(select(Job).where(Job.id == job_id))
                    job = result.scalar_one_or_none()
                    if job:
                        if new_status == "running":
                            job.status = JobStatus.running
                            job.started_at = datetime.now(timezone.utc)
                        elif new_status == "completed":
                            job.status = JobStatus.completed
                            job.completed_at = datetime.now(timezone.utc)
                            # Bill the client
                            await charge_client(db, job)
                            # Free the GPU
                            gpu_result = await db.execute(select(GPU).where(GPU.id == gpu_id))
                            gpu = gpu_result.scalar_one_or_none()
                            if gpu:
                                gpu.status = GPUStatus.online
                        elif new_status == "failed":
                            job.status = JobStatus.failed
                            job.completed_at = datetime.now(timezone.utc)
                            gpu_result = await db.execute(select(GPU).where(GPU.id == gpu_id))
                            gpu = gpu_result.scalar_one_or_none()
                            if gpu:
                                gpu.status = GPUStatus.online
                        await db.commit()

            elif msg_type == "log":
                job_id = msg.get("job_id")
                log_data = msg.get("data", "")
                async with async_session() as db:
                    result = await db.execute(select(Job).where(Job.id == job_id))
                    job = result.scalar_one_or_none()
                    if job:
                        job.logs = (job.logs or "") + log_data + "\n"
                        await db.commit()

    except WebSocketDisconnect:
        manager.disconnect(gpu_id)
        print(f"🔌 GPU agent disconnected: {gpu_id}")
        # Mark GPU as offline
        async with async_session() as db:
            result = await db.execute(select(GPU).where(GPU.id == gpu_id))
            gpu = result.scalar_one_or_none()
            if gpu:
                gpu.status = GPUStatus.offline
                await db.commit()
