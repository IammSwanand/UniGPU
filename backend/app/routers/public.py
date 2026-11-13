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
        # Believable baseline & organic growth for an early-stage / non-marketed platform.
        # Uses sublinear scaling and circadian diurnal rhythm so numbers feel authentic,
        # never jump unrealistically, and remain strictly non-decreasing across refreshes.
        epoch = 1794500000  # Nov 13, 2026 anchor
        elapsed_seconds = max(0.0, time.time() - epoch)
        days = elapsed_seconds / 86400.0

        # Sublinear scaling (0.88 exponent) ensures steady near-term progress
        # while preventing runaway numbers over months/years
        effective_days = (days ** 0.88) if days > 0 else 0.0

        # Circadian diurnal cycle (active daytime jobs, calm night periods)
        diurnal = math.sin(2 * math.pi * days - (math.pi / 2))

        # 1. Registered GPUs: ~1 new node every 3-4 days (believable early cluster)
        gpus = 36 + int(effective_days * 0.25)

        # 2. Jobs Completed: ~3-4 jobs/day with diurnal pacing
        jobs_progress = (effective_days * 3.2) + (0.25 * diurnal)
        jobs = 214 + int(max(0.0, jobs_progress))

        # 3. Compute Hours: ~0.70 hrs (42 min) average per job
        hours_progress = (effective_days * 2.25) + (0.18 * diurnal)
        hours = 152 + int(max(0.0, hours_progress))

        # 4. Credits Earned: calibrated to UniGPU's RATE_PER_SECOND ($0.002/s -> 7.2 credits/hr)
        credits_progress = (effective_days * 16.2) + (1.3 * diurnal)
        credits = 1095 + int(max(0.0, credits_progress))

        return {
            "registered_gpus": gpus,
            "jobs_completed": jobs,
            "compute_hours": hours,
            "credits_earned": credits
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
