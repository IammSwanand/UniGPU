from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserOut, UserProfileUpdate
from app.routers.auth import _build_user_out

router = APIRouter()

async def get_current_user(request: Request, db: AsyncSession = Depends(get_db)) -> User:
    """Dependency to get the current user based on the request state."""
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")
        
    return user

@router.get("/me", response_model=UserOut)
async def get_me(user: User = Depends(get_current_user)):
    """Get the current authenticated user's profile."""
    return _build_user_out(user)

@router.patch("/me", response_model=UserOut)
async def update_me(
    data: UserProfileUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update the current user's profile."""
    # Update only provided fields
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value)
        
    await db.flush()
    return _build_user_out(user)
