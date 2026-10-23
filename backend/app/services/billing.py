import logging
from pathlib import Path
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.job import Job, JobStatus
from app.models.wallet import Wallet, Transaction, TransactionType
from app.models.gpu import GPU
from app.config import get_settings

settings = get_settings()
logger = logging.getLogger("unigpu.billing")

MIN_JOB_DURATION_SECONDS = 1.0


def calculate_cost(duration_seconds: float) -> float:
    """Calculate job cost based on duration. Flat rate for MVP."""
    return round(duration_seconds * settings.RATE_PER_SECOND, 6)


def check_artifact_exists(artifacts_path: str | None) -> bool:
    """Check whether an artifact file exists locally or in OCI object storage."""
    if not artifacts_path:
        return False
    if settings.oci_storage_enabled:
        try:
            from app.services.storage import get_storage
            return get_storage().key_exists(artifacts_path)
        except Exception as exc:
            logger.warning("Failed to check OCI artifact existence: %s", exc)
            return False
    p = Path(artifacts_path)
    return p.exists() and p.is_file() and p.stat().st_size > 0


def verify_proof_of_work(job: Job, msg: dict) -> tuple[bool, str]:
    """
    Verify that a job genuinely executed on the provider machine before releasing payment.
    Checks:
      1. Job started_at exists (job was in running state).
      2. Execution duration >= MIN_JOB_DURATION_SECONDS (prevents instant spoofed completions).
      3. Container exit code is 0 (if reported).
      4. Execution logs are non-empty (agent actually streamed container logs).
      5. If artifacts are claimed, verify file exists and is non-empty in storage/disk.
    """
    if not job.started_at:
        return False, "Job was never marked as started"

    if not job.completed_at:
        job.completed_at = datetime.now(timezone.utc)

    duration = (job.completed_at - job.started_at).total_seconds()
    if duration < MIN_JOB_DURATION_SECONDS:
        return False, f"Job finished unnaturally fast ({duration:.2f}s < {MIN_JOB_DURATION_SECONDS}s threshold)"

    # Check exit code if provided by agent
    exit_code = msg.get("exit_code")
    if exit_code is not None and exit_code != 0:
        return False, f"Container execution reported non-zero exit code: {exit_code}"

    # Check that execution logs exist
    logs = (job.logs or "").strip()
    if not logs:
        return False, "No execution logs were recorded during container run"

    # Check artifacts if claimed
    has_artifacts = msg.get("has_artifacts", False)
    if has_artifacts:
        if not job.artifacts_path or not check_artifact_exists(job.artifacts_path):
            return False, "Agent claimed artifacts were produced, but artifacts were not found in storage"

    return True, "Verification successful"


async def verify_and_charge_client(db: AsyncSession, job: Job, msg: dict) -> tuple[bool, str]:
    """
    Verify proof of work and debit client wallet / credit provider wallet.
    If verification fails, job is marked failed and no funds are charged or credited.
    """
    is_valid, reason = verify_proof_of_work(job, msg)
    if not is_valid:
        logger.warning(
            "⚠️ Job %s failed proof-of-work verification: %s (gpu_id=%s, client_id=%s)",
            job.id, reason, job.gpu_id, job.client_id,
        )
        job.status = JobStatus.failed
        if job.completed_at is None:
            job.completed_at = datetime.now(timezone.utc)
        # Append verification failure notice to job logs for transparency
        security_note = f"\n[SECURITY VERIFICATION FAILED]: {reason}\n"
        job.logs = (job.logs or "") + security_note
        await db.flush()
        return False, reason

    # Verification passed — calculate cost and charge
    duration = (job.completed_at - job.started_at).total_seconds()
    cost = calculate_cost(duration)
    job.duration_seconds = int(duration)
    job.cost = cost
    job.status = JobStatus.completed

    if cost <= 0:
        await db.flush()
        return True, "Job completed (zero cost)"

    # ── Client wallet (debit) ──
    client_wallet_result = await db.execute(
        select(Wallet).where(Wallet.user_id == job.client_id)
    )
    client_wallet = client_wallet_result.scalar_one_or_none()
    if not client_wallet:
        logger.error("Client wallet not found for client_id=%s", job.client_id)
        return False, "Client wallet not found"

    from app.models.settings import SystemSettings
    settings_result = await db.execute(select(SystemSettings).where(SystemSettings.id == "default"))
    system_settings = settings_result.scalar_one_or_none()
    overdraft_limit = system_settings.overdraft_limit if system_settings else -50.0

    if (client_wallet.balance - cost) < overdraft_limit:
        logger.warning("Client wallet balance exceeded overdraft limit")
        return False, "Client overdraft limit exceeded"

    client_wallet.balance -= cost
    db.add(Transaction(
        wallet_id=client_wallet.id,
        amount=cost,
        type=TransactionType.debit,
        description=f"Job {job.id} — GPU usage for {duration:.0f}s",
    ))

    # ── Provider wallet (credit) ──
    if job.gpu_id:
        gpu_result = await db.execute(select(GPU).where(GPU.id == job.gpu_id))
        gpu = gpu_result.scalar_one_or_none()
        if gpu:
            provider_wallet_result = await db.execute(
                select(Wallet).where(Wallet.user_id == gpu.provider_id)
            )
            provider_wallet = provider_wallet_result.scalar_one_or_none()
            if provider_wallet:
                provider_wallet.balance += cost
                db.add(Transaction(
                    wallet_id=provider_wallet.id,
                    amount=cost,
                    type=TransactionType.credit,
                    description=f"Job {job.id} — GPU rental income for {duration:.0f}s",
                ))

    await db.flush()
    return True, "Billing completed"


async def charge_client(db: AsyncSession, job: Job) -> bool:
    """Legacy charge method kept for backwards compatibility."""
    success, _ = await verify_and_charge_client(db, job, {})
    return success

