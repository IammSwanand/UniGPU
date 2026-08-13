from pydantic import BaseModel, EmailStr, model_validator
from datetime import datetime
from app.models.user import UserRole


# ── Request ──
class UserCreate(BaseModel):
    email: str
    username: str
    password: str
    role: UserRole = UserRole.client
    location: str | None = None

    @model_validator(mode='after')
    def check_location(self) -> 'UserCreate':
        if self.role == UserRole.provider and not self.location:
            raise ValueError('Location is required for providers.')
        return self


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
    location: str | None = None

    @model_validator(mode='after')
    def check_location(self) -> 'GoogleAuthRequest':
        if self.role == UserRole.provider and not self.location:
            raise ValueError('Location is required for providers.')
        return self


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
    is_2fa_enabled: bool = False
    created_at: datetime
    github_handle: str | None = None
    linkedin_handle: str | None = None
    huggingface_handle: str | None = None
    kaggle_handle: str | None = None
    location: str | None = None

    class Config:
        from_attributes = True

class UserProfileUpdate(BaseModel):
    username: str | None = None
    github_handle: str | None = None
    linkedin_handle: str | None = None
    huggingface_handle: str | None = None
    kaggle_handle: str | None = None
    location: str | None = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    user_id: str
    email: str
    username: str
    is_email_verified: bool
    is_2fa_enabled: bool = False
    github_handle: str | None = None
    linkedin_handle: str | None = None
    huggingface_handle: str | None = None
    kaggle_handle: str | None = None
    location: str | None = None

# ── 2FA ──
class Login2FAResponse(BaseModel):
    requires_2fa: bool = True
    temp_token: str

class Verify2FARequest(BaseModel):
    temp_token: str
    code: str

class Enable2FARequest(BaseModel):
    code: str

class Setup2FAResponse(BaseModel):
    qr_code: str
    # `secret` intentionally NOT included — it must never be sent to the browser.
    # The QR code contains the provisioning URI which is enough for authenticator apps.
