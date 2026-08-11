from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.database import get_db
from app.deps import get_current_user, require_role
from app.models.user import User
from app.models.enterprise import Organization, EnterpriseCluster
from app.schemas.enterprise import (
    OrganizationCreate, OrganizationOut,
    EnterpriseClusterCreate, EnterpriseClusterOut
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
