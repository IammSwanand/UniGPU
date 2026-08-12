import uuid
from sqlalchemy import String, Float
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class SystemSettings(Base):
    __tablename__ = "system_settings"

    id: Mapped[str] = mapped_column(String, primary_key=True, default="default")
    overdraft_limit: Mapped[float] = mapped_column(Float, default=-50.0)
