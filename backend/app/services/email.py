"""Email delivery for transactional messages (password reset, etc.)."""

import logging
from email.message import EmailMessage

import aiosmtplib

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


async def send_password_reset_email(to_email: str, reset_url: str) -> None:
    """Send a password reset link. Falls back to console logging when SMTP is not configured."""
    subject = "Reset your UniGPU password"
    body = (
        f"Hi,\n\n"
        f"We received a request to reset your UniGPU password.\n\n"
        f"Click the link below to choose a new password (valid for 1 hour):\n"
        f"{reset_url}\n\n"
        f"If you didn't request this, you can safely ignore this email.\n\n"
        f"— UniGPU Team"
    )

    if not settings.smtp_enabled:
        logger.warning(
            "SMTP not configured — password reset link for %s: %s",
            to_email,
            reset_url,
        )
        return

    message = EmailMessage()
    message["From"] = settings.SMTP_FROM
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(body)

    await aiosmtplib.send(
        message,
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USER or None,
        password=settings.SMTP_PASSWORD or None,
        start_tls=settings.SMTP_USE_TLS,
    )
    logger.info("Password reset email sent to %s", to_email)


async def send_email_verification_email(to_email: str, verify_url: str) -> None:
    """Send an email verification link. Falls back to console logging when SMTP is not configured."""
    subject = "Verify your UniGPU email"
    body = (
        f"Hi,\n\n"
        f"Welcome to UniGPU. Please verify your email address to activate your account.\n\n"
        f"Click the link below to verify your email (valid for 24 hours):\n"
        f"{verify_url}\n\n"
        f"If you didn't create this account, you can ignore this message.\n\n"
        f"— UniGPU Team"
    )

    if not settings.smtp_enabled:
        logger.warning(
            "SMTP not configured — email verification link for %s: %s",
            to_email,
            verify_url,
        )
        return

    message = EmailMessage()
    message["From"] = settings.SMTP_FROM
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(body)

    await aiosmtplib.send(
        message,
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USER or None,
        password=settings.SMTP_PASSWORD or None,
        start_tls=settings.SMTP_USE_TLS,
    )
    logger.info("Email verification link sent to %s", to_email)
