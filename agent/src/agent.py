"""
UniGPU GPU Agent — Main Entry Point
===================================
A lightweight compute agent that runs on provider (student) machines.

Launch modes:
  - Default (GUI):     Double-click or run without args → system tray app
  - Headless (CLI):    python -m src.agent --headless   → original CLI mode
  - First run:         No config.json exists            → setup wizard first

Responsibilities:
  - Detect GPU hardware (name, VRAM, CUDA version)
  - Connect to the UniGPU backend via WebSocket at /ws/agent/{gpu_id}
  - Send periodic heartbeats
  - Receive job assignments (assign_job)
  - Execute jobs inside Docker containers with NVIDIA runtime
  - Stream logs in real time (log)
  - Report job status (job_status: running -> completed/failed)
  - Handle reconnects and fault recovery
"""

import asyncio
import logging
import signal
import sys
from typing import Any, Dict

# ── Agent modules ─────────────────────────────────
from src.core.config import AgentConfig
from src.core.gpu_detector import detect_gpus
from src.core.ws_client import AgentWebSocket
from src.core.executor import JobExecutor
from src.core.log_streamer import LogStreamer

# ── Logging ───────────────────────────────────────
LOG_FORMAT = "%(asctime)s │ %(levelname)-7s │ %(name)s │ %(message)s"
logging.basicConfig(level=logging.INFO, format=LOG_FORMAT)
logger = logging.getLogger("unigpu.agent")


