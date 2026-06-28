"""
UniGPU Agent — Buffered Log Handler
Captures formatted log lines in memory so the GUI can display them live.
"""

import logging
import queue
from collections import deque
from threading import Lock
from typing import Deque, List


class BufferedLogHandler(logging.Handler):
    """In-memory log buffer with a queue for GUI consumers."""

    def __init__(self, max_lines: int = 2000):
        super().__init__(level=logging.INFO)
        self._buffer: Deque[str] = deque(maxlen=max_lines)
        self._queue: "queue.Queue[str]" = queue.Queue()
        self._lock = Lock()

    def emit(self, record: logging.LogRecord) -> None:
        try:
            line = self.format(record)
        except Exception:
            return

        with self._lock:
            self._buffer.append(line)

        self._queue.put(line)

    def snapshot(self) -> List[str]:
        """Return the current buffered log lines in order."""
        with self._lock:
            return list(self._buffer)

    def drain_pending(self) -> List[str]:
        """Drain any queued log lines that have not yet been shown."""
        lines: List[str] = []
        while True:
            try:
                lines.append(self._queue.get_nowait())
            except queue.Empty:
                break
        return lines
