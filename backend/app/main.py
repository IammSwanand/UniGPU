from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse
from app.routers import auth, gpus, jobs, wallet, admin, ws
from app.config import get_settings
import os

settings = get_settings()

# ── Rate Limiter Setup ──
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──
    os.makedirs("uploads", exist_ok=True)
    print("✅ Upload directory ready")
    yield
    # ── Shutdown ──
    print("👋 Shutting down UniGPU backend")


app = FastAPI(
    title="UniGPU",
    description="Centralized peer-to-peer GPU sharing platform",
    version="0.1.0",
    lifespan=lifespan,
)

# ── CORS ──
# In production, ALLOWED_ORIGINS is set to the actual frontend domain via .env.prod
_origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Rate Limiter State ──
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Please try again later."}
    )

# ── REST Routers ──
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(gpus.router, prefix="/gpus", tags=["GPUs"])
app.include_router(jobs.router, prefix="/jobs", tags=["Jobs"])
app.include_router(wallet.router, prefix="/wallet", tags=["Wallet"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])

# ── WebSocket ──
app.include_router(ws.router, tags=["WebSocket"])


@app.get("/", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "UniGPU Backend"}
