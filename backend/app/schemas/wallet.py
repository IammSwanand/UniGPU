from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from app.models.wallet import TransactionType


# ── Request ──
class WalletTopUp(BaseModel):
    amount: float


# ── Response ──
class WalletOut(BaseModel):
    id: str
    user_id: str
    balance: float
    created_at: datetime

    class Config:
        from_attributes = True


class TransactionOut(BaseModel):
    id: str
    wallet_id: str
    amount: float
    type: TransactionType
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
