# UniGPU Security Audit Report
**Date:** May 4, 2026  
**Scope:** Full stack (Frontend, Backend, Agent)  
**Assessment Level:** Senior Cybersecurity Engineer

---

## CRITICAL VULNERABILITIES (CRIT-01 to CRIT-06)

### CRIT-01: Hardcoded Default SECRET_KEY [CRITICAL]
**Location:** `backend/app/config.py:19`  
**Severity:** CRITICAL  
**CWE:** CWE-798 (Use of Hard-coded Credentials)

```python
SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-change-me-in-prod")
```

**Issue:** The default JWT secret key is hardcoded and exposed in source code. Any attacker can forge valid JWT tokens for any user.

**Impact:** Complete authentication bypass, privilege escalation, account takeover.

**Fix:**
```python
SECRET_KEY: str = os.getenv("SECRET_KEY")
# Validate at startup that SECRET_KEY is set
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable must be set in production")
```

---

### CRIT-02: Hardcoded Database Credentials [CRITICAL]
**Location:** `backend/app/config.py:12-13`  
**Severity:** CRITICAL  
**CWE:** CWE-798

```python
DATABASE_URL: str = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://unigpu:unigpu_secret@localhost:5432/unigpu"
)
```

**Issue:** Default database credentials are hardcoded, visible in source control, and exposed in Docker builds.

**Impact:** Unauthorized database access, complete data breach.

**Fix:**
```python
DATABASE_URL: str = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL must be set")
```

---

### CRIT-03: CORS Wildcard Configuration [CRITICAL]
**Location:** `backend/app/main.py:32-35, app/config.py:34`  
**Severity:** CRITICAL  
**CWE:** CWE-942 (Permissive Cross-domain Policy)

```python
ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "*")
app.add_middleware(CORSMiddleware, allow_origins=_origins, allow_credentials=True, ...)
```

**Issue:** Default CORS allows `*` (all origins) with `allow_credentials=True`. This enables CSRF attacks and credential theft via cross-origin requests.

**Impact:** CSRF attacks, session hijacking, sensitive data exposure.

**Fix:**
```python
ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "")
if not _origins:
    raise ValueError("ALLOWED_ORIGINS must be explicitly configured")
app.add_middleware(CORSMiddleware, allow_origins=_origins, allow_credentials=False, ...)
# Only set allow_credentials=True if absolutely necessary and origins are specific
```

---

### CRIT-04: Unauthenticated Job File Download [CRITICAL]
**Location:** `backend/app/routers/jobs.py:159-175`  
**Severity:** CRITICAL  
**CWE:** CWE-639 (Authorization Bypass Through User-Controlled Key)

```python
@router.get("/{job_id}/download/{filename}")
async def download_job_file(job_id: str, filename: str):
    """No auth required — job UUID is unguessable."""
```

**Issue:** Job files are downloadable without authentication. While UUIDs are hard to guess, this violates zero-trust principles and assumes the attacker cannot enumerate UUIDs or intercept URLs. Sensitive training data/scripts exposed.

**Impact:** Unauthorized access to training scripts, data exfiltration, IP theft.

**Recommendation:** Require authentication or generate short-lived download tokens.

```python
@router.get("/{job_id}/download/{filename}")
async def download_job_file(
    job_id: str, 
    filename: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job or job.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
```

---

### CRIT-05: Shell Command Injection in Docker Executor [CRITICAL]
**Location:** `agent/src/core/executor.py:207-215`  
**Severity:** CRITICAL  
**CWE:** CWE-78 (OS Command Injection)

```python
cmd_parts = []
if req_url and (input_dir / req_name).exists():
    cmd_parts.append(f"pip install -q -r /workspace/input/{req_name} &&")
cmd_parts.append(f"python /workspace/input/{script_name}")
full_cmd = " ".join(cmd_parts)

container = client.containers.run(
    image=image,
    command=["bash", "-c", full_cmd],  # ⚠️ Shell injection vulnerability
```

**Issue:** Script names from URLs are directly interpolated into shell commands without escaping. A malicious filename like `; rm -rf / #` executes arbitrary code inside the container.

**Impact:** RCE inside container, data deletion, lateral movement to host.

**Fix:**
```python
# Use list of commands instead of shell string
cmd = []
if req_url and (input_dir / req_name).exists():
    cmd.extend(["pip", "install", "-q", "-r", f"/workspace/input/{req_name}", "&&"])
cmd.extend(["python", f"/workspace/input/{script_name}"])

# Use shlex.quote() if shell is required
import shlex
full_cmd = " ".join(shlex.quote(str(arg)) for arg in cmd)
```

