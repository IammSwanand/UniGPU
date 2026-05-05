from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.wallet import Wallet, Transaction, TransactionType
from app.schemas.wallet import WalletOut, WalletTopUp, TransactionOut

router = APIRouter()


@router.get("/", response_model=WalletOut)
async def get_wallet(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Wallet).where(Wallet.user_id == current_user.id))
    wallet = result.scalar_one_or_none()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    return wallet


@router.post("/topup", response_model=WalletOut)
async def topup_wallet(
    request: Request,
    data: WalletTopUp,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Get limiter from app state and apply per-user rate limit
    limiter = request.app.state.limiter
    
    # Per-user limit: 5 top-ups per hour (financial protection)
    try:
        limiter.try_request("5/hour", request)
    except Exception:
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Max 5 top-ups per hour.")
    # ── Validation: Amount limits ──
    MAX_TOPUP_AMOUNT = 10000  # Max ₹10,000 per transaction
    MAX_DAILY_TOPUP = 50000   # Max ₹50,000 per 24 hours
    
    if not (0 < data.amount <= MAX_TOPUP_AMOUNT):
        raise HTTPException(
            status_code=400, 
            detail=f"Amount must be between ₹1 and ₹{MAX_TOPUP_AMOUNT}"
        )

    result = await db.execute(select(Wallet).where(Wallet.user_id == current_user.id))
    wallet = result.scalar_one_or_none()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")

    # Check daily limit: sum of credits in last 24 hours
    from datetime import datetime, timezone, timedelta
    from sqlalchemy import func
    
    last_24h = datetime.now(timezone.utc) - timedelta(hours=24)
    daily_total = (
        await db.execute(
            select(func.sum(Transaction.amount)).where(
                (Transaction.wallet_id == wallet.id) &
                (Transaction.type == TransactionType.credit) &
                (Transaction.created_at >= last_24h)
            )
        )
    ).scalar() or 0
    
    if daily_total + data.amount > MAX_DAILY_TOPUP:
        raise HTTPException(
            status_code=400,
            detail=f"Daily limit exceeded. You can top up ₹{MAX_DAILY_TOPUP - daily_total:.0f} more today."
        )

    wallet.balance += data.amount

    tx = Transaction(
        wallet_id=wallet.id,
        amount=data.amount,
        type=TransactionType.credit,
        description="Wallet top-up (simulated)",
    )
    db.add(tx)
    await db.flush()
    return wallet


@router.get("/transactions", response_model=List[TransactionOut])
async def get_transactions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Wallet).where(Wallet.user_id == current_user.id))
    wallet = result.scalar_one_or_none()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")

    result = await db.execute(
        select(Transaction)
        .where(Transaction.wallet_id == wallet.id)
        .order_by(Transaction.created_at.desc())
    )
    return result.scalars().all()
