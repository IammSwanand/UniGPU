from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any


class UserActivityBase(BaseModel):
    user_id: Optional[str] = None
    username: Optional[str] = None
    role: Optional[str] = None
    # Renamed from event_type → action, consistent with DB column name
    action: str
    description: Optional[str] = None
    metadata_payload: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    # user_agent excluded from API responses (fingerprinting / privacy risk)


class UserActivityCreate(UserActivityBase):
    pass


class UserActivityRead(UserActivityBase):
    id: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