---

### CRIT-06: Weak Token Expiration (24 hours) [CRITICAL]
**Location:** `backend/app/config.py:21`  
**Severity:** CRITICAL  
**CWE:** CWE-613 (Insufficient Session Expiration)

```python
ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
```

**Issue:** JWT tokens valid for 24 hours without refresh mechanism. Stolen tokens have a large window of exploitation.

**Impact:** Extended session hijacking window.

**Fix:**
```python
ACCESS_TOKEN_EXPIRE_MINUTES: int = 15  # 15 minutes
REFRESH_TOKEN_EXPIRE_DAYS: int = 7    # Refresh tokens last 7 days
# Implement refresh token endpoint
```

---

## HIGH VULNERABILITIES (HIGH-01 to HIGH-07)

### HIGH-01: No Input Validation on Filename Upload [HIGH]
**Location:** `backend/app/routers/jobs.py:45, 48`  
**Severity:** HIGH  
**CWE:** CWE-434 (Unrestricted Upload of File with Dangerous Type)

```python
script_path = await _save_upload(script, job_id, script.filename)
if requirements:
    req_path = await _save_upload(requirements, job_id, requirements.filename)
```

**Issue:** File uploads accept any filename and extension. No validation on:
- File size
- File type (MIME type)
- Filename length/encoding

**Impact:** Disk space exhaustion, stored XSS if files served via web, path traversal.

**Fix:**
```python
ALLOWED_EXTENSIONS = {'.py', '.txt'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

async def _validate_upload(file: UploadFile, job_id: str) -> None:
    if not file.filename:
        raise HTTPException(400, "Filename missing")
    
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Only {ALLOWED_EXTENSIONS} allowed")
    
    if file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(400, "File too large")
```

---

### HIGH-02: No Rate Limiting on Auth Endpoints [HIGH]
**Location:** `backend/app/routers/auth.py:33-71`  
**Severity:** HIGH  
**CWE:** CWE-770 (Allocation of Resources Without Limits or Throttling)

```python
@router.post("/register", ...)
@router.post("/login", ...)
```

**Issue:** No rate limiting on `/auth/register` and `/auth/login`. Attackers can brute-force passwords or spam accounts.

**Impact:** Account enumeration, credential stuffing, DoS.

**Fix:** Use SlowAPI or similar rate limiting library:
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, ...):
```

---

### HIGH-03: Missing HTTPS Enforcement [HIGH]
**Location:** Frontend & Backend (Architecture)  
**Severity:** HIGH  
**CWE:** CWE-295 (Improper Certificate Validation)

**Issue:** No mention of HTTPS enforcement, HSTS headers, or certificate validation in production config.

**Impact:** MITM attacks, credential interception, data eavesdropping.

**Fix:**
```python
# Add to main.py
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["yourdomain.com", "www.yourdomain.com"]
)

# Add HSTS header
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    return response
```

---

### HIGH-04: Missing SQL Injection Detection (SQLAlchemy ORM Safe, but...) [HIGH]
**Location:** `backend/app/routers/admin.py:27`  
**Severity:** HIGH (Low practical risk due to ORM, but principle)  
**CWE:** CWE-89

```python
@router.get("/jobs")
async def admin_list_jobs(status: JobStatus | None = None, ...):
    query = select(Job)
    if status:
        query = query.where(Job.status == status)
```

**Issue:** While SQLAlchemy protects against SQL injection, the `status` parameter is not validated. Invalid enum values could cause errors. String path parameters (`gpu_id`, `job_id`) used directly in database queries.

**Impact:** Potential error disclosure, DoS.

**Fix:**
```python
if status:
    # Validate enum value
    try:
        valid_status = JobStatus(status)
        query = query.where(Job.status == valid_status)
    except ValueError:
        raise HTTPException(400, f"Invalid status: {status}")
```

---

### HIGH-05: No Input Validation on Wallet Top-Up Amount [HIGH]
**Location:** `backend/app/routers/wallet.py:20-24`  
**Severity:** HIGH  
**CWE:** CWE-400 (Uncontrolled Resource Consumption)

```python
@router.post("/topup", ...)
async def topup_wallet(data: WalletTopUp, ...):
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    wallet.balance += data.amount  # No upper limit
```

**Issue:** No upper limit on top-up amount. A user could add unlimited credits. The comment says "simulated" but in production this is a financial vulnerability.

**Impact:** Revenue loss, economic abuse.

**Fix:**
```python
MAX_TOPUP_AMOUNT = 10000  # Max ₹10,000 per transaction

