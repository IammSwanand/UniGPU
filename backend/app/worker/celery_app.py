import ssl
from celery import Celery
from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "unigpu_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL, #temporary disabled to check how much does it affect r/w opeartions on redis cache.
    include=["app.worker.tasks"],
)

# ── SSL config for Upstash (rediss://) ──
# Celery requires explicit ssl_cert_reqs when broker/backend use rediss://.
# CERT_NONE is safe here — Upstash's certificate is managed by them; we
# trust the connection via TLS encryption even without local cert validation.
_use_ssl = settings.REDIS_URL.startswith("rediss://")
_ssl_config = {"ssl_cert_reqs": ssl.CERT_NONE} if _use_ssl else {}

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    broker_connection_retry_on_startup=True,  # Celery 6.0+ compatibility
    broker_use_ssl=_ssl_config if _use_ssl else None,
    redis_backend_use_ssl=_ssl_config if _use_ssl else None,

    # Upstash Optimization
    task_ignore_result = True, #this prevents creation of key in redis cache

    task_store_errors_even_if_ignored = False, # doesn't store the errors either in redis cache

    broker_transport_options = {
        "polling_interval" : 5.0, # polls redis every 5 seconds reducing read operation quota
    }, #this redis cache can be replaced later with rabitmq for better queue management, but only for job polling.


    beat_schedule={
        "check-heartbeats-every-30s": {
            "task": "app.worker.tasks.check_heartbeats",
            "schedule": 30.0,
        },
        # Runs at midnight UTC every day
        # Deletes OCI storage files for jobs completed/failed > 3 days ago
        # Gives users a 3-day window to retry failed jobs before files are gone
        "cleanup-stale-job-files-daily": {
            "task": "app.worker.tasks.cleanup_stale_job_files",
            "schedule": 86400.0,  # 24 hours in seconds
        },
    },
)
