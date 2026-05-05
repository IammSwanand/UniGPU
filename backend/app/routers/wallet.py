from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.wallet import Wallet, Transaction, TransactionType
from app.schemas.wallet import WalletOut, WalletTopUp, TransactionOut
from app.security_utils import (
    check_wallet_topup_limit, record_wallet_topup, check_daily_wallet_total
)

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
    """Top-up wallet with rate limiting and financial limits"""
    
    # ── Rate Limiting: Check per-hour top-up quota ──
    is_allowed, remaining = await check_wallet_topup_limit(current_user.id)
    if not is_allowed:
        raise HTTPException(
            status_code=429,
            detail=f"Top-up limit exceeded. You can do {remaining} more top-ups this hour."
        )
    
    # ── Validation: Transaction amount limit ──
    MAX_TOPUP_AMOUNT = 10000  # Max ₹10,000 per transaction
    
    if not (0 < data.amount <= MAX_TOPUP_AMOUNT):
        raise HTTPException(
            status_code=400,
            detail=f"Amount must be between ₹1 and ₹{MAX_TOPUP_AMOUNT}"
        )
    
    # ── Validation: Daily total limit ──
    is_allowed, remaining_daily = await check_daily_wallet_total(
        current_user.id,
        data.amount
    )
    if not is_allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Daily limit exceeded. You can top up ₹{remaining_daily:.0f} more today."
        )

    result = await db.execute(select(Wallet).where(Wallet.user_id == current_user.id))
    wallet = result.scalar_one_or_none()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")

    wallet.balance += data.amount

    tx = Transaction(
        wallet_id=wallet.id,
        amount=data.amount,
        type=TransactionType.credit,
        description="Wallet top-up (simulated)",
    )
    db.add(tx)
    await db.flush()
    
    # Record successful top-up
    await record_wallet_topup(current_user.id, data.amount)
    
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
