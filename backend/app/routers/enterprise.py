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

    from sqlalchemy.orm import selectinload
    cluster = EnterpriseCluster(
        name=data.name,
        organization_id=data.organization_id
    )
    db.add(cluster)
    await db.commit()
    
    # Reload with selectinload to populate nodes for serialization
    cluster_result = await db.execute(
        select(EnterpriseCluster)
        .where(EnterpriseCluster.id == cluster.id)
        .options(selectinload(EnterpriseCluster.nodes))
    )
    return cluster_result.scalar_one()




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
        select(EnterpriseCluster)
        .where(EnterpriseCluster.organization_id == org.id)
        .options(selectinload(EnterpriseCluster.nodes))
    )
    return result.scalars().all()


@router.delete("/clusters/{cluster_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cluster(
    cluster_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("enterprise", "admin")),
):
    """Delete a Ray cluster"""
    # Verify organization and ownership
    org_result = await db.execute(
        select(Organization).where(Organization.owner_id == current_user.id)
    )
    org = org_result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=403, detail="No organization found")

    cluster_result = await db.execute(
        select(EnterpriseCluster).where(
            EnterpriseCluster.id == cluster_id,
            EnterpriseCluster.organization_id == org.id
        )
    )
    cluster = cluster_result.scalar_one_or_none()
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found or permission denied")

    await db.delete(cluster)
    await db.commit()
    return None

from fastapi import WebSocket, WebSocketDisconnect, Query
import json

# Connection Management for Enterprise
enterprise_connections = {}
dashboard_connections: dict[str, list[WebSocket]] = {}

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
            
        org_id = org.id

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

        # Notify dashboard
        for dash_ws in dashboard_connections.get(org_id, []):
            try:
                await dash_ws.send_json({
                    "type": "NODE_CONNECTED",
                    "cluster_id": cluster_id,
                    "node_id": node.id,
                    "vram_mb": node.vram_mb
                })
            except:
                pass

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
                vram_mb = msg.get("vram_mb", 0)
                async with async_session() as db:
                    n_result = await db.execute(select(EnterpriseNode).where(EnterpriseNode.id == node.id))
                    n = n_result.scalar_one_or_none()
                    if n:
                        n.vram_mb = vram_mb
                        import datetime
                        n.last_heartbeat = datetime.datetime.now(datetime.timezone.utc)
                        await db.commit()
                
                # Relay to dashboard
                for dash_ws in dashboard_connections.get(org_id, []):
                    try:
                        await dash_ws.send_json({
                            "type": "NODE_TELEMETRY",
                            "cluster_id": cluster_id,
                            "node_id": node.id,
                            "vram_mb": vram_mb
                        })
                    except:
                        pass
            
    except WebSocketDisconnect:
        if websocket in enterprise_connections.get(cluster_id, []):
            enterprise_connections[cluster_id].remove(websocket)
            
        # Notify dashboard
        for dash_ws in dashboard_connections.get(org_id, []):
            try:
                await dash_ws.send_json({
                    "type": "NODE_DISCONNECTED",
                    "cluster_id": cluster_id,
                    "node_id": node.id
                })
            except:
                pass

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

from app.routers.ws import _authenticate_websocket_user

@router.websocket("/ws/dashboard/{org_id}")
async def dashboard_websocket(websocket: WebSocket, org_id: str, token: str | None = Query(default=None)):
    user = await _authenticate_websocket_user(websocket, token)
    if not user:
        return
    
    from app.database import async_session
    async with async_session() as db:
        org_result = await db.execute(
            select(Organization).where(Organization.id == org_id, Organization.owner_id == user.id)
        )
        if not org_result.scalar_one_or_none():
            await websocket.close(code=1008)
            return

    await websocket.accept()
    if org_id not in dashboard_connections:
        dashboard_connections[org_id] = []
    dashboard_connections[org_id].append(websocket)
    
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        if websocket in dashboard_connections.get(org_id, []):
            dashboard_connections[org_id].remove(websocket)
