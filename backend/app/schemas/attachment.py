from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class AttachmentBase(BaseModel):
    entity_type: str  # 'asset' 또는 'issue'
    entity_id: int
    filename: str
    filesize: int
    content_type: str
    uploaded_by: str

class AttachmentCreate(AttachmentBase):
    filepath: str

class Attachment(AttachmentBase):
    id: int
    filepath: str
    created_at: datetime

    class Config:
        from_attributes = True