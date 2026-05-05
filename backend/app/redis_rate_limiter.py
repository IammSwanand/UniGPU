"""
Redis-backed rate limiter for distributed deployments.
Supports multi-instance rate limiting across backend replicas.
"""

import json
import time
import redis
from typing import Tuple, Optional, Dict, Any
from datetime import datetime, timedelta, timezone
import math


class RedisRateLimiter:
    """Distributed rate limiter using Redis backend"""
    
    def __init__(self, redis_url: str = "redis://localhost:6379/0"):
        """Initialize Redis connection"""
        self.redis = redis.from_url(redis_url, decode_responses=True)
        
    def _make_key(self, namespace: str, identifier: str) -> str:
        """Generate Redis key for tracking"""
        return f"rate_limit:{namespace}:{identifier}"
    
    def _make_attempt_key(self, namespace: str, identifier: str) -> str:
        """Generate Redis key for attempt tracking"""
        return f"attempts:{namespace}:{identifier}"
    
    # ── Login/Authentication Rate Limiting ──
    
    async def check_login_attempt(
        self,
        username: str,
        ip_address: str,
        max_attempts: int = 3,
        lockout_duration: int = 900,
        progressive_delays: list = None
    ) -> Tuple[bool, Optional[float]]:
        """
        Check if a login attempt should be allowed.
        
        Args:
            username: Username attempting login
            ip_address: Client IP address
            max_attempts: Max failed attempts before lockout
            lockout_duration: Seconds to lock after max failures
            progressive_delays: List of delays in seconds [1.0, 2.0, 4.0, ...]
        
        Returns:
            (is_allowed, delay_seconds_or_reason)
                - (True, None) if allowed with no delay
                - (True, delay_seconds) if allowed with progressive delay
                - (False, error_reason_string) if blocked
        """
        if progressive_delays is None:
            progressive_delays = [1.0, 2.0, 4.0, 8.0, 16.0]  # Exponential backoff
        
        identifier = f"{username}@{ip_address}"
        attempt_key = self._make_attempt_key("login", identifier)
        lockout_key = self._make_key("login_lockout", identifier)
        
        now = time.time()
        
        # Check if locked out
        lockout_data = self.redis.get(lockout_key)
        if lockout_data:
            try:
                locked_until = float(lockout_data)
                if now < locked_until:
                    remaining = locked_until - now
                    return False, f"Account locked for {remaining:.0f}s. Try again later."
            except (ValueError, TypeError):
                pass
        
        # Get current attempt count
        attempt_data = self.redis.get(attempt_key)
        current_attempts = 0
        if attempt_data:
            try:
                current_attempts = int(attempt_data)
            except (ValueError, TypeError):
                current_attempts = 0
        
        # Calculate progressive delay based on attempts (exponential backoff)
        if current_attempts > 0:
            delay_index = min(current_attempts - 1, len(progressive_delays) - 1)
            delay = progressive_delays[delay_index]
        else:
            delay = None
        
        return True, delay
    
    async def record_failed_login(
        self,
        username: str,
        ip_address: str,
        max_attempts: int = 3,
        lockout_duration: int = 900
    ) -> None:
        """Record a failed login attempt"""
        identifier = f"{username}@{ip_address}"
        attempt_key = self._make_attempt_key("login", identifier)
        lockout_key = self._make_key("login_lockout", identifier)
        
        # Increment attempt counter (TTL: 1 hour)
        attempts = self.redis.incr(attempt_key)
        self.redis.expire(attempt_key, 3600)
        
        # Lock account if max attempts reached
        if attempts >= max_attempts:
            locked_until = time.time() + lockout_duration
            self.redis.setex(lockout_key, lockout_duration, str(locked_until))
    
    async def record_successful_login(
        self,
        username: str,
        ip_address: str
    ) -> None:
        """Reset failed login attempts after successful login"""
        identifier = f"{username}@{ip_address}"
        attempt_key = self._make_attempt_key("login", identifier)
        lockout_key = self._make_key("login_lockout", identifier)
        
        self.redis.delete(attempt_key)
        self.redis.delete(lockout_key)
    
    # ── Per-User Quota Tracking ──
    
    async def check_quota(
        self,
        user_id: str,
        quota_type: str,
        limit: int,
        window_seconds: int = 3600
    ) -> Tuple[bool, int]:
        """
        Check if user has exceeded quota.
        
        Args:
            user_id: User ID
            quota_type: Type of quota (e.g., 'job_submissions', 'uploads')
            limit: Max count allowed
            window_seconds: Time window for quota (default: 1 hour)
        
        Returns:
            (is_allowed, remaining_quota)
        """
        key = self._make_key(f"quota:{quota_type}", user_id)
        
        current = self.redis.get(key)
        current_count = int(current) if current else 0
        
        remaining = limit - current_count
        is_allowed = remaining > 0
        
        return is_allowed, max(0, remaining)
    
    async def record_quota_usage(
        self,
        user_id: str,
        quota_type: str,
        amount: int = 1,
        window_seconds: int = 3600
    ) -> None:
        """Record quota usage"""
        key = self._make_key(f"quota:{quota_type}", user_id)
        
        self.redis.incr(key, amount)
        self.redis.expire(key, window_seconds)
    
    # ── Sliding Window Rate Limiting ──
    
    async def check_rate_limit(
        self,
        identifier: str,
        limit_type: str,
        requests: int,
        window_seconds: int
    ) -> Tuple[bool, int]:
        """
        Check if identifier exceeds rate limit using sliding window.
        
        Args:
            identifier: User ID, IP, or other identifier
            limit_type: Type of limit (e.g., 'api_calls', 'messages')
            requests: Max requests allowed
            window_seconds: Time window
        
        Returns:
            (is_allowed, remaining_requests)
        """
        key = self._make_key(f"rate:{limit_type}", identifier)
        
        now = time.time()
        window_start = now - window_seconds
        
        # Get all requests in current window
        request_times = self.redis.zrangebyscore(
            key,
            window_start,
            now
        )
        
        current_count = len(request_times)
        remaining = requests - current_count
        is_allowed = remaining > 0
        
        return is_allowed, max(0, remaining)
    
    async def record_request(
        self,
        identifier: str,
        limit_type: str,
        window_seconds: int
    ) -> None:
        """Record a request for rate limiting"""
        key = self._make_key(f"rate:{limit_type}", identifier)
        now = time.time()
        
        # Add request timestamp to sorted set
        self.redis.zadd(key, {str(now): now})
        
        # Clean old entries (optional, for efficiency)
        window_start = now - window_seconds
        self.redis.zremrangebyscore(key, 0, window_start)
        
        # Set key expiration
        self.redis.expire(key, window_seconds)
    
    # ── Connection Tracking ──
    
    async def track_connection(
        self,
        identifier: str,
        connection_type: str,
        max_connections: int
    ) -> Tuple[bool, int]:
        """
        Track active connections and check against limit.
        
        Args:
            identifier: User ID or other identifier
            connection_type: Type of connection (e.g., 'websocket_agent')
            max_connections: Max concurrent connections allowed
        
        Returns:
            (is_allowed, current_connections)
        """
        key = self._make_key(f"connections:{connection_type}", identifier)
        
        # Get current connection count
        current = self.redis.get(key)
        current_count = int(current) if current else 0
        
        is_allowed = current_count < max_connections
        
        return is_allowed, current_count
    
    async def increment_connection(
        self,
        identifier: str,
        connection_type: str
    ) -> None:
        """Increment active connection count"""
        key = self._make_key(f"connections:{connection_type}", identifier)
        self.redis.incr(key)
    
    async def decrement_connection(
        self,
        identifier: str,
        connection_type: str
    ) -> None:
        """Decrement active connection count"""
        key = self._make_key(f"connections:{connection_type}", identifier)
        current = int(self.redis.get(key) or 0)
        if current > 0:
            self.redis.decr(key)
        else:
            self.redis.delete(key)
    
    # ── Daily/Time-window Limits ──
    
    async def check_daily_limit(
        self,
        identifier: str,
        limit_type: str,
        limit_value: float
    ) -> Tuple[bool, float]:
        """
        Check if identifier exceeded daily limit.
        
        Args:
            identifier: User ID or other identifier
            limit_type: Type of limit (e.g., 'upload_bytes', 'transaction_amount')
            limit_value: Max value allowed per day
        
        Returns:
            (is_allowed, remaining_quota)
        """
        # Use date-based key so it resets daily
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        key = self._make_key(f"daily:{limit_type}:{today}", identifier)
        
        current = self.redis.get(key)
        current_value = float(current) if current else 0.0
        
        remaining = limit_value - current_value
        is_allowed = remaining > 0
        
        return is_allowed, max(0.0, remaining)
    
    async def add_to_daily_limit(
        self,
        identifier: str,
        limit_type: str,
        amount: float
    ) -> None:
        """Add to daily limit counter"""
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        key = self._make_key(f"daily:{limit_type}:{today}", identifier)
        
        # Use INCRBYFLOAT for decimal values
        self.redis.incrbyfloat(key, amount)
        
        # Expire after 25 hours to handle timezone edge cases
        self.redis.expire(key, 90000)


# Global rate limiter instance
_rate_limiter: Optional[RedisRateLimiter] = None


def get_rate_limiter(redis_url: str = "redis://localhost:6379/0") -> RedisRateLimiter:
    """Get or create global rate limiter instance"""
    global _rate_limiter
    if _rate_limiter is None:
        _rate_limiter = RedisRateLimiter(redis_url)
    return _rate_limiter
