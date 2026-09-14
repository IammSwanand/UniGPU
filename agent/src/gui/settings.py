"""
UniGPU Agent — Settings Window
A CustomTkinter window opened from the system tray to edit agent configuration.
"""

import customtkinter as ctk
from tkinter import filedialog
from typing import Optional, Callable

from src.core.config import AgentConfig

try:
    from src.build_env import IS_PROD
except ImportError:
    IS_PROD = False


class SettingsWindow:
    """
    Settings editor window. Reads the current config, lets the user
    edit values, and saves to config.json on Apply.
    """

    def __init__(self, config: AgentConfig, on_save: Optional[Callable] = None):
        self.config = config
        self.on_save = on_save

        self.win = ctk.CTkToplevel()
        self.win.title("UniGPU Agent — Settings")
        self.win.geometry("520x580")
        self.win.resizable(True, True)
        self.win.minsize(420, 500)
        self.win.grab_set()

        # Try to set icon
        try:
            from src.gui import get_icon_path
            icon = get_icon_path()
            if icon.exists():
                self.win.iconbitmap(str(icon))
        except Exception:
            pass

        # Variables (plain Python strings — no tk.StringVar needed)
        self._vars = {
            "gpu_id":             ctk.StringVar(value=config.gpu_id),
            "backend_http_url":   ctk.StringVar(value=config.backend_http_url),
            "backend_ws_url":     ctk.StringVar(value=config.backend_ws_url),
            "work_dir":           ctk.StringVar(value=config.work_dir),
            "docker_base_image":  ctk.StringVar(value=config.docker_base_image),
            "heartbeat_interval": ctk.StringVar(value=str(config.heartbeat_interval)),
            "max_job_timeout":    ctk.StringVar(value=str(config.max_job_timeout)),
            "cpu_limit":          ctk.StringVar(value=str(config.cpu_limit)),
            "memory_limit":       ctk.StringVar(value=config.memory_limit),
        }

        self._build_ui()

    def _build_ui(self):
        # ── Title ────────────────────────────────────
        ctk.CTkLabel(
            self.win,
            text="⚙️  Agent Settings",
            font=ctk.CTkFont(size=20, weight="bold"),
        ).pack(pady=(18, 10))

        # ── Scrollable content area ──────────────────
        scroll_frame = ctk.CTkScrollableFrame(self.win, label_text="")
        scroll_frame.pack(fill="both", expand=True, padx=24, pady=(0, 8))

        # ── Fields ───────────────────────────────────
        fields = [
            ("GPU ID", "gpu_id", True),
        ]

        if not IS_PROD:
            fields.extend([
                ("Backend HTTP URL", "backend_http_url", False),
                ("Backend WebSocket URL", "backend_ws_url", False),
            ])

        fields.extend([
            ("Work Directory", "work_dir", False),
            ("Docker Base Image", "docker_base_image", False),
            ("Heartbeat Interval (s)", "heartbeat_interval", False),
            ("Max Job Timeout (s)", "max_job_timeout", False),
            ("CPU Limit", "cpu_limit", False),
            ("Memory Limit", "memory_limit", False),
        ])

        for label_text, key, read_only in fields:
            ctk.CTkLabel(
                scroll_frame,
                text=label_text,
                font=ctk.CTkFont(size=12, weight="bold"),
                anchor="w",
            ).pack(fill="x", pady=(10, 2))

            if key == "work_dir":
                row = ctk.CTkFrame(scroll_frame, fg_color="transparent")
                row.pack(fill="x")

                entry = ctk.CTkEntry(
                    row,
                    textvariable=self._vars[key],
                    font=ctk.CTkFont(family="Consolas", size=11),
                    state="normal",
                )
                entry.pack(side="left", fill="x", expand=True, ipady=2)

                def _browse_dir():
                    d = filedialog.askdirectory(
                        initialdir=self._vars["work_dir"].get(),
                        title="Select Work Directory",
                    )
                    if d:
                        self._vars["work_dir"].set(d)

                ctk.CTkButton(
                    row,
                    text="Browse…",
                    command=_browse_dir,
                    width=90,
                    fg_color="transparent",
                    border_width=1,
                ).pack(side="right", padx=(6, 0))
            else:
                ctk.CTkEntry(
                    scroll_frame,
                    textvariable=self._vars[key],
                    font=ctk.CTkFont(family="Consolas", size=11),
                    state="readonly" if read_only else "normal",
                ).pack(fill="x", ipady=2)

        # ── Buttons (fixed at bottom) ─────────────────
        btn_frame = ctk.CTkFrame(self.win, fg_color="transparent")
        btn_frame.pack(pady=15)

        ctk.CTkButton(
            btn_frame,
            text="Save",
            command=self._on_save,
            width=120,
            font=ctk.CTkFont(size=13, weight="bold"),
        ).pack(side="left", padx=8)

        ctk.CTkButton(
            btn_frame,
            text="Cancel",
            command=self.win.destroy,
            width=120,
            fg_color="transparent",
            border_width=1,
        ).pack(side="left", padx=8)

    def _on_save(self):
        try:
            new_config = AgentConfig(
                gpu_id=self._vars["gpu_id"].get(),
                backend_http_url=self._vars["backend_http_url"].get().strip(),
                backend_ws_url=self._vars["backend_ws_url"].get().strip(),
                work_dir=self._vars["work_dir"].get().strip(),
                docker_base_image=self._vars["docker_base_image"].get().strip(),
                heartbeat_interval=int(self._vars["heartbeat_interval"].get()),
                max_job_timeout=int(self._vars["max_job_timeout"].get()),
                cpu_limit=float(self._vars["cpu_limit"].get()),
                memory_limit=self._vars["memory_limit"].get().strip(),
                agent_token=self.config.agent_token,   # preserve token
                log_batch_interval=self.config.log_batch_interval,
            )
            path = new_config.save()

            if self.on_save:
                self.on_save(new_config)

            # Show success dialog
            dialog = ctk.CTkToplevel(self.win)
            dialog.title("Saved")
            dialog.geometry("360x140")
            dialog.grab_set()
            ctk.CTkLabel(
                dialog,
                text=f"Settings saved to:\n{path}\n\nRestart the agent for changes to take effect.",
                font=ctk.CTkFont(size=12),
                wraplength=320,
                justify="center",
            ).pack(pady=20, padx=20)
            ctk.CTkButton(dialog, text="OK", command=lambda: (dialog.destroy(), self.win.destroy()), width=80).pack()

        except ValueError as e:
            # Show error dialog
            dialog = ctk.CTkToplevel(self.win)
            dialog.title("Invalid Value")
            dialog.geometry("340x130")
            dialog.grab_set()
            ctk.CTkLabel(
                dialog,
                text=str(e),
                font=ctk.CTkFont(size=12),
                text_color=("red", "#ef4444"),
                wraplength=300,
                justify="center",
            ).pack(pady=20, padx=20)
            ctk.CTkButton(dialog, text="OK", command=dialog.destroy, width=80).pack()


def open_settings(config: AgentConfig, on_save: Optional[Callable] = None):
    """Open the settings window (requires an existing CTk root or CTkToplevel context)."""
    SettingsWindow(config, on_save)
