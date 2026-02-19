from pydantic import BaseModel, EmailStr
from datetime import datetime
from app.models.user import UserRole


# ── Request ──
class UserCreate(BaseModel):
    email: str
    username: str
    password: str
    role: UserRole = UserRole.client


class UserLogin(BaseModel):
    username: str
    password: str


# ── Response ──
class UserOut(BaseModel):
    id: str
    email: str
    username: str
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    user_id: str
