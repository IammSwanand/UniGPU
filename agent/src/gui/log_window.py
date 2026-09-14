"""
UniGPU Agent — Log Window
A read-only CustomTkinter window for viewing live agent logs inside the .exe.
"""

import customtkinter as ctk
from typing import Optional

from src.core.log_buffer import BufferedLogHandler


class LogWindow:
    """A simple read-only live log viewer."""

    def __init__(self, master: ctk.CTk, handler: BufferedLogHandler):
        self.handler = handler
        self.win = ctk.CTkToplevel(master)
        self.win.title("UniGPU Agent — Logs")
        self.win.geometry("860x520")
        self.win.minsize(640, 420)

        # Set icon if available
        try:
            from src.gui import get_icon_path
            icon = get_icon_path()
            if icon.exists():
                self.win.iconbitmap(str(icon))
        except Exception:
            pass

        self.win.protocol("WM_DELETE_WINDOW", self.close)

        # ── Header ────────────────────────────────────
        header = ctk.CTkFrame(self.win, fg_color="transparent")
        header.pack(fill="x", padx=16, pady=(14, 8))

        ctk.CTkLabel(
            header,
            text="Live Agent Logs",
            font=ctk.CTkFont(size=18, weight="bold"),
            anchor="w",
        ).pack(anchor="w")

        ctk.CTkLabel(
            header,
            text="This window shows the same logs the agent writes internally.",
            font=ctk.CTkFont(size=12),
            text_color="gray",
            anchor="w",
        ).pack(anchor="w", pady=(2, 0))

        # ── Log text area ─────────────────────────────
        self.text = ctk.CTkTextbox(
            self.win,
            wrap="word",
            font=ctk.CTkFont(family="Consolas", size=11),
            state="disabled",
        )
        self.text.pack(fill="both", expand=True, padx=16, pady=(0, 8))

        # ── Footer buttons ────────────────────────────
        footer = ctk.CTkFrame(self.win, fg_color="transparent")
        footer.pack(fill="x", padx=16, pady=(0, 14))

        ctk.CTkButton(
            footer,
            text="Clear",
            command=self.clear,
            width=90,
            fg_color="transparent",
            border_width=1,
        ).pack(side="left")

        ctk.CTkButton(
            footer,
            text="Close",
            command=self.close,
            width=90,
        ).pack(side="right")

        # Load existing logs then start polling
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
