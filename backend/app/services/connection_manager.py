from fastapi import WebSocket
from typing import Dict


class ConnectionManager:
    """Manages active WebSocket connections from GPU agents."""

    def __init__(self):
        self._connections: Dict[str, WebSocket] = {}  # gpu_id → WebSocket

    async def connect(self, gpu_id: str, websocket: WebSocket):
        await websocket.accept()
        self._connections[gpu_id] = websocket

    def disconnect(self, gpu_id: str):
        self._connections.pop(gpu_id, None)

    def is_connected(self, gpu_id: str) -> bool:
        return gpu_id in self._connections

    async def send_to_gpu(self, gpu_id: str, message: dict):
        ws = self._connections.get(gpu_id)
        if ws:
            await ws.send_json(message)

    def get_active_gpu_ids(self) -> list[str]:
        return list(self._connections.keys())


# Singleton instance shared across the app
manager = ConnectionManager()