if not (0 < data.amount <= MAX_TOPUP_AMOUNT):
    raise HTTPException(400, f"Amount must be 0 < x <= {MAX_TOPUP_AMOUNT}")
```

---

### HIGH-06: JWT Algorithm Not Restricted [HIGH]
**Location:** `backend/app/deps.py:26`  
**Severity:** HIGH  
**CWE:** CWE-347 (Improper Verification of Cryptographic Signature)

```python
payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
```

**Issue:** While `algorithms` is specified, no protection against algorithm substitution attacks (e.g., attacker sends `alg: "none"`).

**Impact:** JWT bypass.

**Fix:**
```python
payload = jwt.decode(
    token, 
    settings.SECRET_KEY, 
    algorithms=[settings.ALGORITHM],  # Only HS256
    options={"verify_aud": False}
)
```

---

### HIGH-07: Docker Image Pull Without Digest Verification [HIGH]
**Location:** `agent/src/core/executor.py:324`  
**Severity:** HIGH  
**CWE:** CWE-345 (Insufficient Verification of Data Authenticity)

```python
client.images.pull(image)  # Pulls by tag, vulnerable to tag substitution
```

**Issue:** Docker image pulled by tag name (e.g., `python:3.11-slim`). Attacker can push malicious image with same tag to registry.

**Impact:** RCE inside container via compromised base image.

**Fix:**
```python
# Use image digest (SHA-256) instead of tag
TRUSTED_IMAGE_DIGEST = "python@sha256:abc123..."
client.images.pull(TRUSTED_IMAGE_DIGEST)
```

---

## MEDIUM VULNERABILITIES (MED-01 to MED-08)

### MED-01: No CSRF Token Protection on State-Changing Operations [MEDIUM]
**Location:** Frontend (`frontend/src/api/client.js`)  
**Severity:** MEDIUM  
**CWE:** CWE-352 (Cross-Site Request Forgery)

**Issue:** POST/PATCH/DELETE requests only use Bearer token. No CSRF tokens for double-submit cookie pattern.

**Impact:** CSRF attacks if cookies are accessible (SameSite not enforced).

**Fix:**
```python
# Backend: Add CSRF middleware
from fastapi_csrf_protect import CsrfProtect

@CsrfProtect.load_config
def load_config():
    return CsrfSettings(secret="your-secret")
```

---

### MED-02: Overly Verbose Error Messages [MEDIUM]
**Location:** `backend/app/routers/auth.py:65`  
**Severity:** MEDIUM  
**CWE:** CWE-209 (Information Exposure Through an Error Message)

```python
if not user or not _verify_password(data.password, user.hashed_password):
    raise HTTPException(status_code=401, detail="Invalid credentials")
```

**Note:** This is actually correct. But check other endpoints.

Actually, I found this:
**Location:** `backend/app/routers/jobs.py:73`
```python
print(f"📌 Client requested GPU: {gpu_id}")
print(f"🔌 Connected GPUs: {manager.get_active_gpu_ids()}")
```

**Issue:** Debug `print()` statements in production code leak internal state.

**Impact:** Information disclosure.

**Fix:**
```python
logger.debug("Client requested GPU: %s", gpu_id)
logger.debug("Connected GPUs: %s", manager.get_active_gpu_ids())
```

---

### MED-03: Missing Security Headers [MEDIUM]
**Location:** `backend/app/main.py`  
**Severity:** MEDIUM  
**CWE:** CWE-693 (Protection Mechanism Failure)

**Issue:** No security headers like:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Content-Security-Policy`
- `X-XSS-Protection`

**Impact:** XSS, clickjacking, MIME-type sniffing attacks.

**Fix:**
```python
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    return response
```

---

### MED-04: No Request Size Limits [MEDIUM]
**Location:** `backend/app/main.py`  
**Severity:** MEDIUM  
**CWE:** CWE-770

**Issue:** No `max_content_length` enforcement on FastAPI. Large file uploads can exhaust memory/disk.

**Impact:** DoS via large file uploads.

**Fix:**
```python
# In docker-compose.yml or FastAPI config
app = FastAPI()
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]
)
# Set max file upload size
```

---

