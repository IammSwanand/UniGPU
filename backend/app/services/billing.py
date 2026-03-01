from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.job import Job
from app.models.wallet import Wallet, Transaction, TransactionType
from app.models.gpu import GPU
from app.config import get_settings

settings = get_settings()


def calculate_cost(duration_seconds: float) -> float:
    """Calculate job cost based on duration. Flat rate for MVP."""
    return round(duration_seconds * settings.RATE_PER_SECOND, 6)


async def charge_client(db: AsyncSession, job: Job) -> bool:
    """Debit client wallet and credit provider wallet for a completed job.

    Returns True if billing succeeded, False if insufficient balance.
    """
    if not job.started_at or not job.completed_at:
        return False

    duration = (job.completed_at - job.started_at).total_seconds()
    cost = calculate_cost(duration)

    if cost <= 0:
        return True

    # ── Client wallet (debit) ──
    client_wallet_result = await db.execute(
        select(Wallet).where(Wallet.user_id == job.client_id)
    )
    client_wallet = client_wallet_result.scalar_one_or_none()
    if not client_wallet or client_wallet.balance < cost:
        return False

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
    return True
