from pydantic import BaseModel
from typing import Optional, Dict, Any

class DashboardConfigBase(BaseModel):
    widget_id: str
    widget_name: str
    is_visible: bool = True
    display_order: int = 0
    description: Optional[str] = None
    config_data: Optional[Dict[str, Any]] = {}  # 이 줄 확인

class DashboardConfigCreate(DashboardConfigBase):
    pass

class DashboardConfigUpdate(BaseModel):
    is_visible: Optional[bool] = None
    display_order: Optional[int] = None
    config_data: Optional[Dict[str, Any]] = None  # 이 줄 확인

class DashboardConfigResponse(DashboardConfigBase):
    id: int
    
    class Config:
        from_attributes = True