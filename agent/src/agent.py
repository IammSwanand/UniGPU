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
from src.core.credentials import is_token_expired, refresh_token as cred_refresh_token
from src.core.gpu_detector import detect_gpus
from src.core.ws_client import AgentWebSocket
from src.core.executor import JobExecutor
from src.core.log_streamer import LogStreamer
from src.core.metrics_collector import collect_metrics
from src.core.log_buffer import BufferedLogHandler

# ── Logging ───────────────────────────────────────
LOG_FORMAT = "%(asctime)s │ %(levelname)-7s │ %(name)s │ %(message)s"
logging.basicConfig(level=logging.INFO, format=LOG_FORMAT)
logger = logging.getLogger("unigpu.agent")


class WebSocketLogHandler(logging.Handler):
    """Custom log handler that buffers records and sends to the WS client."""

    def __init__(self, ws_client: AgentWebSocket, loop: asyncio.AbstractEventLoop):
        super().__init__(level=logging.INFO)
        self._ws = ws_client
        self._loop = loop
        self._buffer: list[str] = []
        self._formatter = logging.Formatter(LOG_FORMAT)

    def emit(self, record: logging.LogRecord) -> None:
        try:
            line = self._formatter.format(record)
            # Schedule send on the event loop (thread-safe)
            self._loop.call_soon_threadsafe(
                self._loop.create_task,
                self._ws.send_agent_log(line),
            )
        except Exception:
            pass  # Never let log handler crash the app


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
        await self._validate_agent_token()
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
            agent_token=self.config.agent_token,
            cpu_limit=self.config.cpu_limit,
            memory_limit=self.config.memory_limit,
            max_timeout=self.config.max_job_timeout,
        )

        self.ws = AgentWebSocket(
            ws_url=self.config.ws_connect_url,
            heartbeat_interval=self.config.heartbeat_interval,
            backend_http_url=self.config.backend_http_url,
            config=self.config,
        )

        self.log_streamer = LogStreamer(
            ws_client=self.ws,
            batch_interval=self.config.log_batch_interval,
        )

        # 4. Register message handlers (backend sends "assign_job" / "cancel_job" / "control")
        self.ws.on("assign_job", self._handle_assign_job)
        self.ws.on("cancel_job", self._handle_cancel_job)
        self.ws.on("control", self._handle_control)

        # 5. Setup signal handlers for graceful shutdown
        self._setup_signals()

        # 6. Install WebSocket log handler so agent logs are relayed
        loop = asyncio.get_event_loop()
        self._ws_log_handler = WebSocketLogHandler(self.ws, loop)
        logging.getLogger("unigpu").addHandler(self._ws_log_handler)

        # 7. Run WebSocket + metrics loop concurrently
        logger.info("Agent is starting — connecting to %s", self.config.ws_connect_url)
        try:
            metrics_task = asyncio.create_task(self._metrics_loop())
            await self.ws.start()
        except asyncio.CancelledError:
            pass
        finally:
            # Clean up
            metrics_task.cancel()
            logging.getLogger("unigpu").removeHandler(self._ws_log_handler)
            logger.info("Agent shut down cleanly.")

    async def _validate_agent_token(self) -> None:
        """Refresh an expired or invalid token before the first connection attempt."""
        token = self.config.agent_token.strip()
        if not token:
            logger.warning("No agent token configured; WebSocket login will rely on reconnect handling")
            return

        if not is_token_expired(token):
            return

        logger.info("Agent token expired or invalid on startup; refreshing before connect")
        new_token = await asyncio.to_thread(cred_refresh_token, self.config.backend_http_url)
        if not new_token:
            logger.warning("Startup token refresh failed; continuing with existing token")
            return

        self.config.agent_token = new_token
        try:
            self.config.save()
            logger.info("✅ Refreshed and saved agent token before startup")
        except Exception as exc:
            logger.warning("⚠️  Refreshed token but failed to save config: %s", exc)

    async def stop(self) -> None:
        """Graceful shutdown."""
        logger.info("Shutting down agent…")
        self._shutdown_event.set()
        if self.ws:
            await self.ws.stop()

    # ──────────────────────────────────────────────
    # Message Handlers
    # ──────────────────────────────────────────────

    async def _handle_control(self, msg: Dict[str, Any]) -> None:
        """Handle control commands from the dashboard (stop)."""
        action = msg.get("action")
        if action == "stop":
            logger.info("⏹️  Stop command received from dashboard")
            await self.stop()
        else:
            logger.warning("Unknown control action: %s", action)

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
    # Metrics loop
    # ──────────────────────────────────────────────

    async def _metrics_loop(self) -> None:
        """Periodically collect and send system metrics."""
        while True:
            try:
                metrics = collect_metrics()
                await self.ws.send_metrics(metrics)
            except asyncio.CancelledError:
                break
            except Exception as exc:
                logger.warning("  Metrics send failed: %s", exc)
            await asyncio.sleep(3)

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
    ║         ██╗   ██╗███╗   ██╗██╗ ██████╗██████╗    ║
    ║         ██║   ██║████╗  ██║██║██╔════╝██╔══██╗   ║
    ║         ██║   ██║██╔██╗ ██║██║██║     ███████╗██║   ║
    ║         ██║   ██║██║╚██╗██║██║██║   ██╔═══ ██║    ║
    ║         ╚██████╔╝██║ ╚████║██║╚██████╗     ██████╔╝   ║
    ║          ╚═════╝ ╚═╝  ╚═══╝╚═╝ ╚═════╝╚═════╝    ║
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
    """CLI mode — runs the agent with auto-restart when dashboard triggers 'Go Online'."""
    import time
    import httpx

    config = AgentConfig.load()

    while True:
        agent = UniGPUAgent(config)
        try:
            asyncio.run(agent.start())
        except KeyboardInterrupt:
            logger.info("Interrupted — shutting down.")
            break

        # Agent stopped (e.g. from dashboard "Go Offline")
        # Poll backend until GPU status is set back to "online" via dashboard
        logger.info("Agent stopped — waiting for 'Go Online' from dashboard…")
        try:
            while True:
                time.sleep(2)
                try:
                    resp = httpx.get(
                        f"{config.backend_http_url}/gpus/",
                        headers={"Authorization": f"Bearer {config.agent_token}"},
                        timeout=5,
                    )
                    if resp.status_code == 200:
                        for gpu in resp.json():
                            if gpu.get("id") == config.gpu_id and gpu.get("status") == "online":
                                logger.info("GPU marked online — restarting agent")
                                raise StopIteration  # break out of both loops
                except StopIteration:
                    break
                except Exception as e:
                    logger.debug("Polling backend: %s", e)
        except KeyboardInterrupt:
            logger.info("Interrupted — exiting.")
            break


def _run_gui(log_handler: BufferedLogHandler | None = None):
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
    tray = TrayApp(config, agent_factory=UniGPUAgent, log_handler=log_handler)
    tray.run()


def main():
    headless = "--headless" in sys.argv or "--cli" in sys.argv

    if headless:
        logger.info("Starting in headless (CLI) mode")
        _run_headless()
    else:
        gui_log_handler = BufferedLogHandler(max_lines=4000)
        if gui_log_handler not in logging.getLogger().handlers:
            logging.getLogger().addHandler(gui_log_handler)
        logger.info("Starting in GUI mode")
        _run_gui(log_handler=gui_log_handler)


if __name__ == "__main__":
    main()
