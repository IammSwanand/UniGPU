from pydantic import BaseModel, EmailStr
from datetime import datetime
from app.models.user import UserRole


# ── Request ──
class UserCreate(BaseModel):
    email: str
    username: str
    password: str
    role: UserRole = UserRole.client


class EmailVerificationRequest(BaseModel):
    token: str


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class MessageResponse(BaseModel):
    message: str


# ── Response ──
class UserOut(BaseModel):
    id: str
    email: str
    username: str
    role: UserRole
    is_email_verified: bool
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    user_id: str
    email: str
    username: str
    is_email_verified: bool
