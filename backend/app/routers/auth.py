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
import httpx

from app.database import get_db
from app.config import get_settings
from app.models.user import User
from app.models.wallet import Wallet
from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserOut,
    Token,
    EmailVerificationRequest,
    ResendVerificationRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    GoogleAuthRequest,
    MessageResponse,
)
from app.security_utils import (
    check_login_attempt, record_failed_login, record_successful_login
)
from app.services.email import send_password_reset_email, send_email_verification_email
from app.redis_rate_limiter import get_rate_limiter

router = APIRouter()
settings = get_settings()
logger = logging.getLogger(__name__)

RESET_TOKEN_EXPIRE_HOURS = 1
MIN_PASSWORD_LENGTH = 8
FORGOT_PASSWORD_MAX_REQUESTS = 5
FORGOT_PASSWORD_WINDOW_SECONDS = 900  # 5 attempts per 15 minutes
EMAIL_VERIFICATION_EXPIRE_HOURS = 24
EMAIL_VERIFICATION_MAX_REQUESTS = 5
EMAIL_VERIFICATION_WINDOW_SECONDS = 900


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def _hash_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _create_reset_token() -> tuple[str, str]:
    raw_token = secrets.token_urlsafe(32)
    return raw_token, _hash_reset_token(raw_token)


def _create_email_verification_token() -> tuple[str, str]:
    raw_token = secrets.token_urlsafe(32)
    return raw_token, _hash_reset_token(raw_token)


def _create_token(user: User) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": user.id, "role": user.role.value, "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def _build_user_out(user: User) -> UserOut:
    return UserOut.model_validate(user)


def _build_token_response(user: User) -> Token:
    return Token(
        access_token=_create_token(user),
        role=user.role,
        user_id=user.id,
        email=user.email,
        username=user.username,
        is_email_verified=user.is_email_verified,
    )


@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: Request,
    data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    # NOTE: registration rate limiting removed for demo/deployment troubleshooting.
    # In production you should re-enable rate limits to prevent abuse (e.g. 5/minute per IP).
    
    # Check duplicates by email only; usernames can repeat.
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    raw_token, token_hash = _create_email_verification_token()

    user = User(
        email=data.email,
        username=data.username,
        hashed_password=_hash_password(data.password),
        role=data.role,
        is_email_verified=False,
        email_verification_token_hash=token_hash,
        email_verification_expires=datetime.now(timezone.utc) + timedelta(hours=EMAIL_VERIFICATION_EXPIRE_HOURS),
    )
    db.add(user)
    await db.flush()

    # Auto-create wallet
    wallet = Wallet(user_id=user.id, balance=0.0)
    db.add(wallet)
    await db.flush()

    verify_url = f"{settings.FRONTEND_URL.rstrip('/')}/verify-email?token={raw_token}"
    try:
        await send_email_verification_email(user.email, verify_url)
    except Exception:
        logger.exception("Failed to send verification email to %s", user.email)
        raise HTTPException(
            status_code=503,
            detail="Unable to send verification email. Please try again later.",
        )

    return MessageResponse(message="Account created. Check your email to verify your account.")


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

    if not user.is_email_verified:
        raise HTTPException(status_code=403, detail="Please verify your email before signing in.")

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
        is_email_verified=user.is_email_verified,
    )


