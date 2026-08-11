from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.database import get_db
from app.deps import get_current_user, require_role
from app.models.user import User
from app.models.enterprise import (
    Organization, EnterpriseCluster, EnterpriseNode, EnterpriseNodeStatus
)
from app.schemas.enterprise import (
    OrganizationCreate, OrganizationOut,
    EnterpriseClusterCreate, EnterpriseClusterOut,
    APIKeyResponse
)

router = APIRouter(prefix="/enterprise", tags=["Enterprise"])


@router.post("/orgs", response_model=OrganizationOut, status_code=status.HTTP_201_CREATED)
async def create_organization(
    data: OrganizationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("enterprise", "admin")),
):
    """Create a new enterprise organization"""
    # Check if user already owns an org
    existing = await db.execute(
        select(Organization).where(Organization.owner_id == current_user.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="You already own an organization."
        )

    org = Organization(
        name=data.name,
        owner_id=current_user.id
    )
    db.add(org)
    await db.commit()
    await db.refresh(org)
    return org


@router.get("/orgs/me", response_model=OrganizationOut)
async def get_my_organization(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("enterprise", "admin")),
):
    """Get the current user's organization"""
    result = await db.execute(
        select(Organization).where(Organization.owner_id == current_user.id)
    )
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


import secrets
import hashlib

@router.post("/orgs/me/api-key", response_model=APIKeyResponse)
async def generate_api_key(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("enterprise", "admin")),
):
    """Generate a new API key for the organization. This invalidates the old one."""
    result = await db.execute(
        select(Organization).where(Organization.owner_id == current_user.id)
    )
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Generate raw key
    raw_key = f"unigpu_ent_{secrets.token_urlsafe(32)}"
    
    # Hash for storage (SHA-256 is fast enough for API keys and prevents db leaks)
    key_hash = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()
    
    org.api_key_hash = key_hash
    await db.commit()
    
    # Return raw key ONLY ONCE
    return {"api_key": raw_key}


@router.post("/clusters", response_model=EnterpriseClusterOut, status_code=status.HTTP_201_CREATED)
async def create_cluster(
    data: EnterpriseClusterCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("enterprise", "admin")),
):
    """Create a new Ray cluster for the organization"""
    # Verify the user owns the organization
    org_result = await db.execute(
        select(Organization).where(
            Organization.id == data.organization_id,
            Organization.owner_id == current_user.id
        )
    )
    org = org_result.scalar_one_or_none()
    if not org:
        raise HTTPException(
            status_code=403,
            detail="You do not own this organization or it does not exist."
        )

    cluster = EnterpriseCluster(
        name=data.name,
        organization_id=data.organization_id
    )
    db.add(cluster)
    await db.commit()
    await db.refresh(cluster)
    return cluster


@router.get("/clusters", response_model=List[EnterpriseClusterOut])
async def list_clusters(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("enterprise", "admin")),
):
    """List all clusters belonging to the user's organization"""
    org_result = await db.execute(
        select(Organization).where(Organization.owner_id == current_user.id)
    )
    org = org_result.scalar_one_or_none()
    if not org:
        return []

    result = await db.execute(
        select(EnterpriseCluster).where(EnterpriseCluster.organization_id == org.id)
    )
    return result.scalars().all()


from fastapi import WebSocket, WebSocketDisconnect, Query
import json

# Connection Management for Enterprise
enterprise_connections = {}

@router.websocket("/ws/{cluster_id}")
async def enterprise_websocket(
    websocket: WebSocket, 
    cluster_id: str, 
    api_key: str = Query(...)
):
    """WebSocket for Enterprise CLI Agents to connect and orchestrate Ray."""
    await websocket.accept()

    # 1. Authenticate via API Key
    key_hash = hashlib.sha256(api_key.encode("utf-8")).hexdigest()
    
    # We must use a new session here because websockets are long-lived
    from app.database import async_session
    async with async_session() as db:
        org_result = await db.execute(
            select(Organization).where(Organization.api_key_hash == key_hash)
        )
        org = org_result.scalar_one_or_none()
        if not org:
            await websocket.send_json({"type": "error", "message": "Invalid API Key"})
            await websocket.close(code=1008)
            return

        cluster_result = await db.execute(
            select(EnterpriseCluster).where(
                EnterpriseCluster.id == cluster_id,
                EnterpriseCluster.organization_id == org.id
            )
        )
        cluster = cluster_result.scalar_one_or_none()
        if not cluster:
            await websocket.send_json({"type": "error", "message": "Invalid Cluster ID"})
            await websocket.close(code=1008)
            return
        
        node = EnterpriseNode(
            cluster_id=cluster.id,
            name="Enterprise-Node",
            vram_mb=0,
            status=EnterpriseNodeStatus.online
        )
        db.add(node)
        await db.commit()
        await db.refresh(node)

        # Head Node Election
        is_head = False
        if cluster.head_node_ip is None:
            is_head = True
            await websocket.send_json({
                "type": "START_HEAD",
                "node_id": node.id
            })
        else:
            await websocket.send_json({
                "type": "START_WORKER",
                "node_id": node.id,
                "head_node_ip": cluster.head_node_ip
            })

    if cluster_id not in enterprise_connections:
        enterprise_connections[cluster_id] = []
    enterprise_connections[cluster_id].append(websocket)
    
    try:
        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)
            msg_type = msg.get("type")

            if msg_type == "HEAD_STARTED":
                ip = msg.get("ip")
                async with async_session() as db:
                    c_result = await db.execute(select(EnterpriseCluster).where(EnterpriseCluster.id == cluster_id))
                    c = c_result.scalar_one_or_none()
                    if c:
                        c.head_node_ip = ip
                        await db.commit()
            
            elif msg_type == "TELEMETRY":
                async with async_session() as db:
                    n_result = await db.execute(select(EnterpriseNode).where(EnterpriseNode.id == node.id))
                    n = n_result.scalar_one_or_none()
                    if n:
                        n.vram_mb = msg.get("vram_mb", n.vram_mb)
                        import datetime
                        n.last_heartbeat = datetime.datetime.now(datetime.timezone.utc)
                        await db.commit()
            
    except WebSocketDisconnect:
        if websocket in enterprise_connections.get(cluster_id, []):
            enterprise_connections[cluster_id].remove(websocket)
        async with async_session() as db:
            n_result = await db.execute(select(EnterpriseNode).where(EnterpriseNode.id == node.id))
            n = n_result.scalar_one_or_none()
            if n:
                n.status = EnterpriseNodeStatus.offline
                await db.commit()
            
            if is_head:
                c_result = await db.execute(select(EnterpriseCluster).where(EnterpriseCluster.id == cluster_id))
                c = c_result.scalar_one_or_none()
                if c:
                    c.head_node_ip = None
                    await db.commit()
