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
def _get_rate_limit_key(request: Request) -> str:
    """
    Key function for rate limiting:
    - If user is authenticated: use user_id (per-user limit)
    - Otherwise: use IP address (per-IP limit)
    """
    # Try to get user from request (set by dependencies)
    user_id = getattr(request.state, "user_id", None)
    if user_id:
        return f"user-{user_id}"
    # Fallback to IP
    return get_remote_address(request)


limiter = Limiter(key_func=_get_rate_limit_key)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──
    os.makedirs("uploads", exist_ok=True)
    print("✅ Upload directory ready")
    yield
    # ── Shutdown ──
    print("👋 Shutting down UniGPU backend")


# ── Create FastAPI app with conditional docs ──
app = FastAPI(
    title="UniGPU",
    description="Centralized peer-to-peer GPU sharing platform",
    version="0.1.0",
    lifespan=lifespan,
    # Disable Swagger UI, ReDoc, and OpenAPI schema in production
    docs_url=None if not settings.DEBUG else "/docs",
    redoc_url=None if not settings.DEBUG else "/redoc",
    openapi_url=None if not settings.DEBUG else "/openapi.json",
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


# ── Middleware to extract user ID for per-user rate limiting ──
@app.middleware("http")
async def set_user_id_for_rate_limiting(request: Request, call_next):
    """Extract user ID from JWT token if present, to enable per-user rate limiting."""
    from jose import jwt as jwt_module
    from jose.exceptions import JWTError
    
    request.state.user_id = None
    
    # Try to extract user ID from Authorization header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        try:
            token = auth_header[7:]  # Remove "Bearer "
            payload = jwt_module.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            user_id = payload.get("sub")
            if user_id:
                request.state.user_id = user_id
        except JWTError:
            pass  # Invalid token, will be caught by auth dependency
    
    response = await call_next(request)
    return response


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
