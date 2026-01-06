from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class LocationBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True

class LocationCreate(LocationBase):
    pass

class LocationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class Location(LocationBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True