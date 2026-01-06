from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    pass

class CommentUpdate(BaseModel):
    content: str

class CommentResponse(CommentBase):
    id: int
    author: str
    author_id: int
    target_type: str
    target_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True