class UniGPUAgent:
    """
    Main orchestrator for the GPU agent.
    Ties together GPU detection, WebSocket communication, job execution,
    and log streaming.
    """

    def __init__(self, config: AgentConfig):
        self.config = config
        self.gpu_specs = []
        self.ws: AgentWebSocket | None = None
        self.executor: JobExecutor | None = None
        self.log_streamer: LogStreamer | None = None
        self._current_job_id: str | None = None
        self._shutdown_event = asyncio.Event()

    # ──────────────────────────────────────────────
    # Bootstrap
    # ──────────────────────────────────────────────

    async def start(self) -> None:
        """Boot the agent and enter the main event loop."""
        self._print_banner()

        # 0. Validate configuration
        self.config.validate()
        logger.info("Configuration:\n%s", self.config)

        # 1. Ensure work directory
        work_dir = self.config.ensure_work_dir()
        logger.info("Work directory: %s", work_dir.resolve())

        # 2. Detect GPUs
        self.gpu_specs = detect_gpus()
        logger.info("GPU(s) detected: %s", [g["name"] for g in self.gpu_specs])

        # 3. Initialise components
        self.executor = JobExecutor(
            work_dir=self.config.work_dir,
            docker_base_image=self.config.docker_base_image,
            backend_http_url=self.config.backend_http_url,
            cpu_limit=self.config.cpu_limit,
            memory_limit=self.config.memory_limit,
            max_timeout=self.config.max_job_timeout,
        )

        self.ws = AgentWebSocket(
            ws_url=self.config.ws_connect_url,
            heartbeat_interval=self.config.heartbeat_interval,
        )

        self.log_streamer = LogStreamer(
            ws_client=self.ws,
            batch_interval=self.config.log_batch_interval,
        )

        # 4. Register message handlers (backend sends "assign_job" / "cancel_job")
        self.ws.on("assign_job", self._handle_assign_job)
        self.ws.on("cancel_job", self._handle_cancel_job)

        # 5. Setup signal handlers for graceful shutdown
        self._setup_signals()

        # 6. Run WebSocket (blocks until shutdown)
        logger.info("Agent is starting — connecting to %s", self.config.ws_connect_url)
        try:
            await self.ws.start()
        except asyncio.CancelledError:
            pass
        finally:
            logger.info("Agent shut down cleanly.")

    async def stop(self) -> None:
        """Graceful shutdown."""
        logger.info("Shutting down agent…")
        self._shutdown_event.set()
        if self.ws:
            await self.ws.stop()

    # ──────────────────────────────────────────────
    # Message Handlers
    # ──────────────────────────────────────────────

    async def _handle_cancel_job(self, msg: Dict[str, Any]) -> None:
        """Handle a cancel_job message from the backend — kill the running container."""
        job_id = msg.get("job_id", "unknown")
        logger.info("Cancel requested for job %s", job_id)

        if self._current_job_id == job_id:
            # Kill the Docker container
            container = self.executor.get_container_for_job(job_id)
            if container:
                try:
                    container.kill()
                    logger.info("Killed container for job %s", job_id)
                except Exception as e:
                    logger.warning("Could not kill container for job %s: %s", job_id, e)
            self._current_job_id = None
        else:
            logger.warning("Cancel for job %s but current job is %s", job_id, self._current_job_id)

    async def _handle_assign_job(self, msg: Dict[str, Any]) -> None:
        """
        Handle an incoming job assignment from the backend.

        Expected payload:
          {"type": "assign_job", "job_id": "...", "script_path": "...", "requirements_path": "..."}
        """
        job_id = msg.get("job_id", "unknown")

        if self._current_job_id:
            logger.warning(
                "Received job %s but already running %s — ignoring",
                job_id, self._current_job_id,
            )
            return

        self._current_job_id = job_id
        logger.info("═══════════════════════════════════════")
        logger.info("  JOB ASSIGNED: %s", job_id)
        logger.info("═══════════════════════════════════════")

        try:
            # Tell backend the job is now running
            await self.ws.send_job_status(job_id, "running")

            # Start execution with concurrent log streaming
            result = await self._execute_with_streaming(msg)

            # Report final status to backend
            final_status = result.status  # "completed" or "failed"
            if final_status not in ("completed", "failed"):
                final_status = "failed"  # timeout, error → backend expects "failed"

            await self.ws.send_job_status(job_id, final_status)

            logger.info(
                "Job %s finished — status=%s, exit=%d, time=%.1fs",
                job_id, result.status, result.exit_code, result.runtime_seconds,
            )

        except Exception as exc:
            logger.exception("Unhandled error running job %s", job_id)
            try:
                await self.ws.send_job_status(job_id, "failed")
            except Exception:
                pass

        finally:
            self._current_job_id = None

    async def _execute_with_streaming(self, job: Dict[str, Any]):
        """Run the job and concurrently stream its logs."""
        job_id = job.get("job_id", "unknown")

        # Start execution in background
        exec_task = asyncio.create_task(self.executor.execute(job))

        # Wait for container to be created, retry a few times
        container = None
        for _ in range(5):
            await asyncio.sleep(2)
            container = self.executor.get_container_for_job(job_id)
            if container:
                break

        # Try to attach log streamer
        if container:
            stream_task = asyncio.create_task(
                self.log_streamer.stream(job_id, container)
            )
            result = await exec_task
            stream_task.cancel()
            try:
                await stream_task
            except asyncio.CancelledError:
                pass
        else:
            logger.warning("Could not attach log streamer — container not found")
            result = await exec_task

        return result

    # ──────────────────────────────────────────────
    # Utilities
    # ──────────────────────────────────────────────

    def _setup_signals(self) -> None:
        """Register OS signal handlers for graceful shutdown."""
        loop = asyncio.get_event_loop()

        def _signal_handler():
            logger.info("Received shutdown signal")
            asyncio.ensure_future(self.stop())

        if sys.platform != "win32":
            for sig in (signal.SIGINT, signal.SIGTERM):
                loop.add_signal_handler(sig, _signal_handler)
        # On Windows, KeyboardInterrupt is caught in main()

    @staticmethod
    def _print_banner() -> None:
        banner = r"""
    ╔══════════════════════════════════════════════════╗
    ║                                                  ║
    ║         ██╗   ██╗███╗   ██╗██╗ ██████╗██████╗   ║
    ║         ██║   ██║████╗  ██║██║██╔════╝██╔══██╗  ║
    ║         ██║   ██║██╔██╗ ██║██║██║  ███████╗██║  ║
    ║         ██║   ██║██║╚██╗██║██║██║   ██╔═══██║   ║
    ║         ╚██████╔╝██║ ╚████║██║╚██████╗██████╔╝  ║
    ║          ╚═════╝ ╚═╝  ╚═══╝╚═╝ ╚═════╝╚═════╝  ║
    ║                                                  ║
    ║              GPU Agent  •  v1.0.0                ║
    ║         Peer-to-Peer GPU Marketplace             ║
    ║                                                  ║
    ╚══════════════════════════════════════════════════╝
        """
        print(banner)


# ──────────────────────────────────────────────────
# CLI Entry Point
# ──────────────────────────────────────────────────

def _run_headless():
    """Original CLI mode — no GUI, just run the agent."""
    config = AgentConfig.load()
    agent = UniGPUAgent(config)

    try:
        asyncio.run(agent.start())
    except KeyboardInterrupt:
        logger.info("Interrupted — shutting down.")
        asyncio.run(agent.stop())


def _run_gui():
    """GUI mode — system tray app with optional first-run wizard."""
    config = AgentConfig.load()

    # First-run: launch setup wizard
    if AgentConfig.is_first_run() or not config.gpu_id:
        logger.info("First run detected — launching setup wizard")
        from src.gui.setup_wizard import run_setup_wizard
        config = run_setup_wizard()
        if config is None:
            logger.info("Setup cancelled — exiting")
            sys.exit(0)

    # Launch system tray
    from src.gui.tray import TrayApp
    tray = TrayApp(config, agent_factory=UniGPUAgent)
    tray.run()


def main():
    headless = "--headless" in sys.argv or "--cli" in sys.argv

    if headless:
        logger.info("Starting in headless (CLI) mode")
        _run_headless()
    else:
        logger.info("Starting in GUI mode")
        _run_gui()


if __name__ == "__main__":
    main()
