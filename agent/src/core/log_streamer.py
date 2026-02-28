"""
UniGPU Agent — Log Streamer
Attaches to a running Docker container and streams log data
to the backend via WebSocket in batches.

Backend protocol: {"type": "log", "job_id": "...", "data": "..."}
The "data" field is a single string (lines joined with newlines).
"""

import asyncio
import logging
import threading
from typing import Any, Optional

logger = logging.getLogger("unigpu.agent.log_streamer")


class LogStreamer:
    """
    Streams container logs to the backend in near-real-time batches.

    Uses a dedicated thread for the blocking Docker log generator
    and an asyncio queue to safely pass data to the async sender.
    """

    def __init__(self, ws_client: Any, batch_interval: float = 0.5):
        self.ws_client = ws_client
        self.batch_interval = batch_interval

    async def stream(self, job_id: str, container: Any) -> None:
        """Stream logs from a Docker container until it exits."""
        logger.info("Starting log stream for job %s", job_id)

        queue: asyncio.Queue = asyncio.Queue()
        loop = asyncio.get_event_loop()

        # Run blocking Docker log reader in a dedicated thread
        reader_thread = threading.Thread(
            target=self._log_reader_thread,
            args=(container, queue, loop),
            daemon=True,
        )
        reader_thread.start()

        try:
            while True:
                # Collect lines for a batch
                lines: list[str] = []

                try:
                    # Wait for first line (blocks until data or sentinel)
                    line = await asyncio.wait_for(queue.get(), timeout=30.0)
                    if line is None:  # Sentinel — stream ended
                        break
                    lines.append(line)
                except asyncio.TimeoutError:
                    # No output for 30s — container might have exited
                    continue

                # Drain any additional lines that are already queued
                while not queue.empty():
                    try:
                        line = queue.get_nowait()
                        if line is None:
                            # Sentinel found while draining
                            if lines:
                                await self._flush(job_id, lines)
                            return
                        lines.append(line)
                    except asyncio.QueueEmpty:
                        break

                # Flush the batch
                if lines:
                    await self._flush(job_id, lines)

                # Small delay to batch output
                await asyncio.sleep(self.batch_interval)

        except asyncio.CancelledError:
            logger.debug("Log stream cancelled for job %s", job_id)
        except Exception as exc:
            logger.error("Log streaming error for job %s: %s", job_id, exc)
        finally:
            logger.info("Log stream ended for job %s", job_id)

    def _log_reader_thread(self, container, queue: asyncio.Queue, loop) -> None:
        """Blocking thread that reads Docker logs and puts lines into the async queue."""
        try:
            log_gen = container.logs(stream=True, follow=True, timestamps=False)
            for chunk in log_gen:
                line = chunk.decode("utf-8", errors="replace").rstrip("\n")
                if line:
                    loop.call_soon_threadsafe(queue.put_nowait, line)
        except Exception as exc:
            logger.debug("Log reader thread ended: %s", exc)
        finally:
            # Send sentinel to signal end of stream
            loop.call_soon_threadsafe(queue.put_nowait, None)

    async def _flush(self, job_id: str, lines: list[str]) -> None:
        """Send buffered lines to backend as a single string."""
        if not lines:
            return
        try:
            data = "\n".join(lines)
            await self.ws_client.send_log(job_id, data)
            logger.debug("Flushed %d log lines for job %s", len(lines), job_id)
        except Exception as exc:
            logger.warning("Failed to send logs for job %s: %s", job_id, exc)
