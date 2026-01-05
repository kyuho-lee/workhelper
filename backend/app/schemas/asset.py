from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class AssetBase(BaseModel):
    asset_number: str
    name: str
    category: str
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    status: str = "정상"
    location: Optional[str] = None
    assigned_to: Optional[str] = None
    purchase_date: Optional[datetime] = None
    notes: Optional[str] = None

class AssetCreate(AssetBase):
    pass

class AssetUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    status: Optional[str] = None
    location: Optional[str] = None
    assigned_to: Optional[str] = None
    purchase_date: Optional[datetime] = None
    notes: Optional[str] = None

class Asset(AssetBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True