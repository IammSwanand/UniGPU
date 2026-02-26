"""
UniGPU Agent — Entry Point
Run this file to start the agent.

Usage:
    python run.py              # GUI mode (system tray)
    python run.py --headless   # CLI mode (no GUI)
"""
import sys
from pathlib import Path

# Ensure the agent directory is on the Python path
sys.path.insert(0, str(Path(__file__).parent))

from src.agent import main

if __name__ == "__main__":
    main()
