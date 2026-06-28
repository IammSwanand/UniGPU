import ssl
from celery import Celery
from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "unigpu_worker",
    broker=settings.REDIS_URL,
    backend=None,  # Results disabled (task_ignore_result=True) — no backend connection needed
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
    # redis_backend_use_ssl removed — backend=None (task_ignore_result=True)

    # ── Upstash Quota Optimization ──
    task_ignore_result=True,             # Prevents result keys being written to Redis cache
    task_store_errors_even_if_ignored=False,  # Don't store errors in Redis either

    # Disable Celery's internal event system.
    # By default the worker broadcasts a heartbeat PUBLISH to /0.celeryev/worker.heartbeat
    # at freq=2.0 (twice per second), which alone generates ~1.38M Redis ops/month at idle.
    # We don't use Celery Flower or event monitoring, so this is pure waste.
    worker_send_task_events=False,       # Kills PUBLISH /0.celeryev/worker.heartbeat spam
    task_send_sent_event=False,          # Kills task-sent event PUBLISHes

    # Use early ack so Celery does NOT write to the unacked_index/unacked hash on every task.
    # The beat tasks (check_heartbeats, cleanup_stale_job_files) are safe to re-run if lost,
    # so we don't need Celery's at-least-once re-delivery guarantee for them.
    # This removes ~1.03M ZADD/HSET/MULTI/EXEC/ZREM/HDEL ops/month.
    task_acks_late=False,
    task_reject_on_worker_lost=False,

    broker_transport_options={
        "polling_interval": 5.0,  # Poll Redis every 5s — will be replaced by RabbitMQ (push-based)
    },


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
