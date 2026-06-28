# UniGPU Agent — Core Modules
# Import only the essentials; heavy dependencies (docker, etc.) are lazy
from .config import AgentConfig
from .gpu_detector import detect_gpus
