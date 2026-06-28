"""
UniGPU Agent — WebSocket Client
Persistent async WebSocket connection to the UniGPU backend.
Handles heartbeats, job dispatch, log streaming, and auto-reconnect.

Protocol (aligned with backend/app/routers/ws.py):
  Agent → Server:
    {"type": "heartbeat"}
    {"type": "job_status", "job_id": "...", "status": "running|completed|failed"}
    {"type": "log", "job_id": "...", "data": "..."}

  Server → Agent:
    {"type": "assign_job", "job_id": "...", "script_url": "/jobs/.../download/...", "requirements_url": "..."|null}
"""

import asyncio
import json
import logging
import time
from typing import Any, Callable, Coroutine, Dict, List, Optional

import websockets
from websockets.exceptions import (
    ConnectionClosed,
    ConnectionClosedError,
    InvalidStatusCode,
)

logger = logging.getLogger("unigpu.agent.ws_client")

# Type alias for message handler callbacks
MessageHandler = Callable[[Dict[str, Any]], Coroutine[Any, Any, None]]


class AgentWebSocket:
    """
    Manages the persistent WebSocket connection between the GPU agent and the backend.

    Features:
      - Connect at /ws/agent/{gpu_id} (backend identifies agent by URL)
      - Periodic heartbeat
      - Dispatch incoming messages to registered handlers
      - Auto-reconnect with exponential backoff
      - Send log data, status updates, and job results
    """

    def __init__(
        self,
        ws_url: str,
        heartbeat_interval: int = 10,
        backend_http_url: Optional[str] = None,
        config: Optional[Any] = None,
    ):
        """
        Args:
            ws_url: Full WebSocket URL including gpu_id, e.g. ws://host/ws/agent/{gpu_id}?token=...
            heartbeat_interval: Seconds between heartbeats.
            backend_http_url: Base URL of HTTP backend (e.g., http://localhost:8000) for token refresh on 403.
            config: Optional AgentConfig object to update with refreshed token.
        """
        self.ws_url = ws_url
        self.heartbeat_interval = heartbeat_interval
        self.backend_http_url = backend_http_url
        self.config = config

        self._ws: Optional[websockets.WebSocketClientProtocol] = None
        self._handlers: Dict[str, MessageHandler] = {}
        self._connected = asyncio.Event()
        self._should_run = True
        self._reconnect_delay = 1  # seconds, grows with backoff

    # ──────────────────────────────────────────────
    # Public API
    # ──────────────────────────────────────────────

    def on(self, message_type: str, handler: MessageHandler) -> None:
        """Register a handler for a specific incoming message type."""
        self._handlers[message_type] = handler

    async def start(self) -> None:
        """Start the connection loop (blocks until stop() is called)."""
        while self._should_run:
            try:
                await self._connect_and_listen()
            except (ConnectionClosed, ConnectionClosedError, OSError) as exc:
                logger.warning("⚠️ WebSocket disconnected: %s", exc)
            except InvalidStatusCode as exc:
                if exc.status_code == 403:
                    logger.error("⚠️ WebSocket rejected with 403 Forbidden — attempting token refresh…")
                    if await self._try_refresh_token():
                        logger.info("✅ Token refreshed — retrying connection")
                        self._reconnect_delay = 1  # reset delay for immediate retry
                        continue
                logger.error("❌ WebSocket rejected (HTTP %s) — check GPU_ID/token", exc.status_code)
            except Exception as exc:
                logger.error("❌ Unexpected WS error: %s", exc, exc_info=True)

            if self._should_run:
                logger.info("Reconnecting in %ss…", self._reconnect_delay)
                await asyncio.sleep(self._reconnect_delay)
                self._reconnect_delay = min(self._reconnect_delay * 2, 60)

    async def stop(self) -> None:
        """Gracefully shut down the WebSocket connection."""
        self._should_run = False
        if self._ws:
            await self._ws.close()
        self._connected.clear()

    async def send(self, message: Dict[str, Any]) -> None:
        """Send a JSON message to the backend. Waits until connected."""
        await self._connected.wait()
        if self._ws:
            await self._ws.send(json.dumps(message))

    async def send_log(self, job_id: str, data: str) -> None:
        """
        Send log data for a running job.
        Backend expects: {"type": "log", "job_id": "...", "data": "..."}
        """
        await self.send({
            "type": "log",
            "job_id": job_id,
            "data": data,
        })

    async def send_job_status(self, job_id: str, status: str, retries: int = 3) -> None:
        """
        Report job status change with retry logic.
        Backend expects: {"type": "job_status", "job_id": "...", "status": "running|completed|failed"}
        Retries on disconnect so status is never lost.
        """
        msg = {
            "type": "job_status",
            "job_id": job_id,
            "status": status,
        }
        for attempt in range(1, retries + 1):
            try:
                await self.send(msg)
                logger.info("Sent job_status=%s for %s (attempt %d)", status, job_id, attempt)
                return
            except Exception as exc:
                logger.warning(
                    "Failed to send job_status=%s for %s (attempt %d/%d): %s",
                    status, job_id, attempt, retries, exc,
                )
                if attempt < retries:
                    # Wait for reconnection before retrying
                    self._connected.clear()
                    await asyncio.sleep(2)
                    await self._connected.wait()
                else:
                    logger.error("Gave up sending job_status=%s for %s after %d attempts", status, job_id, retries)

    async def send_metrics(self, metrics: Dict[str, Any]) -> None:
        """
        Send system metrics (GPU temp, GPU util, CPU, RAM) to backend.
        Backend expects: {"type": "metrics", "data": {...}}
        """
        await self.send({
            "type": "metrics",
            "data": metrics,
        })

    async def send_agent_log(self, data: str) -> None:
        """
        Send agent log lines to backend for relay to provider dashboard.
        Backend expects: {"type": "agent_log", "data": "..."}
        """
        await self.send({
            "type": "agent_log",
            "data": data,
        })

    # ──────────────────────────────────────────────
    # Internal
    # ──────────────────────────────────────────────

    async def _connect_and_listen(self) -> None:
        """Establish connection, then run heartbeat + listener concurrently."""
        async with websockets.connect(
            self.ws_url,
            ping_interval=20,
            ping_timeout=10,
            close_timeout=5,
        ) as ws:
            self._ws = ws
            self._connected.set()
            self._reconnect_delay = 1  # reset on successful connect
            logger.info("✅ Connected to backend at %s", self.ws_url.split("?")[0])  # hide token from logs

            # Run heartbeat and listener concurrently
            heartbeat_task = asyncio.create_task(self._heartbeat_loop())
            listener_task = asyncio.create_task(self._listen_loop())

            try:
                done, pending = await asyncio.wait(
                    [heartbeat_task, listener_task],
                    return_when=asyncio.FIRST_EXCEPTION,
                )
                logger.info("⚠️  One task completed: done=%s, pending=%s", 
                           [t.get_name() for t in done],
                           [t.get_name() for t in pending])
                for task in done:
                    task.result()  # re-raise any exception
            finally:
                logger.info("⚠️  Closing connection (tasks: heartbeat.cancel, listener.cancel)")
                heartbeat_task.cancel()
                listener_task.cancel()
                self._connected.clear()

    async def _try_refresh_token(self) -> bool:
        """
        Attempt to refresh JWT token using stored credentials when 403 error occurs.
        Uses the credentials module to call /auth/login with saved credentials.
        Also updates and saves the config if provided.
        
        Returns:
            True if token was refreshed and ws_url updated, False otherwise.
        """
        if not self.backend_http_url:
            logger.warning("⚠️  Cannot refresh token — backend_http_url not configured")
            return False
        
        try:
            from src.core.credentials import refresh_token as cred_refresh_token
            
            new_token = cred_refresh_token(self.backend_http_url)
            if new_token:
                # Extract base URL and gpu_id from old ws_url and reconstruct with new token
                # Old format: ws://host/ws/agent/{gpu_id}?token=...
                # Extract the path part before the query string
                base_ws_url = self.ws_url.split("?")[0]
                self.ws_url = f"{base_ws_url}?token={new_token}"
                logger.info("✅ WebSocket URL updated with new token")
                
                # Update config with new token and save to file
                if self.config:
                    self.config.agent_token = new_token
                    try:
                        self.config.save()
                        logger.info("✅ Updated and saved agent token to config")
                    except Exception as exc:
                        logger.warning("⚠️  Failed to save config with new token: %s", exc)
                
                return True
            else:
                logger.warning("⚠️  Token refresh returned no token")
                return False
        except Exception as exc:
            logger.error("❌ Token refresh failed: %s", exc, exc_info=True)
            return False

    async def _heartbeat_loop(self) -> None:
        """Send periodic heartbeat messages."""
        while self._should_run:
            try:
                await self._ws.send(json.dumps({
                    "type": "heartbeat",
                }))
                logger.info("♥ heartbeat sent")  # Changed to INFO so it shows in log window
            except ConnectionClosed as exc:
                logger.error("⚠️  HEARTBEAT LOOP: Connection closed: %s", exc)
                break
            except Exception as exc:
                logger.error("⚠️  HEARTBEAT LOOP: Unexpected error: %s", exc, exc_info=True)
                break
            await asyncio.sleep(self.heartbeat_interval)

    async def _listen_loop(self) -> None:
        """Listen for incoming messages and dispatch to handlers."""
        try:
            async for raw in self._ws:
                try:
                    msg = json.loads(raw)
                except json.JSONDecodeError:
                    logger.warning("Received non-JSON message: %s", raw[:200])
                    continue

                msg_type = msg.get("type", "unknown")
                logger.info("📨 Received message type=%s", msg_type)  # Changed to INFO

                handler = self._handlers.get(msg_type)
                if handler:
                    try:
                        await handler(msg)
                    except Exception as exc:
                        logger.error("Handler for '%s' raised: %s", msg_type, exc, exc_info=True)
                else:
                    logger.warning("No handler registered for message type '%s'", msg_type)
        except ConnectionClosed as exc:
            logger.error("⚠️  LISTENER LOOP: Connection closed: %s", exc)
        except Exception as exc:
            logger.error("⚠️  LISTENER LOOP: Unexpected error: %s", exc, exc_info=True)
