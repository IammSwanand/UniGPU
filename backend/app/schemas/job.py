from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.job import JobStatus


# ── Response ──
class JobOut(BaseModel):
    id: str
    client_id: str
    gpu_id: Optional[str]
    script_path: str
    requirements_path: Optional[str]
    # Dataset and artifacts — exposed to client
    dataset_path: Optional[str]
    artifacts_path: Optional[str]
    status: JobStatus
    logs: Optional[str]
    created_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    
    duration_seconds: Optional[int]
    cost: Optional[float]

    class Config:
        from_attributes = True
