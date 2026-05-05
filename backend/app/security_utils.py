"""
Security utilities for account lockout, rate limiting, and progressive delays.
Uses Redis for distributed rate limiting across multiple backend instances.
Implements exponential backoff for brute-force protection.
"""

import asyncio
import time
from typing import Tuple, Optional, Dict
from collections import defaultdict
from app.redis_rate_limiter import get_rate_limiter


# Exponential backoff configuration
PROGRESSIVE_DELAYS = [1.0, 2.0, 4.0, 8.0, 16.0]  # seconds
MAX_FAILED_ATTEMPTS = 3
LOCKOUT_DURATION_SECONDS = 900  # 15 minutes


async def check_login_attempt(
    username: str,
    ip_address: str
) -> Tuple[bool, Optional[str]]:
    """
    Check if a login attempt should be allowed with exponential backoff.
    
    Returns:
        (is_allowed: bool, message: str | None)
            - (True, None) if allowed with no delay
            - (True, delay_info) if allowed with delay needed
            - (False, reason) if blocked due to lockout
    """
    limiter = get_rate_limiter()
    
    is_allowed, delay_or_reason = await limiter.check_login_attempt(
        username=username,
        ip_address=ip_address,
        max_attempts=MAX_FAILED_ATTEMPTS,
        lockout_duration=LOCKOUT_DURATION_SECONDS,
        progressive_delays=PROGRESSIVE_DELAYS
    )
    
    if is_allowed and delay_or_reason:
        # Need to apply progressive delay
        return True, f"Progressive delay: wait {delay_or_reason:.1f}s before retry"
    
    return is_allowed, delay_or_reason


async def record_failed_login(
    username: str,
    ip_address: str
) -> None:
    """Record a failed login attempt with exponential backoff and lockout"""
    limiter = get_rate_limiter()
    
    await limiter.record_failed_login(
        username=username,
        ip_address=ip_address,
        max_attempts=MAX_FAILED_ATTEMPTS,
        lockout_duration=LOCKOUT_DURATION_SECONDS
    )


async def record_successful_login(
    username: str,
    ip_address: str
) -> None:
    """Reset failed login attempts after successful login"""
    limiter = get_rate_limiter()
    await limiter.record_successful_login(
        username=username,
        ip_address=ip_address
    )


async def check_job_submission_limit(
    user_id: str
) -> Tuple[bool, int]:
    """
    Check if user can submit another job (per-hour limit: 10 jobs).
    
    Returns:
        (is_allowed: bool, remaining_quota: int)
    """
    limiter = get_rate_limiter()
    
    is_allowed, remaining = await limiter.check_quota(
        user_id=user_id,
        quota_type="job_submissions",
        limit=10,
        window_seconds=3600  # 1 hour
    )
    
    return is_allowed, remaining


async def check_upload_limit(
    user_id: str,
    bytes_to_upload: int
) -> Tuple[bool, int]:
    """
    Check if user can upload more data (per-day limit: 100 MB).
    
    Returns:
        (is_allowed: bool, remaining_bytes: int)
    """
    limiter = get_rate_limiter()
    
    # 100 MB per day limit
    daily_limit_bytes = 100 * 1024 * 1024
    
    is_allowed, remaining = await limiter.check_daily_limit(
        identifier=user_id,
        limit_type="upload_bytes",
        limit_value=daily_limit_bytes
    )
    
    # Also check if this specific upload would exceed the limit
    if bytes_to_upload > remaining:
        return False, remaining
    
    return is_allowed, remaining


async def record_job_submission(
    user_id: str,
    upload_bytes: int = 0
) -> None:
    """Record a job submission"""
    limiter = get_rate_limiter()
    
    # Record per-hour quota
    await limiter.record_quota_usage(
        user_id=user_id,
        quota_type="job_submissions",
        amount=1,
        window_seconds=3600
    )
    
    # Record daily upload bytes
    if upload_bytes > 0:
        await limiter.add_to_daily_limit(
            identifier=user_id,
            limit_type="upload_bytes",
            amount=float(upload_bytes)
        )


async def check_gpu_registration_limit(
    user_id: str
) -> Tuple[bool, int]:
    """Check if provider can register another GPU (per-hour limit: 10 GPUs)"""
    limiter = get_rate_limiter()
    
    is_allowed, remaining = await limiter.check_quota(
        user_id=user_id,
        quota_type="gpu_registrations",
        limit=10,
        window_seconds=3600
    )
    
    return is_allowed, remaining


async def record_gpu_registration(
    user_id: str
) -> None:
    """Record a GPU registration"""
    limiter = get_rate_limiter()
    
    await limiter.record_quota_usage(
        user_id=user_id,
        quota_type="gpu_registrations",
        amount=1,
        window_seconds=3600
    )