### MED-05: Plaintext Password in Login Error Messages [MEDIUM]
**Location:** Frontend JWT decoding  
**Severity:** MEDIUM  
**CWE:** CWE-209

**Issue:** Frontend stores token in `localStorage` (not HttpOnly). If XSS occurs, token is accessible.

**Impact:** Token theft via XSS.

**Fix:**
```javascript
// Store token in memory instead of localStorage
// Use HttpOnly secure cookies (requires backend support)
```

---

### MED-06: No Logging of Security Events [MEDIUM]
**Location:** Entire backend  
**Severity:** MEDIUM  
**CWE:** CWE-778 (Insufficient Logging)

**Issue:** No audit logs for:
- Failed login attempts
- Authorization failures
- Large financial transactions
- Admin actions

**Impact:** Cannot detect attacks, forensic analysis impossible.

**Fix:**
```python
import logging
security_logger = logging.getLogger("security")

async def login(...):
    if not user or not _verify_password(data.password, user.hashed_password):
        security_logger.warning(f"Failed login attempt for username: {data.username}")
        raise HTTPException(...)
```

---

### MED-07: GPU Provider Ownership Not Verified on WebSocket [MEDIUM]
**Location:** `backend/app/routers/ws.py:44-72`  
**Severity:** MEDIUM  
**CWE:** CWE-639 (Authorization Bypass)

```python
async def agent_websocket(websocket: WebSocket, gpu_id: str, token: str | None = Query(default=None)):
    user = await _authenticate_websocket_user(websocket, token)
    # Checks that user owns GPU ✓
```

**Note:** Actually this IS checked. Good.

But missing: **No rate limiting on WebSocket connections.**

**Impact:** WebSocket DoS.

---

### MED-08: Private Key Exposure in Agent Setup Wizard [MEDIUM]
**Location:** `agent/src/gui/setup_wizard.py:326-328`  
**Severity:** MEDIUM  
**CWE:** CWE-798

```python
agent_token=self._token  # Token stored in plaintext JSON config
```

**Issue:** Agent token stored in plaintext in `%APPDATA%/UniGPU/config.json`. If PC is compromised, token is exposed.

**Impact:** GPU impersonation, job hijacking.

**Fix:**
```python
# Use OS keyring for token storage
import keyring

keyring.set_password("unigpu", f"gpu_{gpu_id}", token)
token = keyring.get_password("unigpu", f"gpu_{gpu_id}")
```

---

## LOW VULNERABILITIES (LOW-01 to LOW-03)

### LOW-01: Missing Content-Type Validation on File Downloads [LOW]
**Location:** `backend/app/routers/jobs.py:175`  
**Severity:** LOW  
**CWE:** CWE-434

```python
return FileResponse(path=str(file_path), media_type="application/octet-stream")
```

**Issue:** All files served as `application/octet-stream`. If an attacker uploads HTML, it's still served with correct header, but could be interpreted if accessed directly.

**Impact:** Low, mitigated by octet-stream.

**Fix:** Validate based on extension.

---

### LOW-02: Unauthenticated Health Check Endpoint [LOW]
**Location:** `backend/app/main.py:48-50`  
**Severity:** LOW  
**CWE:** CWE-203 (Observable Discrepancy)

```python
@app.get("/", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "UniGPU Backend"}
```

**Issue:** Public health check reveals service name/version. Can aid reconnaissance.

**Impact:** Information disclosure (minor).

**Fix:**
```python
@app.get("/")
async def health_check(current_user: User = Depends(get_current_user)):
    return {"status": "ok"}
```

---

### LOW-03: No Logging Configuration for Production [LOW]
**Location:** `backend/` (Architecture)  
**Severity:** LOW  
**CWE:** CWE-532 (Insertion of Sensitive Information into Log File)

**Issue:** Logging configuration not hardened. Could leak sensitive data if not configured properly.

**Impact:** Low practical impact if configured correctly.

**Fix:**
```python
import logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
```

---

## ARCHITECTURAL ISSUES (ARCH-01 to ARCH-02)

### ARCH-01: No Refresh Token Mechanism [ARCHITECTURAL]
**Severity:** MEDIUM  
**CWE:** CWE-613

**Issue:** Long-lived tokens (24h) without refresh tokens. Standard OAuth2 practice is:
- Short-lived access token (15 min)
- Refresh token (7 days)

**Fix:** Implement `POST /auth/refresh` endpoint.

---

