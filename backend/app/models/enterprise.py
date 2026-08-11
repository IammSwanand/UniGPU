import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Integer, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
import enum


class EnterpriseNodeStatus(str, enum.Enum):
    online = "online"
    offline = "offline"
    busy = "busy"


class Organization(Base):
    __tablename__ = "enterprise_organizations"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String, nullable=False)
    owner_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    api_key_hash: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # relationships
    owner = relationship("User", foreign_keys=[owner_id])
    clusters = relationship("EnterpriseCluster", back_populates="organization", cascade="all, delete-orphan")


class EnterpriseCluster(Base):
    __tablename__ = "enterprise_clusters"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String, nullable=False)
    organization_id: Mapped[str] = mapped_column(String, ForeignKey("enterprise_organizations.id"), nullable=False)
    head_node_ip: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # relationships
    organization = relationship("Organization", back_populates="clusters")
    nodes = relationship("EnterpriseNode", back_populates="cluster", cascade="all, delete-orphan")


class EnterpriseNode(Base):
    __tablename__ = "enterprise_nodes"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    cluster_id: Mapped[str] = mapped_column(String, ForeignKey("enterprise_clusters.id"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    ip_address: Mapped[str | None] = mapped_column(String, nullable=True)
    vram_mb: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[EnterpriseNodeStatus] = mapped_column(Enum(EnterpriseNodeStatus), default=EnterpriseNodeStatus.offline, nullable=False)
    last_heartbeat: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # relationships
    cluster = relationship("EnterpriseCluster", back_populates="nodes")
