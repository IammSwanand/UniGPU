from datetime import datetime, timedelta, timezone
import hashlib
import logging
import secrets

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt
import bcrypt
import asyncio

from app.database import get_db
from app.config import get_settings
from app.models.user import User
from app.models.wallet import Wallet
from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserOut,
    Token,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    MessageResponse,
)
from app.security_utils import (
    check_login_attempt, record_failed_login, record_successful_login
)
from app.services.email import send_password_reset_email
from app.redis_rate_limiter import get_rate_limiter

router = APIRouter()
settings = get_settings()
logger = logging.getLogger(__name__)

RESET_TOKEN_EXPIRE_HOURS = 1
MIN_PASSWORD_LENGTH = 8
FORGOT_PASSWORD_MAX_REQUESTS = 5
FORGOT_PASSWORD_WINDOW_SECONDS = 900  # 5 attempts per 15 minutes


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def _hash_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _create_reset_token() -> tuple[str, str]:
    raw_token = secrets.token_urlsafe(32)
    return raw_token, _hash_reset_token(raw_token)


def _create_token(user: User) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": user.id, "role": user.role.value, "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(
    request: Request,
    data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    # NOTE: registration rate limiting removed for demo/deployment troubleshooting.
    # In production you should re-enable rate limits to prevent abuse (e.g. 5/minute per IP).
    
    # Check duplicates
    existing = await db.execute(
        select(User).where((User.email == data.email) | (User.username == data.username))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email or username already registered")

    user = User(
        email=data.email,
        username=data.username,
        hashed_password=_hash_password(data.password),
        role=data.role,
    )
    db.add(user)
    await db.flush()

    # Auto-create wallet
    wallet = Wallet(user_id=user.id, balance=0.0)
    db.add(wallet)
    await db.flush()

    return user


@router.post("/login", response_model=Token)
async def login(
    request: Request,
    data: UserLogin,
    db: AsyncSession = Depends(get_db),
):
    """
    Login with email and password.
    Failed attempts use progressive delays (1s → 8s), then lockout after 8 failures for 5 minutes.
    """
    client_ip = request.client.host if request.client else "unknown"
    login_key = data.email.lower()

    is_allowed, delay_info = await check_login_attempt(login_key, client_ip)
    if not is_allowed:
        raise HTTPException(status_code=429, detail=delay_info)

    if delay_info and "wait" in delay_info:
        try:
            delay_str = delay_info.split("wait ")[1].split("s")[0]
            delay = float(delay_str)
            await asyncio.sleep(delay)
        except (IndexError, ValueError):
            pass

    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not _verify_password(data.password, user.hashed_password):
        await record_failed_login(login_key, client_ip)
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

    await record_successful_login(login_key, client_ip)

    token = _create_token(user)
    return Token(
        access_token=token,
        role=user.role,
        user_id=user.id,
        email=user.email,
        username=user.username,
    )


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    request: Request,
    data: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Request a password reset link sent to the user's email."""
    client_ip = request.client.host if request.client else "unknown"
    rate_key = f"{data.email}@{client_ip}"

    if not settings.DEBUG:
        limiter = get_rate_limiter()
        is_allowed, _ = await limiter.check_rate_limit(
            identifier=rate_key,
            limit_type="forgot_password",
            requests=FORGOT_PASSWORD_MAX_REQUESTS,
            window_seconds=FORGOT_PASSWORD_WINDOW_SECONDS,
        )
        if not is_allowed:
            raise HTTPException(
                status_code=429,
                detail="Too many reset requests. Please try again later.",
            )

    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if user and user.is_active:
        raw_token, token_hash = _create_reset_token()
        user.reset_token_hash = token_hash
        user.reset_token_expires = datetime.now(timezone.utc) + timedelta(
            hours=RESET_TOKEN_EXPIRE_HOURS
        )
        await db.flush()

        reset_url = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password?token={raw_token}"
        try:
            await send_password_reset_email(user.email, reset_url)
        except Exception:
            logger.exception("Failed to send password reset email to %s", user.email)
            user.reset_token_hash = None
            user.reset_token_expires = None
            await db.flush()
            raise HTTPException(
                status_code=503,
                detail="Unable to send reset email. Please try again later.",
            )

    if not settings.DEBUG:
        await limiter.record_request(
            identifier=rate_key,
            limit_type="forgot_password",
            window_seconds=FORGOT_PASSWORD_WINDOW_SECONDS,
        )

    return MessageResponse(
        message="If an account with that email exists, a reset link has been sent."
    )


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    data: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Set a new password using a valid reset token."""
    if len(data.new_password) < MIN_PASSWORD_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Password must be at least {MIN_PASSWORD_LENGTH} characters.",
        )

    token_hash = _hash_reset_token(data.token)
    now = datetime.now(timezone.utc)

    result = await db.execute(
        select(User).where(
            User.reset_token_hash == token_hash,
            User.reset_token_expires > now,
        )
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired reset token.",
        )

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

    user.hashed_password = _hash_password(data.new_password)
    user.reset_token_hash = None
    user.reset_token_expires = None
    await db.flush()

    return MessageResponse(message="Password updated successfully. You can now sign in.")
