"""
UniGPU Agent — OS Credential Store Management
Securely stores credentials using the operating system's credential manager.
On Windows: Windows Credential Manager (via keyring library)
On macOS:   Keychain
On Linux:   Secret Service / pass

This allows agents to:
  1. Save username/password after first login
  2. Auto-refresh tokens when 403 error occurs
  3. Switch between multiple provider accounts without manual config editing
"""

import base64
import json
import logging
from datetime import datetime, timezone
from typing import Optional, Tuple

import httpx

logger = logging.getLogger("unigpu.agent.credentials")

# Keyring service name — consistent across all platforms
SERVICE_NAME = "UniGPU-Agent"
USERNAME_KEY = "unigpu_username"
PASSWORD_KEY = "unigpu_password"
TOKEN_KEY = "unigpu_token_temp"


def _decode_jwt_payload(token: str) -> Optional[dict]:
    """Decode the JWT payload without verifying the signature."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None

        payload = parts[1]
        padding = "=" * (-len(payload) % 4)
        decoded = base64.urlsafe_b64decode(f"{payload}{padding}")
        return json.loads(decoded.decode("utf-8"))
    except Exception:
        return None


def get_token_expiry(token: str) -> Optional[datetime]:
    """Return the expiry timestamp from a JWT token if available."""
    payload = _decode_jwt_payload(token)
    if not payload:
        return None

    exp = payload.get("exp")
    if exp is None:
        return None

    try:
        exp_value = float(exp)
    except (TypeError, ValueError):
        return None

    return datetime.fromtimestamp(exp_value, tz=timezone.utc)


def is_token_expired(token: str) -> bool:
    """Check whether a JWT token is expired or invalid."""
    expiry = get_token_expiry(token)
    if not expiry:
        return True
    return expiry <= datetime.now(timezone.utc)


def save_credentials(username: str, password: str) -> bool:
    """
    Save credentials to the OS credential store (Windows Credential Manager, macOS Keychain, etc).
    
    Args:
        username: UniGPU username
        password: UniGPU password
    
    Returns:
        True if saved successfully, False otherwise.
    """
    try:
        import keyring
        keyring.set_password(SERVICE_NAME, USERNAME_KEY, username)
        keyring.set_password(SERVICE_NAME, PASSWORD_KEY, password)
        logger.info("✅ Credentials saved to OS credential store")
        return True
    except Exception as exc:
        logger.error("❌ Failed to save credentials: %s", exc)
        return False


def load_credentials() -> Optional[Tuple[str, str]]:
    """
    Load credentials from the OS credential store.
    
    Returns:
        Tuple of (username, password) or None if not found / error.
    """
    try:
        import keyring
        username = keyring.get_password(SERVICE_NAME, USERNAME_KEY)
        password = keyring.get_password(SERVICE_NAME, PASSWORD_KEY)
        
        if username and password:
            logger.debug("✅ Credentials loaded from OS credential store")
            return (username, password)
        else:
            logger.warning("⚠️ Credentials not found in OS credential store")
            return None
    except Exception as exc:
        logger.error("❌ Failed to load credentials: %s", exc)
        return None


def delete_credentials() -> bool:
    """
    Delete credentials from the OS credential store (e.g., when switching accounts).
    
    Returns:
        True if deleted successfully, False otherwise.
    """
    try:
        import keyring
        keyring.delete_password(SERVICE_NAME, USERNAME_KEY)
        keyring.delete_password(SERVICE_NAME, PASSWORD_KEY)
        logger.info("✅ Credentials deleted from OS credential store")
        return True
    except keyring.errors.PasswordDeleteError:
        logger.warning("⚠️ Credentials not found in OS credential store (already deleted)")
        return True
    except Exception as exc:
        logger.error("❌ Failed to delete credentials: %s", exc)
        return False


def refresh_token(backend_http_url: str) -> Optional[str]:
    """
    Refresh the JWT token by calling /auth/login with stored credentials.
    This is called when the WebSocket connection gets a 403 error.
    
    Args:
        backend_http_url: Base URL of the backend (e.g., http://localhost:8000)
    
    Returns:
        New access token string, or None if refresh failed.
    """
    creds = load_credentials()
    if not creds:
        logger.warning("⚠️ Cannot refresh token — credentials not in keyring")
        return None
    
    username, password = creds
    base_url = backend_http_url.rstrip("/")
    
    try:
        logger.info("🔄 Attempting token refresh at %s/auth/login", base_url)
        resp = httpx.post(
            f"{base_url}/auth/login",
            json={"email": username, "password": password},
            timeout=10,
            verify=False,  # Match agent's setup_wizard behavior
        )
        
        if resp.status_code == 200:
            data = resp.json()
            new_token = data.get("access_token", data.get("token", ""))
            if new_token:
                logger.info("✅ Token refreshed successfully")
                save_token(new_token)  # Save for debugging
                return new_token
            else:
                logger.error("❌ No token in login response: %s", data)
                return None
        else:
            logger.error("❌ Login failed (HTTP %s): %s", resp.status_code, resp.text[:200])
            return None
    except httpx.ConnectError:
        logger.error("❌ Cannot connect to backend: %s", base_url)
        return None
    except Exception as exc:
        logger.error("❌ Token refresh failed: %s", exc)
        return None


def save_token(token: str) -> bool:
    """
    Save the current token to the OS credential store for debugging purposes.
    This is optional and only used for inspection via settings.
    
    Args:
        token: JWT access token
    
    Returns:
        True if saved successfully, False otherwise.
    """
    try:
        import keyring
        keyring.set_password(SERVICE_NAME, TOKEN_KEY, token)
        logger.debug("✅ Token saved to OS credential store (for debugging)")
        return True
    except Exception as exc:
        logger.warning("⚠️ Failed to save token: %s", exc)
        return False


def load_token() -> Optional[str]:
    """
    Load the current token from the OS credential store (for debugging).
    
    Returns:
        Token string or None if not found / error.
    """
    try:
        import keyring
        token = keyring.get_password(SERVICE_NAME, TOKEN_KEY)
        return token
    except Exception:
        return None


def delete_token() -> bool:
    """
    Delete the token from the OS credential store.
    
    Returns:
        True if deleted successfully, False otherwise.
    """
    try:
        import keyring
        keyring.delete_password(SERVICE_NAME, TOKEN_KEY)
        logger.debug("✅ Token deleted from OS credential store")
        return True
    except keyring.errors.PasswordDeleteError:
        return True  # Already deleted
    except Exception as exc:
        logger.warning("⚠️ Failed to delete token: %s", exc)
        return False
