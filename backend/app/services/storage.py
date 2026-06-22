"""
UniGPU — Oracle Cloud Object Storage Service
=============================================
Uses Oracle's S3-compatible API via boto3.
Stores uploaded job scripts/requirements and generates pre-signed
download URLs so the GPU agent can fetch files directly from OCI
without routing traffic through the backend.

Bucket layout:
  jobs/<job_id>/train.py
  jobs/<job_id>/requirements.txt
"""

import logging
from functools import lru_cache
from typing import Optional

import boto3
from botocore.exceptions import ClientError
from botocore.config import Config

logger = logging.getLogger("unigpu.storage")


class StorageService:
    """
    Thin wrapper around boto3 for Oracle Cloud Object Storage.

    Oracle's S3-compatible endpoint:
        https://<namespace>.compat.objectstorage.<region>.oraclecloud.com

    Credentials used:
        - Access Key ID  → Customer Secret Key (Access Key ID column)
        - Secret Key     → Customer Secret Key (Secret column)
    Both are generated in: OCI Console → Profile → My Profile → Customer Secret Keys
    """

    def __init__(
        self,
        namespace: str,
        region: str,
        bucket: str,
        access_key: str,
        secret_key: str,
    ):
        self.bucket = bucket
        endpoint = f"https://{namespace}.compat.objectstorage.{region}.oraclecloud.com"

        self._s3 = boto3.client(
            "s3",
            region_name=region,
            endpoint_url=endpoint,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            # OCI S3 compatibility requires path-style addressing
            config=Config(signature_version="s3v4", s3={"addressing_style": "path"}),
        )
        logger.info("StorageService initialised — bucket=%s endpoint=%s", bucket, endpoint)

    # ──────────────────────────────────────────────────────────
    # Public API
    # ──────────────────────────────────────────────────────────

    def upload(self, key: str, data: bytes, content_type: str = "application/octet-stream") -> str:
        """
        Upload raw bytes to the bucket.

        Args:
            key:          Object key, e.g. "jobs/<uuid>/train.py"
            data:         Raw file bytes
            content_type: MIME type (default: application/octet-stream)

        Returns:
            The object key (same as input) for storing in the DB.
        """
        try:
            self._s3.put_object(
                Bucket=self.bucket,
                Key=key,
                Body=data,
                ContentType=content_type,
            )
            logger.info("Uploaded %s (%d bytes)", key, len(data))
            return key
        except ClientError as exc:
            logger.error("Upload failed for key=%s: %s", key, exc)
            raise

    def get_presigned_url(self, key: str, expires_in: int = 900) -> str:
        """
        Generate a pre-signed GET URL valid for `expires_in` seconds (default 15 min).
        The GPU agent uses this URL to download the script directly from OCI,
        bypassing the backend entirely.

        Args:
            key:        Object key in the bucket
            expires_in: URL validity in seconds (max 604800 = 7 days)

        Returns:
            Pre-signed HTTPS URL string.
        """
        try:
            url = self._s3.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket, "Key": key},
                ExpiresIn=expires_in,
            )
            logger.debug("Generated presigned URL for %s (expires=%ds)", key, expires_in)
            return url
        except ClientError as exc:
            logger.error("Failed to generate presigned URL for key=%s: %s", key, exc)
            raise

    def delete(self, key: str) -> None:
        """
        Delete an object from the bucket. Used when a job is deleted.
        Silently ignores missing objects (idempotent).

        Args:
            key: Object key to delete
        """
        try:
            self._s3.delete_object(Bucket=self.bucket, Key=key)
            logger.info("Deleted object %s", key)
        except ClientError as exc:
            error_code = exc.response["Error"]["Code"]
            if error_code == "NoSuchKey":
                logger.debug("Object %s already gone — skipping delete", key)
            else:
                logger.warning("Delete failed for key=%s: %s", key, exc)

    def key_exists(self, key: str) -> bool:
        """Check whether an object exists in the bucket."""
        try:
            self._s3.head_object(Bucket=self.bucket, Key=key)
            return True
        except ClientError:
            return False


# ──────────────────────────────────────────────────────────────
# Singleton accessor — initialised once from app.state in main.py
# ──────────────────────────────────────────────────────────────

_storage_instance: Optional[StorageService] = None


def init_storage(namespace: str, region: str, bucket: str, access_key: str, secret_key: str) -> StorageService:
    """Initialise the global storage singleton. Called once during app startup."""
    global _storage_instance
    _storage_instance = StorageService(
        namespace=namespace,
        region=region,
        bucket=bucket,
        access_key=access_key,
        secret_key=secret_key,
    )
    return _storage_instance


def get_storage() -> StorageService:
    """
    FastAPI dependency / helper to get the storage singleton.
    Raises RuntimeError if init_storage() was not called first.
    """
    if _storage_instance is None:
        raise RuntimeError("StorageService not initialised. Call init_storage() in lifespan.")
    return _storage_instance
