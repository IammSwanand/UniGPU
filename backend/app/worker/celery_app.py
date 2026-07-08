"""
app/worker/celery_app.py
Celery application — broker: RabbitMQ (CloudAMQP), no result backend.

RabbitMQ uses a push-based delivery model (AMQP).  Workers receive tasks the
moment they are published; there is no periodic BRPOP polling loop.  This
eliminates the ~34,560 idle Redis commands/day that the previous Redis broker
generated.

Redis (Upstash) is still used for HTTP rate limiting (see redis_rate_limiter.py)
but is no longer touched by Celery at all.
"""
import ssl
from celery import Celery
from app.config import get_settings

settings = get_settings()

# ── AMQP SSL ─────────────────────────────────────────────────────────────────
# CloudAMQP requires TLS (amqps://).  We trust their certificate via standard
# CA verification — no need for CERT_NONE here, unlike Upstash.
_use_ssl = settings.RABBITMQ_URL.startswith("amqps://")
_broker_use_ssl: dict | None = None
if _use_ssl:
    # cafile is None on some Linux distros — fall back to letting ssl pick the store.
    _cafile = ssl.get_default_verify_paths().cafile or True
    _broker_use_ssl = {
        "ssl_cert_reqs": ssl.CERT_REQUIRED,
        "ssl_ca_certs": _cafile,
    }

celery_app = Celery(
    "unigpu_worker",
    broker=settings.RABBITMQ_URL,
    backend=None,           # Results disabled — no backend connection needed
    include=["app.worker.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    broker_connection_retry_on_startup=True,

    # ── SSL ──────────────────────────────────────────────────────────────────
    broker_use_ssl=_broker_use_ssl,

    # ── No result backend ────────────────────────────────────────────────────
    task_ignore_result=True,
    task_store_errors_even_if_ignored=False,

    # ── Disable Celery's internal event system ────────────────────────────────
    # We don't use Celery Flower or event monitoring.
    worker_send_task_events=False,
    task_send_sent_event=False,

    # ── Early ack (safe for our idempotent beat tasks) ────────────────────────
    task_acks_late=False,
    task_reject_on_worker_lost=False,

    # ── Heartbeat / gossip disabled (saves AMQP frames, already set in CMD) ──
    # These are also passed via --without-heartbeat --without-gossip --without-mingle
    # in docker-compose.celery.yml, but setting them here makes it explicit.
    worker_hijack_root_logger=False,

    beat_schedule={
        "check-heartbeats-every-30s": {
            "task": "app.worker.tasks.check_heartbeats",
            "schedule": 30.0,
        },
        # Runs every 24 hours — deletes OCI storage files for jobs completed/failed > 3 days ago
        "cleanup-stale-job-files-daily": {
            "task": "app.worker.tasks.cleanup_stale_job_files",
            "schedule": 86400.0,
        },
    },
)
