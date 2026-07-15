"""
UniGPU — Google Drive Integration Service
==========================================
Backend-only Google Drive operations. The provider/agent is NEVER
involved: they receive only a standard dataset download URL.

Responsibilities:
  - Exchange OAuth authorization code for access + refresh tokens
  - Encrypt / decrypt refresh tokens for safe DB storage
  - Download a selected CSV file from Google Drive to local/OCI storage

OAuth flow (Authorization Code):
  1. Frontend opens Google OAuth popup → receives auth code
  2. Frontend sends { gdrive_auth_code, gdrive_file_id } to backend
  3. Backend calls exchange_code() → gets refresh + access token
  4. Backend encrypts and stores refresh token in job.gdrive_refresh_token_enc
  5. Celery task calls get_access_token() + download_file() before GPU dispatch
  6. Agent receives only dataset_url — completely source-agnostic
"""

import logging
from pathlib import Path
from typing import Optional

import httpx

logger = logging.getLogger("unigpu.gdrive")

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_DRIVE_DOWNLOAD_URL = "https://www.googleapis.com/drive/v3/files/{file_id}"
GOOGLE_DRIVE_METADATA_URL = "https://www.googleapis.com/drive/v3/files/{file_id}?fields=name,mimeType,size"


class GDriveService:
    """
    Google Drive integration. Backend-only — never called from agent code.
    """

    def __init__(self, client_id: str, client_secret: str, encryption_key: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self._encryption_key = encryption_key
        self._fernet = None
        if encryption_key:
            try:
                from cryptography.fernet import Fernet
                self._fernet = Fernet(encryption_key.encode())
            except Exception as exc:
                logger.error("Failed to initialise Fernet encryption: %s", exc)

    # ────────────────────────────────────────────
    # Token exchange
    # ────────────────────────────────────────────

    def exchange_code(self, auth_code: str, redirect_uri: str) -> dict:
        """
        Exchange an OAuth authorization code for access + refresh tokens.

        Returns:
            {"access_token": "...", "refresh_token": "...", "expires_in": 3600}
        Raises:
            RuntimeError on HTTP error or missing refresh_token.
        """
        import httpx as _httpx

        with _httpx.Client(timeout=30) as client:
            resp = client.post(
                GOOGLE_TOKEN_URL,
                data={
                    "code": auth_code,
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "redirect_uri": redirect_uri,
                    "grant_type": "authorization_code",
                },
            )

        if resp.status_code != 200:
            raise RuntimeError(
                f"Google token exchange failed: HTTP {resp.status_code} — {resp.text[:300]}"
            )

        data = resp.json()
        if "refresh_token" not in data:
            raise RuntimeError(
                "Google did not return a refresh_token. "
                "Ensure 'access_type=offline' and 'prompt=consent' were set in the OAuth URL."
            )

        logger.info("Google OAuth code exchanged successfully")
        return data

    def get_access_token(self, encrypted_refresh_token: str) -> str:
        """
        Decrypt the stored refresh token and use it to get a fresh access token.

        Returns:
            Fresh access token string.
        Raises:
            RuntimeError on decryption failure or HTTP error.
        """
        refresh_token = self.decrypt_token(encrypted_refresh_token)

        import httpx as _httpx

        with _httpx.Client(timeout=30) as client:
            resp = client.post(
                GOOGLE_TOKEN_URL,
                data={
                    "refresh_token": refresh_token,
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "grant_type": "refresh_token",
                },
            )

        if resp.status_code != 200:
            raise RuntimeError(
                f"Google token refresh failed: HTTP {resp.status_code} — {resp.text[:300]}"
            )

        return resp.json()["access_token"]

    # ────────────────────────────────────────────
    # File operations
    # ────────────────────────────────────────────

    async def get_file_metadata(self, access_token: str, file_id: str) -> dict:
        """Get metadata (name, mimeType, size) for a Drive file."""
        url = GOOGLE_DRIVE_METADATA_URL.format(file_id=file_id)
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(
                url,
                headers={"Authorization": f"Bearer {access_token}"},
            )
        if resp.status_code != 200:
            raise RuntimeError(
                f"Failed to get Drive metadata for {file_id}: HTTP {resp.status_code}"
            )
        return resp.json()

    async def download_file(
        self, access_token: str, file_id: str, dest_path: Path
    ) -> int:
        """
        Stream a Google Drive file to dest_path.

        Args:
            access_token: Fresh Google access token.
            file_id:      Google Drive file ID.
            dest_path:    Local filesystem path to write to.

        Returns:
            Number of bytes written.
        Raises:
            RuntimeError on HTTP error.
        """
        url = GOOGLE_DRIVE_DOWNLOAD_URL.format(file_id=file_id)
        headers = {"Authorization": f"Bearer {access_token}"}

        dest_path.parent.mkdir(parents=True, exist_ok=True)
        bytes_written = 0

        async with httpx.AsyncClient(timeout=300, follow_redirects=True) as client:
            async with client.stream(
                "GET", url, headers=headers, params={"alt": "media"}
            ) as resp:
                if resp.status_code != 200:
                    raise RuntimeError(
                        f"Failed to download Drive file {file_id}: "
                        f"HTTP {resp.status_code}"
                    )
                with open(dest_path, "wb") as f:
                    async for chunk in resp.aiter_bytes(chunk_size=65536):
                        f.write(chunk)
                        bytes_written += len(chunk)

        size_mb = bytes_written / (1024 * 1024)
        logger.info(
            "Downloaded Drive file %s to %s (%.1f MB)", file_id, dest_path, size_mb
        )
        return bytes_written

    # ────────────────────────────────────────────
    # Encryption helpers
    # ────────────────────────────────────────────

    def encrypt_token(self, token: str) -> str:
        """Fernet-encrypt a refresh token for DB storage."""
        if not self._fernet:
            raise RuntimeError(
                "GDRIVE_ENCRYPTION_KEY not configured. "
                "Generate one with: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
            )
        return self._fernet.encrypt(token.encode()).decode()

    def decrypt_token(self, encrypted: str) -> str:
        """Fernet-decrypt a stored refresh token."""
        if not self._fernet:
            raise RuntimeError("GDRIVE_ENCRYPTION_KEY not configured.")
        return self._fernet.decrypt(encrypted.encode()).decode()

    @property
    def is_configured(self) -> bool:
        """True when Google OAuth credentials are set."""
        return bool(self.client_id and self.client_secret and self._fernet)


# ────────────────────────────────────────────────────────
# Singleton accessor — initialised once in main.py lifespan
# ────────────────────────────────────────────────────────

_gdrive_instance: Optional[GDriveService] = None


def init_gdrive(client_id: str, client_secret: str, encryption_key: str) -> GDriveService:
    """Initialise the global GDriveService singleton."""
    global _gdrive_instance
    _gdrive_instance = GDriveService(client_id, client_secret, encryption_key)
    return _gdrive_instance


def get_gdrive() -> Optional[GDriveService]:
    """
    Return the GDriveService singleton, or None if not configured.
    Callers should check is_configured before using.
    """
    return _gdrive_instance
