"""
UniGPU Agent — First-Run Setup Wizard
A CustomTkinter wizard that guides the student through initial agent setup:
  1. Welcome screen
  2. Backend URL configuration
  3. Login with existing UniGPU account
  4. Auto-detect GPU & register with backend
  5. Save config and start agent
"""

import json
import logging
import customtkinter as ctk
from typing import Optional

import httpx

from src.core.config import AgentConfig
from src.core.gpu_detector import detect_gpus
from src.core.credentials import save_credentials, delete_credentials

try:
    from src.build_env import IS_PROD, BACKEND_URL
except ImportError:
    IS_PROD = False
    BACKEND_URL = ""

logger = logging.getLogger("unigpu.agent.setup")


class SetupWizard:
    """
    Modal wizard window for first-time agent configuration.
    Returns the completed AgentConfig or None if cancelled.
    """

    def __init__(self):
        self.result: Optional[AgentConfig] = None
        self._token: str = ""
        self._temp_token: str = ""
        self._gpu_info: list = []

        self.root = ctk.CTk()
        self.root.title("UniGPU Agent — Setup")
        self.root.geometry("520x620")
        self.root.minsize(480, 520)
        self.root.resizable(True, True)

        # Center on screen
        self.root.update_idletasks()
        sw = self.root.winfo_screenwidth()
        sh = self.root.winfo_screenheight()
        x = (sw - 520) // 2
        y = (sh - 620) // 2
        self.root.geometry(f"520x620+{x}+{y}")

        # Try to set window icon
        try:
            from src.gui import get_icon_path
            icon = get_icon_path()
            if icon.exists():
                self.root.iconbitmap(str(icon))
        except Exception:
            pass

        # State vars
        default_url = BACKEND_URL if IS_PROD else "http://localhost:8000"
        self._backend_url = ctk.StringVar(value=default_url)
        self._username = ctk.StringVar()
        self._password = ctk.StringVar()
        self._2fa_code = ctk.StringVar()
        self._gpu_label = ctk.StringVar(value="Not detected yet")
        self._status = ctk.StringVar(value="")

        # Build pages
        self._pages: list[ctk.CTkFrame] = []
        self._current_page = 0
        self._build_welcome_page()   # 0
        self._build_login_page()     # 1
        self._build_2fa_page()       # 2
        self._build_gpu_page()       # 3
        self._build_done_page()      # 4

        self._show_page(0)

    def run(self) -> Optional[AgentConfig]:
        """Show the wizard. Returns AgentConfig or None."""
        self.root.mainloop()
        return self.result

    # ──────────────────────────────────────────────
    # Page builders
    # ──────────────────────────────────────────────

    def _make_page(self) -> ctk.CTkFrame:
        frame = ctk.CTkFrame(self.root, fg_color="transparent")
        self._pages.append(frame)
        return frame

    def _show_page(self, idx: int):
        for p in self._pages:
            p.pack_forget()
        self._pages[idx].pack(fill="both", expand=True, padx=30, pady=20)
        self._current_page = idx

    def _build_welcome_page(self):
        page = self._make_page()

        ctk.CTkLabel(page, text="🖥️", font=ctk.CTkFont(size=52)).pack(pady=(20, 5))
        ctk.CTkLabel(
            page, text="Welcome to UniGPU Agent",
            font=ctk.CTkFont(size=22, weight="bold"),
        ).pack(pady=(0, 10))

        desc = (
            "This agent connects your GPU to the UniGPU network,\n"
            "allowing other students to run training jobs on it.\n\n"
            "You'll earn credits for every job your GPU completes!\n\n"
            "Let's get set up in a few quick steps."
        )
        ctk.CTkLabel(
            page, text=desc,
            font=ctk.CTkFont(size=13),
            text_color="gray",
            justify="center",
            wraplength=440,
        ).pack(pady=10)

        # Backend URL (dev mode only)
        if not IS_PROD:
            ctk.CTkLabel(
                page, text="Backend Server URL",
                font=ctk.CTkFont(size=12, weight="bold"),
                anchor="w",
            ).pack(fill="x", pady=(20, 3))
            entry = ctk.CTkEntry(
                page, textvariable=self._backend_url,
                font=ctk.CTkFont(family="Consolas", size=12),
                height=38,
            )
            entry.pack(fill="x")
            entry.bind("<Return>", lambda e: self._on_welcome_next())
            ctk.CTkLabel(
                page, text="Ask your admin for the server URL if not localhost",
                font=ctk.CTkFont(size=11), text_color="gray", anchor="w",
            ).pack(anchor="w", pady=(4, 0))

        self._make_nav_btn(page, "Next →", self._on_welcome_next).pack(side="bottom", pady=20)

    def _build_login_page(self):
        page = self._make_page()

        ctk.CTkLabel(
            page, text="Sign In",
            font=ctk.CTkFont(size=22, weight="bold"),
        ).pack(pady=(30, 5))
        ctk.CTkLabel(
            page, text="Use your UniGPU account (register at the website first)",
            font=ctk.CTkFont(size=12), text_color="gray",
        ).pack(pady=(0, 20))

        # Email
        ctk.CTkLabel(page, text="Email", font=ctk.CTkFont(size=12, weight="bold"), anchor="w").pack(fill="x", pady=(10, 3))
        user_entry = ctk.CTkEntry(page, textvariable=self._username, font=ctk.CTkFont(size=13), height=38)
        user_entry.pack(fill="x")
        user_entry.bind("<Return>", lambda e: self._on_login())

        # Password
        ctk.CTkLabel(page, text="Password", font=ctk.CTkFont(size=12, weight="bold"), anchor="w").pack(fill="x", pady=(15, 3))
        pass_entry = ctk.CTkEntry(page, textvariable=self._password, show="●", font=ctk.CTkFont(size=13), height=38)
        pass_entry.pack(fill="x")
        pass_entry.bind("<Return>", lambda e: self._on_login())

        # Status
        self._login_status_label = ctk.CTkLabel(
            page, textvariable=self._status,
            font=ctk.CTkFont(size=12),
            text_color=("red", "#ef4444"),
        )
        self._login_status_label.pack(pady=(10, 0))

        btn_frame = ctk.CTkFrame(page, fg_color="transparent")
        btn_frame.pack(side="bottom", pady=20, fill="x")
        self._make_nav_btn(btn_frame, "← Back", self._on_login_back).pack(side="left")
        self._make_nav_btn(btn_frame, "Sign In & Continue →", self._on_login).pack(side="right")

    def _build_2fa_page(self):
        page = self._make_page()

        ctk.CTkLabel(
            page, text="Two-Factor Authentication",
            font=ctk.CTkFont(size=22, weight="bold"),
        ).pack(pady=(30, 5))
        ctk.CTkLabel(
            page, text="Enter the 6-digit code from your authenticator app",
            font=ctk.CTkFont(size=12), text_color="gray",
        ).pack(pady=(0, 20))

        ctk.CTkLabel(page, text="Authentication Code", font=ctk.CTkFont(size=12, weight="bold"), anchor="w").pack(fill="x", pady=(10, 3))
        code_entry = ctk.CTkEntry(
            page, textvariable=self._2fa_code,
            font=ctk.CTkFont(size=18), height=44,
            justify="center",
        )
        code_entry.pack(fill="x")
        code_entry.bind("<Return>", lambda e: self._on_verify_2fa())

        self._2fa_status_label = ctk.CTkLabel(
            page, textvariable=self._status,
            font=ctk.CTkFont(size=12),
            text_color=("red", "#ef4444"),
        )
        self._2fa_status_label.pack(pady=(10, 0))

        btn_frame = ctk.CTkFrame(page, fg_color="transparent")
        btn_frame.pack(side="bottom", pady=20, fill="x")
        self._make_nav_btn(btn_frame, "← Back", self._on_2fa_back).pack(side="left")
        self._make_nav_btn(btn_frame, "Verify & Continue →", self._on_verify_2fa).pack(side="right")

    def _build_gpu_page(self):
        page = self._make_page()

        ctk.CTkLabel(
            page, text="GPU Detection",
            font=ctk.CTkFont(size=22, weight="bold"),
        ).pack(pady=(30, 10))

        # GPU info card
        card = ctk.CTkFrame(page)
        card.pack(fill="x", pady=10)

        ctk.CTkLabel(
            card, text="🎮  Detected GPU",
            font=ctk.CTkFont(size=13, weight="bold"),
            anchor="w",
        ).pack(anchor="w", padx=18, pady=(14, 5))

        self._gpu_detail_label = ctk.CTkLabel(
            card, textvariable=self._gpu_label,
            font=ctk.CTkFont(family="Consolas", size=11),
            justify="left",
            anchor="w",
            wraplength=420,
        )
        self._gpu_detail_label.pack(anchor="w", padx=18, pady=(0, 14))

        self._gpu_status_label = ctk.CTkLabel(
            page, textvariable=self._status,
            font=ctk.CTkFont(size=12),
            text_color="gray",
        )
        self._gpu_status_label.pack(pady=10)

        btn_frame = ctk.CTkFrame(page, fg_color="transparent")
        btn_frame.pack(side="bottom", pady=20, fill="x")
        self._make_nav_btn(btn_frame, "← Back", self._on_login_back).pack(side="left")
        self._make_nav_btn(btn_frame, "Register GPU & Finish →", self._on_register_gpu).pack(side="right")

    def _build_done_page(self):
        page = self._make_page()

        ctk.CTkLabel(page, text="✅", font=ctk.CTkFont(size=52)).pack(pady=(40, 5))
        ctk.CTkLabel(
            page, text="You're All Set!",
            font=ctk.CTkFont(size=24, weight="bold"),
        ).pack(pady=(0, 10))

        ctk.CTkLabel(
            page,
            text=(
                "Your GPU has been registered with UniGPU.\n\n"
                "The agent will now start and appear in your\n"
                "system tray. You can right-click the tray icon\n"
                "to access settings, view logs, or stop the agent."
            ),
            font=ctk.CTkFont(size=13),
            text_color="gray",
            justify="center",
            wraplength=420,
        ).pack(pady=15)

        self._make_nav_btn(page, "Start Agent 🚀", self._on_finish).pack(pady=30)

    # ──────────────────────────────────────────────
    # Actions
    # ──────────────────────────────────────────────

    def _on_welcome_next(self):
        url = self._backend_url.get().strip()
        if not url:
            self._show_mini_dialog("Missing URL", "Please enter the backend server URL.")
            return
        self._status.set("")
        self._show_page(1)

    def _on_login_back(self):
        """Reset auth state and go back to the login page."""
        self._token = ""
        self._temp_token = ""
        self._2fa_code.set("")
        self._status.set("")
        self._show_page(1)

    def _on_2fa_back(self):
        """Go back to login, clearing the temporary token."""
        self._temp_token = ""
        self._2fa_code.set("")
        self._status.set("")
        self._show_page(1)

    def _on_login(self):
        username = self._username.get().strip()
        password = self._password.get().strip()
        if not username or not password:
            self._status.set("Please enter email and password")
            return

        self._status.set("Signing in…")
        self.root.update()

        base_url = self._backend_url.get().strip().rstrip("/")
        try:
            resp = httpx.post(
                f"{base_url}/auth/login",
                json={"email": username, "password": password},
                timeout=15,
                verify=False,
            )

            if resp.status_code == 200:
                data = resp.json()

                if data.get("requires_2fa"):
                    self._temp_token = data.get("temp_token")
                    self._status.set("")
                    self._show_page(2)
                    return

                self._token = data.get("access_token", data.get("token", ""))
                self._status.set("")
                self._on_login_success(username, password)
            else:
                detail = ""
                try:
                    detail = resp.json().get("detail", resp.text[:100])
                except Exception:
                    detail = resp.text[:100]
                self._status.set(f"Login failed: {detail}")

        except httpx.ConnectError:
            self._status.set(f"Cannot connect to {base_url}")
        except Exception as e:
            self._status.set(f"Error: {e}")

    def _on_verify_2fa(self):
        code = self._2fa_code.get().strip()
        if not code:
            self._status.set("Please enter the 6-digit code")
            return
        if not code.isdigit() or len(code) != 6:
            self._status.set("Code must be exactly 6 digits")
            return
        if not self._temp_token:
            self._status.set("Session expired — please sign in again")
            self._show_page(1)
            return

        self._status.set("Verifying code…")
        self.root.update()

        base_url = self._backend_url.get().strip().rstrip("/")
        try:
            resp = httpx.post(
                f"{base_url}/auth/verify-2fa-login",
                json={"temp_token": self._temp_token, "code": code},
                timeout=15,
                verify=False,
            )

            if resp.status_code == 200:
                data = resp.json()
                self._token = data.get("access_token", data.get("token", ""))
                self._status.set("")
                self._on_login_success(self._username.get().strip(), self._password.get().strip())
            else:
                detail = ""
                try:
                    detail = resp.json().get("detail", resp.text[:100])
                except Exception:
                    detail = resp.text[:100]
                self._status.set(f"Verification failed: {detail}")

        except httpx.ConnectError:
            self._status.set(f"Cannot connect to {base_url}")
        except Exception as e:
            logger.error("2FA verify error: %s", e)
            self._status.set(f"Error: {e}")

    def _on_login_success(self, username, password):
        if save_credentials(username, password):
            logger.info("✅ Credentials saved to OS credential store")
            self._status.set("✅ Signed in and credentials saved")
        else:
            logger.warning("⚠️  Signed in but credentials not saved (keyring unavailable)")
            self._status.set("⚠️ Signed in (credentials not saved)")

        self.root.update()
        self._detect_gpu()
        self._show_page(3)

    def _detect_gpu(self):
        try:
            self._gpu_info = detect_gpus()
            if self._gpu_info:
                gpu = self._gpu_info[0]
                self._gpu_label.set(
                    f"Name:   {gpu.get('name', 'Unknown')}\n"
                    f"VRAM:   {gpu.get('vram_mb', 0)} MB\n"
                    f"CUDA:   {gpu.get('cuda_version', 'N/A')}\n"
                    f"Driver: {gpu.get('driver_version', 'N/A')}"
                )
            else:
                self._gpu_label.set("No GPU detected (will use mock GPU for testing)")
        except Exception as e:
            self._gpu_label.set(f"Detection failed: {e}")

    def _on_register_gpu(self):
        self._status.set("Registering GPU with backend…")
        self.root.update()

        base_url = self._backend_url.get().strip().rstrip("/")

        if not self._gpu_info:
            self._status.set("No GPU detected — cannot register")
            return

        if not self._token or not self._token.strip():
            self._status.set("Not authenticated — please sign in again")
            self._show_page(1)
            return

        gpu = self._gpu_info[0]
        try:
            resp = httpx.post(
                f"{base_url}/gpus/register",
                json={
                    "name": gpu.get("name", "Unknown GPU"),
                    "vram_mb": gpu.get("vram_mb", 0),
                    "cuda_version": gpu.get("cuda_version", ""),
                },
                headers={"Authorization": f"Bearer {self._token}"},
                timeout=15,
                verify=False,
            )

            if resp.status_code in (200, 201):
                data = resp.json()
                gpu_id = data.get("id", data.get("gpu_id", ""))

                config = AgentConfig(
                    gpu_id=str(gpu_id),
                    backend_ws_url=self._backend_url.get().strip().rstrip("/").replace("http", "ws", 1) + "/ws/agent",
                    backend_http_url=base_url,
                    agent_token=self._token,
                )
                config.save()
                self.result = config

                self._status.set("")
                self._show_page(4)
            else:
                detail = ""
                try:
                    detail = resp.json().get("detail", resp.text[:150])
                except Exception:
                    detail = resp.text[:150]
                self._status.set(f"Registration failed: {detail}")

        except httpx.ConnectError:
            self._status.set(f"Cannot connect to {base_url}")
        except Exception as e:
            logger.error("GPU registration error: %s", e)
            self._status.set(f"Error: {e}")

    def _on_finish(self):
        self.root.destroy()

    # ──────────────────────────────────────────────
    # Helpers
    # ──────────────────────────────────────────────

    def _make_nav_btn(self, parent, text: str, command) -> ctk.CTkButton:
        return ctk.CTkButton(
            parent,
            text=text,
            command=command,
            font=ctk.CTkFont(size=13, weight="bold"),
            height=40,
            corner_radius=8,
        )

    def _show_mini_dialog(self, title: str, message: str):
        """Lightweight replacement for messagebox.showwarning."""
        dialog = ctk.CTkToplevel(self.root)
        dialog.title(title)
        dialog.geometry("320x130")
        dialog.grab_set()
        ctk.CTkLabel(dialog, text=message, wraplength=280, justify="center").pack(pady=24, padx=20)
        ctk.CTkButton(dialog, text="OK", command=dialog.destroy, width=80).pack()


def run_setup_wizard() -> Optional[AgentConfig]:
    """Launch the setup wizard. Returns config or None if cancelled."""
    wizard = SetupWizard()
    return wizard.run()


if __name__ == "__main__":
    cfg = run_setup_wizard()
    if cfg:
        print(f"Setup complete! Config saved to {cfg.config_file_path()}")
        print(cfg)
    else:
        print("Setup cancelled.")