@router.post("/verify-email", response_model=Token)
async def verify_email(
    data: EmailVerificationRequest,
    db: AsyncSession = Depends(get_db),
):
    token_hash = _hash_reset_token(data.token)
    now = datetime.now(timezone.utc)

    result = await db.execute(
        select(User).where(
            User.email_verification_token_hash == token_hash,
            User.email_verification_expires > now,
        )
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification link.")

    user.is_email_verified = True
    user.email_verification_token_hash = None
    user.email_verification_expires = None
    await db.flush()

    return _build_token_response(user)


@router.post("/resend-verification", response_model=MessageResponse)
async def resend_verification(
    request: Request,
    data: ResendVerificationRequest,
    db: AsyncSession = Depends(get_db),
):
    client_ip = request.client.host if request.client else "unknown"
    rate_key = f"{data.email}@{client_ip}"

    if not settings.DEBUG:
        limiter = get_rate_limiter()
        is_allowed, _ = await limiter.check_rate_limit(
            identifier=rate_key,
            limit_type="email_verification",
            requests=EMAIL_VERIFICATION_MAX_REQUESTS,
            window_seconds=EMAIL_VERIFICATION_WINDOW_SECONDS,
        )
        if not is_allowed:
            raise HTTPException(
                status_code=429,
                detail="Too many verification requests. Please try again later.",
            )

    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if user and not user.is_email_verified:
        raw_token, token_hash = _create_email_verification_token()
        user.email_verification_token_hash = token_hash
        user.email_verification_expires = datetime.now(timezone.utc) + timedelta(
            hours=EMAIL_VERIFICATION_EXPIRE_HOURS
        )
        await db.flush()

        verify_url = f"{settings.FRONTEND_URL.rstrip('/')}/verify-email?token={raw_token}"
        try:
            await send_email_verification_email(user.email, verify_url)
        except Exception:
            logger.exception("Failed to resend verification email to %s", user.email)
            user.email_verification_token_hash = None
            user.email_verification_expires = None
            await db.flush()
            raise HTTPException(
                status_code=503,
                detail="Unable to send verification email. Please try again later.",
            )

    if not settings.DEBUG:
        await limiter.record_request(
            identifier=rate_key,
            limit_type="email_verification",
            window_seconds=EMAIL_VERIFICATION_WINDOW_SECONDS,
        )

    return MessageResponse(message="If that account exists, a verification email has been sent.")


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

    return MessageResponse(message="If an account with that email exists, a reset link has been sent.")


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


@router.post("/google", response_model=Token)
async def google_auth(
    data: GoogleAuthRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Authenticate (or register) a user via Google OAuth.

    Flow:
      1. Verify the Google ID Token by calling Google's tokeninfo endpoint.
      2. Validate the `aud` claim matches our client ID to prevent token injection.
      3. Upsert the user record by google_id (create wallet for new users).
      4. For providers: a cli_password MUST be supplied and is stored hashed so the
         Agent desktop app can authenticate via POST /auth/login with email+password.
      5. Return the app's own HS256 JWT (NOT the Google token).
    """
    # ── 1. Verify token with Google ──────────────────────────────────────────
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": data.id_token},
            )
    except httpx.RequestError as exc:
        logger.error("Google tokeninfo request failed: %s", exc)
        raise HTTPException(
            status_code=503,
            detail="Could not reach Google's auth servers. Please try again.",
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Google token.")

    google_payload = resp.json()

    # ── 2. Validate audience ─────────────────────────────────────────────────
    if settings.GOOGLE_CLIENT_ID:
        aud = google_payload.get("aud", "")
        if aud != settings.GOOGLE_CLIENT_ID:
            raise HTTPException(status_code=401, detail="Google token audience mismatch.")

    google_id: str = google_payload.get("sub", "")
    email: str = google_payload.get("email", "")
    name: str = google_payload.get("name") or google_payload.get("given_name") or email.split("@")[0]

    if not google_id or not email:
        raise HTTPException(status_code=400, detail="Google token missing required fields.")

    # ── 3. Provider must supply a CLI password ───────────────────────────────
    if data.role.value == "provider" and not data.cli_password:
        raise HTTPException(
            status_code=422,
            detail="Providers must set a CLI password so the Agent app can authenticate.",
        )

    if data.cli_password and len(data.cli_password) < MIN_PASSWORD_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"CLI password must be at least {MIN_PASSWORD_LENGTH} characters.",
        )

    # ── 4. Upsert user ───────────────────────────────────────────────────────
    # Try to find by google_id first, then fall back to email (handles the case
    # where the user previously registered with the same email via password).
    result = await db.execute(select(User).where(User.google_id == google_id))
    user = result.scalar_one_or_none()

    if user is None:
        # Check if there's already an account with the same email (password user)
        result = await db.execute(select(User).where(User.email == email))
        existing_email_user = result.scalar_one_or_none()
        if existing_email_user:
            # Link the Google identity to the existing account
            user = existing_email_user
            user.google_id = google_id
            # If a CLI password is supplied and the account had no password, set it
            if data.cli_password and user.hashed_password is None:
                user.hashed_password = _hash_password(data.cli_password)
            await db.flush()
        else:
            # Brand-new user — create account
            user = User(
                email=email,
                username=name,
                hashed_password=_hash_password(data.cli_password) if data.cli_password else None,
                role=data.role,
                google_id=google_id,
                is_email_verified=True,  # Google already verified the email
                is_active=True,
            )
            db.add(user)
            await db.flush()

            # Auto-create wallet
            wallet = Wallet(user_id=user.id, balance=0.0)
            db.add(wallet)
            await db.flush()
    else:
        # Returning Google user — update CLI password if a new one is provided
        if data.cli_password:
            user.hashed_password = _hash_password(data.cli_password)
            await db.flush()

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled.")

    # ── 5. Issue app JWT ─────────────────────────────────────────────────────
    return _build_token_response(user)
