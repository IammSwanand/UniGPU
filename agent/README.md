# UniGPU Agent

> Desktop application that shares your GPU with the UniGPU network.

Students install this agent on their GPU-equipped machines to earn credits by running training jobs for other students.

---

## Quick Start

```powershell
# Install dependencies (one time)
pip install -r requirements.txt

# Run the agent
python run.py              # GUI mode — system tray
python run.py --headless   # CLI mode — terminal only
```

On first launch, a **setup wizard** will guide you through:
1. Entering the backend server URL
2. Logging in with your UniGPU account
3. Detecting and registering your GPU

---

## Building the Installer

```powershell
# Build standalone .exe (requires PyInstaller)
python scripts/build.py

# Output: dist/UniGPU Agent/UniGPU Agent.exe

# Optional: Compile Windows installer (requires Inno Setup)
# Open scripts/installer.iss in Inno Setup Compiler → Build
```

---

## Project Structure

```
agent/
├── run.py                  # Entry point — run this
├── requirements.txt        # Python dependencies
├── .env.example            # Example config for dev mode
├── .gitignore
├── Dockerfile              # Container deployment (alternative)
│
├── src/                    # Source code
│   ├── agent.py            # Main orchestrator (UniGPUAgent class)
│   ├── core/               # Backend logic
│   │   ├── config.py       # Config (JSON in %APPDATA% + .env fallback)
│   │   ├── ws_client.py    # WebSocket client with auto-reconnect
│   │   ├── executor.py     # Docker job runner
│   │   ├── gpu_detector.py # GPU detection (nvidia-smi)
│   │   ├── log_streamer.py # Real-time log streaming
│   │   └── uploader.py     # Artifact upload
│   └── gui/                # Desktop GUI
│       ├── tray.py         # System tray icon & menu
│       ├── settings.py     # Settings editor window
│       └── setup_wizard.py # First-run setup wizard
│
├── scripts/                # Build tooling
│   ├── build.py            # PyInstaller build script
│   ├── gen_icon.py         # Icon generator
│   └── installer.iss       # Inno Setup installer script
│
├── assets/                 # Static assets
│   └── icon.ico            # App icon
│
└── jobs/                   # Local job working directory
```

---

## Configuration

Config is stored at `%APPDATA%/UniGPU/config.json` (created by setup wizard or settings).

Falls back to `.env` file in the agent root for development.

| Setting | Description | Default |
|---|---|---|
| `gpu_id` | Registered GPU ID | *(set by wizard)* |
| `backend_http_url` | Backend API URL | `http://localhost:8000` |
| `backend_ws_url` | Backend WebSocket URL | `ws://localhost:8000/ws/agent` |
| `work_dir` | Job files directory | `%APPDATA%/UniGPU/jobs` |
| `docker_base_image` | Docker image for jobs | `python:3.11-slim` |
| `heartbeat_interval` | Seconds between heartbeats | `10` |
| `max_job_timeout` | Max job runtime (seconds) | `3600` |

---

## System Tray

When running in GUI mode, the agent appears as a system tray icon:

| Icon Color | Meaning |
|---|---|
| 🟢 Green | Connected / running job |
| 🟡 Yellow | Connecting |
| 🔴 Red | Disconnected |

**Right-click menu:** Status · Settings · Log Folder · Start/Stop · Exit
