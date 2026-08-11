from pydantic import BaseModel
from datetime import datetime

# ── Organization Schemas ──

class OrganizationCreate(BaseModel):
    name: str

class OrganizationOut(BaseModel):
    id: str
    name: str
    owner_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# ── Cluster Schemas ──

class EnterpriseClusterCreate(BaseModel):
    name: str
    organization_id: str

class EnterpriseClusterOut(BaseModel):
    id: str
    name: str
    organization_id: str
    head_node_ip: str | None
    created_at: datetime
    
    class Config:
        from_attributes = True

# ── Node Schemas ──

class EnterpriseNodeOut(BaseModel):
    id: str
    cluster_id: str
    name: str
    ip_address: str | None
    vram_mb: int
    status: str
    last_heartbeat: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True
