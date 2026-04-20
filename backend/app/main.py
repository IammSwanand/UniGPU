from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.routers import auth, gpus, jobs, wallet, admin, ws
from app.config import get_settings
import os

settings = get_settings()



@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──
    os.makedirs("uploads", exist_ok=True)
    await init_db()
    print("✅ Database tables created & upload dir ready")
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
