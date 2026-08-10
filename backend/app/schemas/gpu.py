from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.gpu import GPUStatus


# ── Request ──
class GPUCreate(BaseModel):
    name: str
    vram_mb: int
    cuda_version: Optional[str] = None


class GPUStatusUpdate(BaseModel):
    status: GPUStatus


# ── Response ──
class ProviderOut(BaseModel):
    username: str
    email_prefix: str
    location: Optional[str] = None
    is_email_verified: bool = False
    github_handle: Optional[str] = None
    linkedin_handle: Optional[str] = None
    huggingface_handle: Optional[str] = None
    kaggle_handle: Optional[str] = None

    class Config:
        from_attributes = True


class GPUOut(BaseModel):
    id: str
    provider_id: str
    name: str
    vram_mb: int
    cuda_version: Optional[str]
    status: GPUStatus
    last_heartbeat: Optional[datetime]
    created_at: datetime
    provider: Optional[ProviderOut] = None

    class Config:
        from_attributes = True
