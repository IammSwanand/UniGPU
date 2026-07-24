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


class GoogleAuthRequest(BaseModel):
    """
    Sent by the frontend after Google's OAuth popup succeeds.
    - id_token:     The raw Google ID Token (JWT) returned by the Google Login button.
    - role:         The role the user is signing up / in as.
    - cli_password: Required for providers — stored (hashed) so the Agent app can
                    authenticate via the standard POST /auth/login endpoint.
    """
    id_token: str
    role: UserRole = UserRole.client
    cli_password: str | None = None


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
