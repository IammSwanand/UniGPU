import hashlib
import json
import logging
import os
from logging.handlers import RotatingFileHandler
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import Request

from app.config import get_settings

# ── File logger (lazy-initialized on first use) ────────────────────────────────
_activity_file_logger: logging.Logger | None = None


def _get_file_logger() -> logging.Logger:
    """Lazily initialize the rotating file logger so it doesn't run at import time."""
    global _activity_file_logger
    if _activity_file_logger is not None:
        return _activity_file_logger

    settings = get_settings()
    # Use configurable log dir; fall back to a sibling of the backend root
    log_dir = getattr(settings, "ACTIVITY_LOG_DIR", None) or os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "logs"
    )
    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, "activity.log")

    logger = logging.getLogger("user_activities")
    logger.setLevel(logging.INFO)
    logger.propagate = False  # don't bubble up to root logger

    if not logger.handlers:
        # Rotate after 10 MB, keep 5 backups
        handler = RotatingFileHandler(log_file, maxBytes=10 * 1024 * 1024, backupCount=5)
        handler.setFormatter(logging.Formatter("%(message)s"))
        logger.addHandler(handler)

    _activity_file_logger = logger
    return logger


def _hash_email(email: str) -> str:
    """One-way hash of an email for file logs — prevents PII exposure."""
    return hashlib.sha256(email.encode()).hexdigest()[:16]


async def log_activity(
    action: str,
    description: str,
    user=None,
    request: Optional[Request] = None,
    metadata_payload: Optional[Dict[str, Any]] = None,
):
    """
    Log a user activity to both the database (via its own session) and a
    rotating JSONL file.

    Designed to be called from FastAPI BackgroundTasks.  Uses its own DB
    session so it is completely decoupled from the request session lifecycle.
    """
    # ── Extract request context ────────────────────────────────────────────────
    ip_address: str | None = None
    user_agent: str | None = None

    if request:
        if request.client:
            ip_address = request.client.host
        raw_ua = request.headers.get("user-agent", "")
        # Truncate to 512 chars to prevent oversized values
        user_agent = raw_ua[:512] if raw_ua else None

    # ── Extract user info safely ───────────────────────────────────────────────
    user_id = str(user.id) if user and hasattr(user, "id") else None
    username = user.username if user and hasattr(user, "username") else None
    role = getattr(user.role, "value", str(user.role)) if user and hasattr(user, "role") else None

    timestamp = datetime.now(timezone.utc)

    # ── 1. Persist to database (own session, not the request session) ──────────
    try:
        from app.database import async_session
        from app.models.user_activity import UserActivity

        db_activity = UserActivity(
            timestamp=timestamp,
            user_id=user_id,
            username=username,
            role=role,
            action=action,
            description=description,
            metadata_payload=metadata_payload,
            ip_address=ip_address,
            user_agent=user_agent,
        )

        async with async_session() as db:
            db.add(db_activity)
            await db.commit()
    except Exception:
        # Logging must never crash the application
        logging.getLogger("unigpu.activity").exception(
            "Failed to persist activity log to DB: action=%s user_id=%s", action, user_id
        )

    # ── 2. Write to rotating JSONL file (no PII email, hashed only) ───────────
    try:
        # Safely grab hashed email only if user has one — never store plaintext
        email_hash: str | None = None
        if user and hasattr(user, "email") and user.email:
            email_hash = _hash_email(user.email)

        log_entry = {
            "timestamp": timestamp.isoformat(),
            "user_id": user_id,
            "username": username,
            "email_hash": email_hash,  # hashed — not plaintext
            "role": role,
            "action": action,
            "description": description,
            "metadata_payload": metadata_payload,
            "ip_address": ip_address,
            # user_agent omitted from file log (can contain fingerprinting data)
        }
        _get_file_logger().info(json.dumps(log_entry))
    except Exception:
        logging.getLogger("unigpu.activity").exception(
            "Failed to write activity log to file: action=%s", action
        )
