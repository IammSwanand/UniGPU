"""
UniGPU Agent — Configuration
Loads settings from:
  1. %APPDATA%/UniGPU/config.json  (persistent, written by GUI)
  2. .env file fallback             (dev/legacy)
  3. Hardcoded defaults
"""

import json
import os
import sys
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

# Load .env from agent root directory (dev fallback)
# __file__ is src/core/config.py → agent root is two levels up
_agent_root = Path(__file__).parent.parent.parent
_env_path = _agent_root / ".env"
if _env_path.exists():
    load_dotenv(_env_path)


def _appdata_dir() -> Path:
    """Return %APPDATA%/UniGPU on Windows, ~/.config/unigpu elsewhere."""
    if sys.platform == "win32":
        base = Path(os.environ.get("APPDATA", Path.home() / "AppData" / "Roaming"))
    else:
        base = Path(os.environ.get("XDG_CONFIG_HOME", Path.home() / ".config"))
    return base / "UniGPU"


def _config_file() -> Path:
    """Return the path to the persistent JSON config file."""
    return _appdata_dir() / "config.json"


def _log_dir() -> Path:
    """Return the path to the log directory."""
    d = _appdata_dir() / "logs"
    d.mkdir(parents=True, exist_ok=True)
    return d


def _load_json_config() -> dict:
    """Load the JSON config file if it exists."""
    path = _config_file()
    if path.exists():
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            pass
    return {}


def _get(json_cfg: dict, key: str, env_key: str, default: str) -> str:
    """Resolve a config value: JSON → env var → default."""
    return json_cfg.get(key, os.getenv(env_key, default))


@dataclass
class AgentConfig:
    """Agent configuration — loaded from JSON config, .env, or defaults."""

    # GPU identity (must match the GPU id registered in backend)
    gpu_id: str = ""

    # Backend endpoints
    backend_ws_url: str = "ws://localhost:8000/ws/agent"
    backend_http_url: str = "http://localhost:8000"

    # Authentication
    agent_token: str = ""

    # Heartbeat
    heartbeat_interval: int = 10

    # Work directory for job files & outputs
    work_dir: str = "./jobs"

    # Maximum job execution time in seconds
    max_job_timeout: int = 3600

    # Docker base image for jobs
    docker_base_image: str = "python:3.11-slim"

    # Resource limits
    cpu_limit: float = 4.0
    memory_limit: str = "8g"

    # Log batching interval (seconds)
    log_batch_interval: float = 0.2

    @classmethod
    def load(cls) -> "AgentConfig":
        """Load config with priority: JSON file → .env → defaults."""
        j = _load_json_config()
        return cls(
            gpu_id=_get(j, "gpu_id", "GPU_ID", ""),
            backend_ws_url=_get(j, "backend_ws_url", "BACKEND_WS_URL", "ws://localhost:8000/ws/agent"),
            backend_http_url=_get(j, "backend_http_url", "BACKEND_HTTP_URL", "http://localhost:8000"),
            agent_token=_get(j, "agent_token", "AGENT_TOKEN", ""),
            heartbeat_interval=int(_get(j, "heartbeat_interval", "HEARTBEAT_INTERVAL", "10")),
            work_dir=_get(j, "work_dir", "WORK_DIR", str(_appdata_dir() / "jobs")),
            max_job_timeout=int(_get(j, "max_job_timeout", "MAX_JOB_TIMEOUT", "3600")),
            docker_base_image=_get(j, "docker_base_image", "DOCKER_BASE_IMAGE", "python:3.11-slim"),
            cpu_limit=float(_get(j, "cpu_limit", "CPU_LIMIT", "4.0")),
            memory_limit=_get(j, "memory_limit", "MEMORY_LIMIT", "8g"),
            log_batch_interval=float(_get(j, "log_batch_interval", "LOG_BATCH_INTERVAL", "0.2")),
        )

    def save(self) -> Path:
        """Write current config to JSON file. Returns the path."""
        path = _config_file()
        path.parent.mkdir(parents=True, exist_ok=True)
        data = {
            "gpu_id": self.gpu_id,
            "backend_ws_url": self.backend_ws_url,
            "backend_http_url": self.backend_http_url,
            "agent_token": self.agent_token,
            "heartbeat_interval": self.heartbeat_interval,
            "work_dir": self.work_dir,
            "max_job_timeout": self.max_job_timeout,
            "docker_base_image": self.docker_base_image,
            "cpu_limit": self.cpu_limit,
            "memory_limit": self.memory_limit,
            "log_batch_interval": self.log_batch_interval,
        }
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        return path

    @staticmethod
    def config_file_path() -> Path:
        return _config_file()

    @staticmethod
    def log_dir() -> Path:
        return _log_dir()

    @staticmethod
    def is_first_run() -> bool:
        """True if no config.json exists yet (triggers setup wizard)."""
        return not _config_file().exists()

    @property
    def ws_connect_url(self) -> str:
        """Full WebSocket URL including gpu_id path segment."""
        base = self.backend_ws_url.rstrip("/")
        url = f"{base}/{self.gpu_id}"
        if self.agent_token:
            url += f"?token={self.agent_token}"
        return url

    def ensure_work_dir(self) -> Path:
        """Create and return the work directory path."""
        path = Path(self.work_dir)
        path.mkdir(parents=True, exist_ok=True)
        return path

    def validate(self) -> None:
        """Validate required configuration."""
        if not self.gpu_id:
            raise ValueError(
                "GPU_ID is required. Register your GPU via the backend "
                "(POST /gpus/register) and set GPU_ID in your .env file."
            )

    def __str__(self) -> str:
        return (
            f"AgentConfig(\n"
            f"  gpu_id={self.gpu_id}\n"
            f"  ws_connect_url={self.ws_connect_url}\n"
            f"  backend_http_url={self.backend_http_url}\n"
            f"  heartbeat_interval={self.heartbeat_interval}s\n"
            f"  work_dir={self.work_dir}\n"
            f"  max_job_timeout={self.max_job_timeout}s\n"
            f"  docker_base_image={self.docker_base_image}\n"
            f"  cpu_limit={self.cpu_limit} | memory_limit={self.memory_limit}\n"
            f")"
        )
