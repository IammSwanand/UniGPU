from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import json
import redis
import math
import time
from app.database import get_db
from app.models.gpu import GPU
from app.models.job import Job, JobStatus
from app.config import get_settings
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.models.settings import SystemSettings

router = APIRouter(prefix="/public", tags=["Public"])

settings = get_settings()
limiter = Limiter(key_func=get_remote_address)

# Initialize Redis client using the same REDIS_URL as the rest of the app
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

CACHE_KEY = "unigpu:public:stats"
CACHE_TTL = 300  # 5 minutes

@router.get("/stats")
@limiter.limit("30/minute")
async def get_platform_stats(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Returns aggregated platform statistics.
    Uses Redis for caching to prevent database overload if using live stats.
    Otherwise returns hardcoded impressive seed stats.
    """
    if not settings.USE_LIVE_STATS:
        # Use deterministic growth based on time elapsed since a fixed epoch (roughly today)
        # so the numbers realistically creep up without bouncing down on refreshes.
        epoch = 1786600000
        elapsed_minutes = max(0, (time.time() - epoch) / 60)
        
        return {
            "registered_gpus": 142 + int(elapsed_minutes * 0.05), # ~1 GPU every 20 mins
            "jobs_completed": 1205 + int(elapsed_minutes * 0.8),  # ~1 job per min
            "compute_hours": 850 + int(elapsed_minutes * 0.5),    # ~1 compute hr every 2 mins
            "credits_earned": 3200 + int(elapsed_minutes * 3.5)   # ~3.5 credits per min
        }

    # 1. Try to fetch from cache
    try:
        cached_stats = redis_client.get(CACHE_KEY)
        if cached_stats:
            return json.loads(cached_stats)
    except Exception as e:
        print(f"Redis cache error (read): {e}")

    # 2. If no cache, perform aggregate queries
    
    # Total Registered GPUs
    gpu_count_result = await db.execute(select(func.count(GPU.id)))
    total_gpus = gpu_count_result.scalar() or 0
    
    # Jobs Completed
    job_count_result = await db.execute(
        select(func.count(Job.id)).where(Job.status == JobStatus.completed)
    )
    jobs_completed = job_count_result.scalar() or 0
    
    # Compute Hours (duration is in seconds)
    duration_sum_result = await db.execute(
        select(func.sum(Job.duration_seconds)).where(Job.status == JobStatus.completed)
    )
    total_seconds = duration_sum_result.scalar() or 0
    compute_hours = math.ceil(total_seconds / 3600)
    
    # Credits Earned (Sum of cost)
    cost_sum_result = await db.execute(
        select(func.sum(Job.cost)).where(Job.status == JobStatus.completed)
    )
    credits_earned = cost_sum_result.scalar() or 0.0

    stats = {
        "registered_gpus": total_gpus,
        "jobs_completed": jobs_completed,
        "compute_hours": compute_hours,
        "credits_earned": int(credits_earned)
    }

    # 3. Save to cache
    try:
        redis_client.setex(CACHE_KEY, CACHE_TTL, json.dumps(stats))
    except Exception as e:
        print(f"Redis cache error (write): {e}")

    return stats

@router.get("/agent-release")
async def get_agent_release(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SystemSettings).where(SystemSettings.id == "default"))
    settings_row = result.scalar_one_or_none()
    
    if not settings_row or not settings_row.agent_version:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No agent release found")
        
    return {
        "version": settings_row.agent_version,
        "patch_notes": settings_row.agent_patch_notes,
        "download_url": settings_row.agent_download_url
    }
