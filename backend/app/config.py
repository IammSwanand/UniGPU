import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # ── Environment ──
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    # ── Database ──
    # Docker uses PostgreSQL. For local dev without Docker, use:
    # sqlite+aiosqlite:///./unigpu.db
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://unigpu:unigpu_secret@localhost:5432/unigpu"
    )
    
    # Validate that DATABASE_URL is set for production
    @property
    def is_prod_db(self) -> bool:
        return not self.DATABASE_URL.startswith("sqlite")

    # ── Redis (rate limiting only — Celery broker moved to RabbitMQ) ──
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # ── RabbitMQ (Celery broker) ──
    # CloudAMQP free tier: https://www.cloudamqp.com
    # Format: amqps://<user>:<password>@<host>/<vhost>
    RABBITMQ_URL: str = os.getenv("RABBITMQ_URL", "amqp://localhost//")

    # ── JWT ──
    # ⚠️  CRITICAL: In production, this MUST be set via environment variable
    # Generate with: python -c "import secrets; print(secrets.token_urlsafe(32))"
    # Default is INSECURE and only for local development
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me-in-production-to-a-random-string")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # ── Billing ──
    RATE_PER_SECOND: float = 0.002  # $0.002 per second of GPU usage

    # ── Heartbeat ──
    HEARTBEAT_TIMEOUT_SECONDS: int = 60  # GPU marked offline after 60s silence

    # ── File Storage ──
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")

    # ── Oracle Cloud Object Storage (S3-compatible) ──
    # Credentials: OCI Console → Profile → My Profile → Customer Secret Keys
    # Namespace:   OCI Console → Object Storage → top of bucket list page
    OCI_NAMESPACE: str = os.getenv("OCI_NAMESPACE", "")
    OCI_REGION: str = os.getenv("OCI_REGION", "")        # e.g. "ap-mumbai-1"
    OCI_BUCKET: str = os.getenv("OCI_BUCKET", "unigpu-jobs")
    OCI_ACCESS_KEY: str = os.getenv("OCI_ACCESS_KEY", "")
    OCI_SECRET_KEY: str = os.getenv("OCI_SECRET_KEY", "")

    @property
    def oci_storage_enabled(self) -> bool:
        """True when all OCI credentials are configured."""
        return bool(self.OCI_NAMESPACE and self.OCI_REGION and self.OCI_ACCESS_KEY and self.OCI_SECRET_KEY)

    # ── CORS ──
    # In production, set to your frontend domain via .env
    # Multiple origins: "https://domain1.com,https://domain2.com"
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "*")

    class Config:
        env_file = ".env"
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Warn if using default SECRET_KEY in production
        if not self.DEBUG and self.SECRET_KEY == "change-me-in-production-to-a-random-string":
            raise ValueError(
                "⚠️  CRITICAL: SECRET_KEY must be set via environment variable in production. "
                "Generate a new key with: python -c \"import secrets; print(secrets.token_urlsafe(32))\"\n"
                "Then add to Varaibles: SECRET_KEY=your_generated_key"
            )


@lru_cache()
def get_settings() -> Settings:
    return Settings()