### ARCH-02: No Two-Factor Authentication (2FA) [ARCHITECTURAL]
**Severity:** MEDIUM  
**CWE:** CWE-308 (Use of Single-factor Authentication)

**Issue:** Only password-based auth. No 2FA for high-privilege accounts (admin, providers).

**Fix:** Implement TOTP (Time-based OTP) for admin/provider accounts.

---

## DEPENDENCY VULNERABILITIES

### DEP-01: Known Vulnerable Dependency Check Required [DEPENDENCY]

**Action Items:**
```bash
# Run safety/bandit checks
pip install safety bandit
safety check
bandit -r backend/app agent/src

# Check for CVEs in locked dependencies
```

---

## SUMMARY TABLE

| ID | Title | Severity | Type | CWE |
|---|---|---|---|---|
| CRIT-01 | Hardcoded SECRET_KEY | CRITICAL | Credential Exposure | 798 |
| CRIT-02 | Hardcoded DB Credentials | CRITICAL | Credential Exposure | 798 |
| CRIT-03 | CORS Wildcard | CRITICAL | CSRF | 942 |
| CRIT-04 | Unauthenticated File Download | CRITICAL | Authorization Bypass | 639 |
| CRIT-05 | Shell Command Injection | CRITICAL | RCE | 78 |
| CRIT-06 | 24h Token Expiration | CRITICAL | Session Management | 613 |
| HIGH-01 | No Input Validation on Upload | HIGH | File Upload | 434 |
| HIGH-02 | No Rate Limiting on Auth | HIGH | Brute Force | 770 |
| HIGH-03 | Missing HTTPS Enforcement | HIGH | MITM | 295 |
| HIGH-04 | Missing SQL Input Validation | HIGH | Injection | 89 |
| HIGH-05 | No Top-Up Amount Limit | HIGH | Resource Exhaustion | 400 |
| HIGH-06 | JWT Algorithm Not Restricted | HIGH | Crypto | 347 |
| HIGH-07 | Docker Image Tag Substitution | HIGH | Supply Chain | 345 |
| MED-01 | No CSRF Token | MEDIUM | CSRF | 352 |
| MED-02 | Debug Print Statements | MEDIUM | Info Disclosure | 209 |
| MED-03 | Missing Security Headers | MEDIUM | XSS/Clickjacking | 693 |
| MED-04 | No Request Size Limits | MEDIUM | DoS | 770 |
| MED-05 | Token in localStorage | MEDIUM | XSS | 209 |
| MED-06 | No Security Audit Logging | MEDIUM | Logging | 778 |
| MED-07 | WebSocket DoS (No Rate Limit) | MEDIUM | DoS | - |
| MED-08 | Agent Token in Plaintext Config | MEDIUM | Credential Exposure | 798 |
| LOW-01 | Content-Type Validation | LOW | File Handling | 434 |
| LOW-02 | Public Health Endpoint | LOW | Info Disclosure | 203 |
| LOW-03 | Logging Not Production-Ready | LOW | Logging | 532 |
| ARCH-01 | No Refresh Token | MEDIUM | Auth Design | 613 |
| ARCH-02 | No 2FA | MEDIUM | Auth Design | 308 |

---

## REMEDIATION PRIORITY

### Immediate (Next 24 hours):
1. **CRIT-01**: Change SECRET_KEY to random value, regenerate all tokens
2. **CRIT-02**: Rotate database password, ensure .env is never committed
3. **CRIT-03**: Remove CORS wildcard, explicitly set allowed origins
4. **CRIT-05**: Escape shell commands or use non-shell execution

### Short-term (This week):
5. **CRIT-04**: Require authentication on file downloads
6. **HIGH-02**: Implement rate limiting on auth endpoints
7. **HIGH-01**: Add file upload validation (size, type, extension)

### Medium-term (This month):
8. **ARCH-01**: Implement refresh token mechanism
9. **ARCH-02**: Add 2FA for admin/provider accounts
10. **MED-03**: Add security headers middleware

---

## CONCLUSION

The UniGPU project has **6 CRITICAL vulnerabilities** that must be fixed before production deployment. The most severe are:

1. **Hardcoded secrets** (credentials, keys)
2. **CORS wildcard** (enables CSRF/XSS)
3. **Unauthenticated file access** (data exposure)
4. **Shell injection** (RCE)
5. **Missing auth on critical endpoints**
6. **Overly long token expiration**

These require immediate attention. The application should NOT be deployed to production until at least all CRITICAL vulnerabilities are resolved.
