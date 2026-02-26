"""
UniGPU Agent — Build Script
Automates creating a standalone Windows executable using PyInstaller.

Usage:
    cd d:/UniGPU/agent
    python scripts/build.py
"""

import os
import shutil
import subprocess
import sys
from pathlib import Path

# ─── Configuration ────────────────────────────────
SCRIPTS_DIR = Path(__file__).parent
AGENT_DIR = SCRIPTS_DIR.parent          # d:/UniGPU/agent
DIST_DIR = AGENT_DIR / "dist"
BUILD_DIR = AGENT_DIR / "build"
APP_NAME = "UniGPU Agent"
ENTRY_SCRIPT = AGENT_DIR / "run.py"
ICON_FILE = AGENT_DIR / "assets" / "icon.ico"


def clean():
    """Remove old build artifacts."""
    for d in [DIST_DIR, BUILD_DIR]:
        if d.exists():
            print(f"  Cleaning {d}...")
            shutil.rmtree(d)

    spec_file = AGENT_DIR / f"{APP_NAME}.spec"
    if spec_file.exists():
        spec_file.unlink()


def build():
    """Run PyInstaller to create the executable."""
    print(f"\n{'=' * 50}")
    print(f"  Building {APP_NAME}")
    print(f"{'=' * 50}\n")

    # Check PyInstaller is available
    try:
        import PyInstaller
        print(f"  PyInstaller version: {PyInstaller.__version__}")
    except ImportError:
        print("  ERROR: PyInstaller not found. Install with: pip install pyinstaller")
        sys.exit(1)

    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--name", APP_NAME,
        "--onedir",
        "--noconsole",                   # GUI mode - no console window
        "--noconfirm",                   # Overwrite output without asking
        "--clean",                       # Clean cache before building
        # Hidden imports that PyInstaller may miss
        "--hidden-import", "websockets",
        "--hidden-import", "httpx",
        "--hidden-import", "docker",
        "--hidden-import", "pynvml",
        "--hidden-import", "pystray",
        "--hidden-import", "PIL",
        "--hidden-import", "PIL.Image",
        "--hidden-import", "PIL.ImageDraw",
        "--hidden-import", "PIL.ImageFont",
        "--hidden-import", "dotenv",
        "--hidden-import", "pystray._win32",
        "--hidden-import", "src",
        "--hidden-import", "src.agent",
        "--hidden-import", "src.core",
        "--hidden-import", "src.core.config",
        "--hidden-import", "src.core.ws_client",
        "--hidden-import", "src.core.executor",
        "--hidden-import", "src.core.gpu_detector",
        "--hidden-import", "src.core.log_streamer",
        "--hidden-import", "src.core.uploader",
        "--hidden-import", "src.gui",
        "--hidden-import", "src.gui.tray",
        "--hidden-import", "src.gui.settings",
        "--hidden-import", "src.gui.setup_wizard",
        # Collect all sub-packages
        "--collect-submodules", "websockets",
        "--collect-submodules", "httpx",
        "--collect-submodules", "docker",
        "--collect-submodules", "pystray",
        # Add data files
        "--add-data", f"{AGENT_DIR / '.env.example'};.",
    ]

    # Add icon if it exists
    if ICON_FILE.exists():
        cmd.extend(["--icon", str(ICON_FILE)])
        cmd.extend(["--add-data", f"{ICON_FILE};assets"])

    cmd.append(str(ENTRY_SCRIPT))

    print(f"  Running: {' '.join(cmd[:6])}...\n")
    result = subprocess.run(cmd, cwd=str(AGENT_DIR))

    if result.returncode != 0:
        print(f"\n  Build FAILED (exit code {result.returncode})")
        sys.exit(1)

    # Copy extra assets to dist
    dist_app = DIST_DIR / APP_NAME
    if dist_app.exists():
        # Copy .env.example
        env_example = AGENT_DIR / ".env.example"
        if env_example.exists():
            shutil.copy2(env_example, dist_app / ".env.example")

        print(f"\n  Build SUCCESS")
        print(f"  Output: {dist_app}")
        print(f"  Run:    {dist_app / (APP_NAME + '.exe')}")
    else:
        print(f"\n  Build completed - check {DIST_DIR}")


def main():
    if "--clean" in sys.argv:
        clean()
        print("  Cleaned build artifacts.")
        return

    clean()
    build()


if __name__ == "__main__":
    main()
