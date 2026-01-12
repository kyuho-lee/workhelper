from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# 🔥 Asset 기본 정보 스키마
class AssetBasic(BaseModel):
    id: int
    asset_number: str
    name: str
    
    class Config:
        from_attributes = True

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
    asset_id: Optional[int] = None  # 🔥 추가!
    asset: Optional[AssetBasic] = None  # 🔥 추가 - Asset 정보!
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True