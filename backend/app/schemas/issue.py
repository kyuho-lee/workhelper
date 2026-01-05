from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class IssueBase(BaseModel):
    title: str
    description: str
    priority: str = "보통"
    reporter: str
    assignee: Optional[str] = None
    asset_number: Optional[str] = None

class IssueCreate(IssueBase):
    pass

class IssueUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee: Optional[str] = None
    asset_number: Optional[str] = None

class Issue(IssueBase):
    id: int
    status: str
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True