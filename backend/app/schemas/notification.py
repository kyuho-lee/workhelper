from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class NotificationBase(BaseModel):
    user_id: int
    username: str
    title: str
    message: str
    type: str
    related_id: Optional[int] = None

class NotificationCreate(NotificationBase):
    pass

class Notification(NotificationBase):
    id: int
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True