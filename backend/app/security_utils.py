"""
Security utilities for account lockout, rate limiting, and progressive delays.
Tracks failed login attempts per user/IP and enforces progressive delays.
"""

import asyncio
import time
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Dict, Tuple

# ── Failed Login Tracking ──
# Structure: {identifier} -> (failure_count, last_failure_timestamp, locked_until)
_failed_attempts: Dict[str, Tuple[int, float, float]] = defaultdict(lambda: (0, 0.0, 0.0))

# Configuration
MAX_FAILED_ATTEMPTS = 3
LOCKOUT_DURATION_SECONDS = 900  # 15 minutes
PROGRESSIVE_DELAYS = [1.0, 2.0, 4.0]  # Seconds: 1s, 2s, 4s


def _get_identifier(username: str, ip_address: str) -> str:
    """Generate a unique identifier combining username and IP for tracking."""
    return f"{username}@{ip_address}"


async def check_login_attempt(username: str, ip_address: str) -> Tuple[bool, str | None]:
    """
    Check if a login attempt should be allowed.
    
    Returns:
        (is_allowed: bool, delay_seconds: float | None)
            - (True, None) if allowed with no delay
            - (True, delay) if allowed but with progressive delay
            - (False, reason) if blocked due to lockout
    """
    identifier = _get_identifier(username, ip_address)
    now = time.time()
    
    failures, last_failure, locked_until = _failed_attempts[identifier]
    
    # Check if account is currently locked
    if now < locked_until:
        remaining = locked_until - now
        reason = f"Account locked for {remaining:.0f} more seconds"
        return False, reason
    
    # If lockout expired, reset counter
    if locked_until > 0 and now >= locked_until:
        _failed_attempts[identifier] = (0, now, 0.0)
        return True, None
    
    # Calculate progressive delay based on previous failures
    delay = PROGRESSIVE_DELAYS[min(failures, len(PROGRESSIVE_DELAYS) - 1)]
    
    return True, delay if failures > 0 else None


async def record_failed_login(username: str, ip_address: str) -> None:
    """Record a failed login attempt and enforce lockout if threshold reached."""
    identifier = _get_identifier(username, ip_address)
    now = time.time()
    
    failures, _, _ = _failed_attempts[identifier]
    failures += 1
    
    locked_until = 0.0
    if failures >= MAX_FAILED_ATTEMPTS:
        # Lock the account for 15 minutes
        locked_until = now + LOCKOUT_DURATION_SECONDS
    
    _failed_attempts[identifier] = (failures, now, locked_until)


async def record_successful_login(username: str, ip_address: str) -> None:
    """Reset failed attempts counter after successful login."""
    identifier = _get_identifier(username, ip_address)
    _failed_attempts[identifier] = (0, 0.0, 0.0)


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
