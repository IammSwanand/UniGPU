"""End-to-end API test for UniGPU backend."""
import httpx
import sys

BASE = "http://localhost:8000"
PASS = 0
FAIL = 0


def test(name, response, expected_status=200):
    global PASS, FAIL
    ok = response.status_code == expected_status
    icon = "[PASS]" if ok else "[FAIL]"
    print(f"  {icon} {name} -- {response.status_code} (expected {expected_status})")
    if not ok:
        print(f"     Response: {response.text[:200]}")
        FAIL += 1
    else:
        PASS += 1
    return ok


def main():
    global PASS, FAIL
    client = httpx.Client(base_url=BASE, timeout=10)

    # ================================================
    print("\n--- HEALTH CHECK ---")
    # ================================================
    r = client.get("/")
    test("GET /", r)

    # ================================================
    print("\n--- AUTH: Register Users ---")
    # ================================================
    r = client.post("/auth/register", json={
        "email": "client@test.com", "username": "testclient",
        "password": "pass123", "role": "client"
    })
    test("Register client", r, 201)

    r = client.post("/auth/register", json={
        "email": "provider@test.com", "username": "testprovider",
        "password": "pass123", "role": "provider"
    })
    test("Register provider", r, 201)

    r = client.post("/auth/register", json={
        "email": "admin@test.com", "username": "testadmin",
        "password": "pass123", "role": "admin"
    })
    test("Register admin", r, 201)

    # Duplicate test
    r = client.post("/auth/register", json={
        "email": "client@test.com", "username": "testclient",
        "password": "pass123", "role": "client"
    })
    test("Reject duplicate registration", r, 400)

    # ================================================
    print("\n--- AUTH: Login ---")
    # ================================================
    r = client.post("/auth/login", json={"username": "testclient", "password": "pass123"})
    test("Login client", r)
    client_token = r.json()["access_token"] if r.status_code == 200 else None

    r = client.post("/auth/login", json={"username": "testprovider", "password": "pass123"})
    test("Login provider", r)
    provider_token = r.json()["access_token"] if r.status_code == 200 else None

    r = client.post("/auth/login", json={"username": "testadmin", "password": "pass123"})
    test("Login admin", r)
    admin_token = r.json()["access_token"] if r.status_code == 200 else None

    r = client.post("/auth/login", json={"username": "testclient", "password": "wrong"})
    test("Reject bad password", r, 401)

    if not all([client_token, provider_token, admin_token]):
        print("\n[FATAL] Cannot continue -- login failed")
        sys.exit(1)

    client_headers = {"Authorization": f"Bearer {client_token}"}
    provider_headers = {"Authorization": f"Bearer {provider_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # ================================================
    print("\n--- GPU: Register & List ---")
    # ================================================
    r = client.post("/gpus/register", json={
        "name": "RTX 3060", "vram_mb": 12288, "cuda_version": "12.1"
    }, headers=provider_headers)
    test("Register GPU (provider)", r, 201)
    gpu_id = r.json()["id"] if r.status_code == 201 else None

    r = client.post("/gpus/register", json={
        "name": "RTX 4090", "vram_mb": 24576, "cuda_version": "12.4"
    }, headers=provider_headers)
    test("Register GPU 2 (provider)", r, 201)

    # Client should NOT be able to register
    r = client.post("/gpus/register", json={
        "name": "Fake GPU", "vram_mb": 1000
    }, headers=client_headers)
    test("Reject GPU register by client (role check)", r, 403)

    r = client.get("/gpus/")
    test("List all GPUs", r)
    print(f"     -> {len(r.json())} GPUs found")

    r = client.get("/gpus/available?min_vram=8000")
    test("List available GPUs (all offline initially)", r)
    print(f"     -> {len(r.json())} available")

    # Update GPU status to online
    if gpu_id:
        r = client.patch(f"/gpus/{gpu_id}/status", json={"status": "online"}, headers=provider_headers)
        test("Set GPU online", r)

        r = client.get("/gpus/available?min_vram=8000")
        test("Available GPUs after going online", r)
        print(f"     -> {len(r.json())} available")

    # ================================================
    print("\n--- WALLET: TopUp & Balance ---")
    # ================================================
    r = client.get("/wallet/", headers=client_headers)
    test("Get client wallet", r)
    print(f"     -> Balance: ${r.json()['balance']}")

    r = client.post("/wallet/topup", json={"amount": 100.0}, headers=client_headers)
    test("Top up $100", r)
    print(f"     -> New balance: ${r.json()['balance']}")

    r = client.get("/wallet/transactions", headers=client_headers)
    test("Get transactions", r)
    print(f"     -> {len(r.json())} transactions")

    # Reject negative topup
    r = client.post("/wallet/topup", json={"amount": -50.0}, headers=client_headers)
    test("Reject negative top-up", r, 400)

    # ================================================
    print("\n--- JOBS: Submit & List ---")
    # ================================================
    script_content = b"import torch\nprint('Hello from UniGPU!')\nprint(torch.cuda.is_available())"
    req_content = b"torch>=2.0"

    r = client.post("/jobs/submit",
        files={"script": ("train.py", script_content), "requirements": ("requirements.txt", req_content)},
        headers=client_headers,
    )
    test("Submit job", r, 201)
    job_id = r.json()["id"] if r.status_code == 201 else None

    if job_id:
        r = client.get(f"/jobs/{job_id}", headers=client_headers)
        test("Get job details", r)
        print(f"     -> Status: {r.json()['status']}")

        r = client.get(f"/jobs/{job_id}/logs", headers=client_headers)
        test("Get job logs", r)

    r = client.get("/jobs/", headers=client_headers)
    test("List client jobs", r)
    print(f"     -> {len(r.json())} jobs")

    # Provider shouldn't see client jobs
    r = client.get("/jobs/", headers=provider_headers)
    test("Provider sees own jobs only (should be 0)", r)
    print(f"     -> {len(r.json())} jobs (provider)")

    # ================================================
    print("\n--- ADMIN: Dashboard Endpoints ---")
    # ================================================
    r = client.get("/admin/stats", headers=admin_headers)
    test("Admin stats", r)
    if r.status_code == 200:
        stats = r.json()
        print(f"     -> GPUs: {stats['total_gpus']}, Online: {stats['online_gpus']}, "
              f"Jobs: {stats['total_jobs']}, Users: {stats['total_users']}")

    r = client.get("/admin/gpus", headers=admin_headers)
    test("Admin list GPUs", r)

    r = client.get("/admin/jobs", headers=admin_headers)
    test("Admin list jobs", r)

    r = client.get("/admin/users", headers=admin_headers)
    test("Admin list users", r)
    print(f"     -> {len(r.json())} users")

    # Non-admin should be rejected
    r = client.get("/admin/stats", headers=client_headers)
    test("Reject admin endpoint for client", r, 403)

    # Unauthenticated should be rejected
    r = client.get("/admin/stats")
    test("Reject admin endpoint with no auth", r, 401)

    # ================================================
    print(f"\n{'='*50}")
    print(f"  RESULTS: {PASS} passed, {FAIL} failed, {PASS+FAIL} total")
    print(f"{'='*50}\n")
    sys.exit(1 if FAIL > 0 else 0)


if __name__ == "__main__":
    main()
