"""
UniGPU Agent — Log Window
A read-only tkinter window for viewing live agent logs inside the .exe.
"""

import tkinter as tk
from tkinter import scrolledtext
from typing import Optional

from src.core.log_buffer import BufferedLogHandler


BG = "#0f0f1a"
BG_CARD = "#1a1a2e"
FG = "#e0e0e0"
FG_DIM = "#888899"
ACCENT = "#7c3aed"
BORDER = "#333355"


class LogWindow:
    """A simple read-only live log viewer."""

    def __init__(self, master: tk.Misc, handler: BufferedLogHandler):
        self.handler = handler
        self.win = tk.Toplevel(master)
        self.win.title("UniGPU Agent — Logs")
        self.win.geometry("860x520")
        self.win.minsize(640, 420)
        self.win.configure(bg=BG)

        try:
            from pathlib import Path

            icon = Path(__file__).parent / "assets" / "icon.ico"
            if icon.exists():
                self.win.iconbitmap(str(icon))
        except Exception:
            pass

        self.win.protocol("WM_DELETE_WINDOW", self.close)

        header = tk.Frame(self.win, bg=BG)
        header.pack(fill="x", padx=16, pady=(14, 8))

        tk.Label(
            header,
            text="Live Agent Logs",
            font=("Segoe UI", 16, "bold"),
            bg=BG,
            fg=FG,
        ).pack(anchor="w")
        tk.Label(
            header,
            text="This window shows the same logs the agent writes internally.",
            font=("Segoe UI", 9),
            bg=BG,
            fg=FG_DIM,
        ).pack(anchor="w", pady=(2, 0))

        body = tk.Frame(self.win, bg=BG_CARD, highlightthickness=1, highlightbackground=BORDER)
        body.pack(fill="both", expand=True, padx=16, pady=(0, 12))

        self.text = scrolledtext.ScrolledText(
            body,
            wrap="word",
            font=("Consolas", 10),
            bg="#11111c",
            fg=FG,
            insertbackground=FG,
            relief="flat",
            padx=10,
            pady=10,
            state="disabled",
        )
        self.text.pack(fill="both", expand=True, padx=1, pady=1)

        footer = tk.Frame(self.win, bg=BG)
        footer.pack(fill="x", padx=16, pady=(0, 14))

        tk.Button(
            footer,
            text="Clear",
            command=self.clear,
            font=("Segoe UI", 10),
            bg=BG_CARD,
            fg=FG,
            activebackground=BORDER,
            activeforeground=FG,
            relief="flat",
            cursor="hand2",
            padx=18,
            pady=5,
        ).pack(side="left")

        tk.Button(
            footer,
            text="Close",
            command=self.close,
            font=("Segoe UI", 10, "bold"),
            bg=ACCENT,
            fg="white",
            activebackground="#9b5de5",
            activeforeground="white",
            relief="flat",
            cursor="hand2",
            padx=18,
            pady=5,
        ).pack(side="right")

        for line in self.handler.snapshot():
            self._append_line(line)

        self._poll_pending()

    def _poll_pending(self) -> None:
        if not self.win.winfo_exists():
            return

        for line in self.handler.drain_pending():
            self._append_line(line)

        self.win.after(200, self._poll_pending)

    def _append_line(self, line: str) -> None:
        self.text.configure(state="normal")
        self.text.insert("end", line + "\n")
        self.text.see("end")
        self.text.configure(state="disabled")

    def clear(self) -> None:
        self.text.configure(state="normal")
        self.text.delete("1.0", "end")
        self.text.configure(state="disabled")

    def close(self) -> None:
        if self.win.winfo_exists():
            self.win.destroy()
