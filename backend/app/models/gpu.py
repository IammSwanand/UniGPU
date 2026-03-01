import uuid
import enum
from datetime import datetime, timezone

from sqlalchemy import String, Integer, Enum, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class GPUStatus(str, enum.Enum):
    online = "online"
    busy = "busy"
    offline = "offline"


class GPU(Base):
    __tablename__ = "gpus"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    provider_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)  # e.g. "RTX 3060"
    vram_mb: Mapped[int] = mapped_column(Integer, nullable=False)
    cuda_version: Mapped[str] = mapped_column(String, nullable=True)
    status: Mapped[GPUStatus] = mapped_column(
        Enum(GPUStatus), default=GPUStatus.offline, nullable=False
    )
    last_heartbeat: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # relationships
    provider = relationship("User", back_populates="gpus")
    jobs = relationship("Job", back_populates="gpu", lazy="selectin")