async def check_wallet_topup_limit(
    user_id: str
) -> Tuple[bool, int]:
    """Check if user can do another wallet top-up (per-hour limit: 5 topups)"""
    limiter = get_rate_limiter()
    
    is_allowed, remaining = await limiter.check_quota(
        user_id=user_id,
        quota_type="wallet_topups",
        limit=5,
        window_seconds=3600
    )
    
    return is_allowed, remaining


async def record_wallet_topup(
    user_id: str,
    amount: float
) -> None:
    """Record a wallet top-up"""
    limiter = get_rate_limiter()
    
    # Record per-hour quota
    await limiter.record_quota_usage(
        user_id=user_id,
        quota_type="wallet_topups",
        amount=1,
        window_seconds=3600
    )
    
    # Record daily total
    await limiter.add_to_daily_limit(
        identifier=user_id,
        limit_type="wallet_topup_amount",
        amount=amount
    )


async def check_daily_wallet_total(
    user_id: str,
    amount_to_add: float
) -> Tuple[bool, float]:
    """Check if wallet top-up would exceed daily limit (₹50,000/day)"""
    limiter = get_rate_limiter()
    
    max_daily = 50000.0  # ₹50,000 per day
    
    is_allowed, remaining = await limiter.check_daily_limit(
        identifier=user_id,
        limit_type="wallet_topup_amount",
        limit_value=max_daily
    )
    
    if amount_to_add > remaining:
        return False, remaining
    
    return is_allowed, remaining


async def check_websocket_connections(
    identifier: str,
    connection_type: str
) -> Tuple[bool, int]:
    """
    Check if WebSocket connection is allowed.
    
    Args:
        identifier: User ID or GPU ID
        connection_type: "websocket_agent" or "websocket_provider"
    
    Returns:
        (is_allowed: bool, current_connections: int)
    """
    limiter = get_rate_limiter()
    
    # Limits: 1 for agent, 5 for provider
    max_connections = 1 if connection_type == "websocket_agent" else 5
    
    is_allowed, current = await limiter.track_connection(
        identifier=identifier,
        connection_type=connection_type,
        max_connections=max_connections
    )
    
    return is_allowed, current


async def record_websocket_connection(
    identifier: str,
    connection_type: str
) -> None:
    """Increment WebSocket connection count"""
    limiter = get_rate_limiter()
    await limiter.increment_connection(
        identifier=identifier,
        connection_type=connection_type
    )


async def remove_websocket_connection(
    identifier: str,
    connection_type: str
) -> None:
    """Decrement WebSocket connection count"""
    limiter = get_rate_limiter()
    await limiter.decrement_connection(
        identifier=identifier,
        connection_type=connection_type
    )


# ── Per-User Job Submission Tracking ──
# Structure: {user_id} -> {"last_submission_times": [...], "total_bytes_today": int}
_job_submissions: Dict[str, Dict] = defaultdict(lambda: {
    "last_submission_times": [],
    "total_bytes_today": 0,
    "last_reset_date": datetime.now(timezone.utc).date(),
})

# Configuration
MAX_JOBS_PER_HOUR = 10
MAX_UPLOAD_BYTES_PER_DAY = 100 * 1024 * 1024  # 100 MB


async def check_job_submission_limit(user_id: str) -> Tuple[bool, str | None]:
    """
    Check if user can submit a new job based on hourly limit.
    
    Returns:
        (is_allowed: bool, reason: str | None)
    """
    now = datetime.now(timezone.utc)
    one_hour_ago = (now - timedelta(hours=1)).timestamp()
    
    data = _job_submissions[user_id]
    
    # Clean up timestamps older than 1 hour
    data["last_submission_times"] = [
        ts for ts in data["last_submission_times"] 
        if ts > one_hour_ago
    ]
    
    # Check hourly limit
    if len(data["last_submission_times"]) >= MAX_JOBS_PER_HOUR:
        return False, f"Max {MAX_JOBS_PER_HOUR} jobs per hour. Try again later."
    
    return True, None


async def check_upload_limit(user_id: str, file_size_bytes: int) -> Tuple[bool, str | None]:
    """
    Check if user can upload file based on daily limit.
    
    Returns:
        (is_allowed: bool, reason: str | None)
    """
    now = datetime.now(timezone.utc)
    today = now.date()
    
    data = _job_submissions[user_id]
    
    # Reset daily counter if new day
    if data["last_reset_date"] != today:
        data["total_bytes_today"] = 0
        data["last_reset_date"] = today
    
    # Check if adding this file would exceed limit
    if data["total_bytes_today"] + file_size_bytes > MAX_UPLOAD_BYTES_PER_DAY:
        remaining = MAX_UPLOAD_BYTES_PER_DAY - data["total_bytes_today"]
        return False, f"Daily upload limit exceeded. Remaining: {remaining / 1024 / 1024:.1f}MB"
    
    return True, None


async def record_job_submission(user_id: str, file_size_bytes: int) -> None:
    """Record a successful job submission."""
    now = datetime.now(timezone.utc)
    data = _job_submissions[user_id]
    
    data["last_submission_times"].append(now.timestamp())
    data["total_bytes_today"] += file_size_bytes
