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


def _prompt_2fa_code_gui(username: str) -> Optional[str]:
    """
    Show a minimal tkinter dialog to collect a TOTP code from the user.
    Called from a background thread when token refresh requires 2FA.

    Returns the 6-digit code string, or None if the user cancelled.
    """
    try:
        import tkinter as tk
        from tkinter import messagebox

        code_result: list[Optional[str]] = [None]

        root = tk.Tk()
        root.title("UniGPU — Two-Factor Authentication Required")
        root.configure(bg="#0f0f1a")
        root.resizable(False, False)

        # Center on screen
        root.update_idletasks()
        w, h = 380, 220
        x = (root.winfo_screenwidth() - w) // 2
        y = (root.winfo_screenheight() - h) // 2
        root.geometry(f"{w}x{h}+{x}+{y}")

        tk.Label(
            root, text="Two-Factor Authentication",
            font=("Segoe UI", 13, "bold"), bg="#0f0f1a", fg="#e0e0e0"
        ).pack(pady=(18, 2))

        tk.Label(
            root, text=f"Your session for {username} has expired.\nEnter your authenticator code to reconnect.",
            font=("Segoe UI", 10), bg="#0f0f1a", fg="#888899", justify="center"
        ).pack(pady=(0, 12))

        code_var = tk.StringVar()
        entry = tk.Entry(
            root, textvariable=code_var, font=("Segoe UI", 16),
            bg="#252540", fg="#e0e0e0", insertbackground="#e0e0e0",
            relief="flat", justify="center", width=10,
            highlightthickness=1, highlightbackground="#333355",
            highlightcolor="#7c3aed",
        )
        entry.pack(ipady=6)
        entry.focus_set()

        def _submit():
            code = code_var.get().strip()
            if not code.isdigit() or len(code) != 6:
                messagebox.showwarning("Invalid Code", "Please enter exactly 6 digits.", parent=root)
                return
            code_result[0] = code
            root.destroy()

        def _cancel():
            root.destroy()

        root.bind("<Return>", lambda _: _submit())
        root.bind("<Escape>", lambda _: _cancel())

        btn_frame = tk.Frame(root, bg="#0f0f1a")
        btn_frame.pack(pady=14)
        tk.Button(
            btn_frame, text="Cancel", command=_cancel,
            font=("Segoe UI", 10), bg="#333355", fg="#e0e0e0",
            relief="flat", padx=14, pady=6, cursor="hand2",
        ).pack(side="left", padx=6)
        tk.Button(
            btn_frame, text="Verify", command=_submit,
            font=("Segoe UI", 10, "bold"), bg="#7c3aed", fg="white",
            relief="flat", padx=14, pady=6, cursor="hand2",
        ).pack(side="left", padx=6)

        root.mainloop()
        return code_result[0]

    except Exception as exc:
        logger.error("❌ Failed to show 2FA dialog: %s", exc)
        return None


def refresh_token(backend_http_url: str) -> Optional[str]:
    """
    Refresh the JWT token by calling /auth/login with stored credentials.
    Handles the 2FA challenge: if the account has 2FA enabled, a small
    GUI dialog is shown to collect the TOTP code, then /auth/verify-2fa-login
    is called to obtain the real access token.

    This function is always called from a worker thread (asyncio.to_thread),
    so blocking tkinter is safe.

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
            verify=False,
        )

        if resp.status_code == 200:
            data = resp.json()

            # ── 2FA required ─────────────────────────────────────────────────
            if data.get("requires_2fa"):
                temp_token = data.get("temp_token", "")
                if not temp_token:
                    logger.error("❌ 2FA required but no temp_token in response")
                    return None

                logger.info("🔐 2FA required for token refresh — prompting user")
                code = _prompt_2fa_code_gui(username)
                if not code:
                    logger.warning("⚠️ User cancelled 2FA prompt — token refresh aborted")
                    return None

                try:
                    verify_resp = httpx.post(
                        f"{base_url}/auth/verify-2fa-login",
                        json={"temp_token": temp_token, "code": code},
                        timeout=10,
                        verify=False,
                    )
                    if verify_resp.status_code == 200:
                        verify_data = verify_resp.json()
                        new_token = verify_data.get("access_token", verify_data.get("token", ""))
                        if new_token:
                            logger.info("✅ Token refreshed successfully via 2FA")
                            save_token(new_token)
                            return new_token
                        else:
                            logger.error("❌ No token in 2FA verify response: %s", verify_data)
                            return None
                    else:
                        logger.error(
                            "❌ 2FA verification failed (HTTP %s): %s",
                            verify_resp.status_code, verify_resp.text[:200]
                        )
                        return None
                except Exception as exc:
                    logger.error("❌ 2FA verification request failed: %s", exc)
                    return None

            # ── Normal (no 2FA) ───────────────────────────────────────────────
            new_token = data.get("access_token", data.get("token", ""))
            if new_token:
                logger.info("✅ Token refreshed successfully")
                save_token(new_token)
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
