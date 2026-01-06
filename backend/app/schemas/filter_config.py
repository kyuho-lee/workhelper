from pydantic import BaseModel
from typing import List, Optional

class FilterOptionBase(BaseModel):
    value: str
    label: str
    order_index: int = 0

class FilterOptionCreate(FilterOptionBase):
    pass

class FilterOption(FilterOptionBase):
    id: int
    filter_config_id: int
    
    class Config:
        from_attributes = True

class FilterConfigBase(BaseModel):
    name: str
    label: str
    filter_type: str  # dropdown, text, date, number
    field_name: str
    is_active: bool = True
    order_index: int = 0
    entity_type: str = 'asset'

class FilterConfigCreate(FilterConfigBase):
    options: Optional[List[FilterOptionCreate]] = []

class FilterConfig(FilterConfigBase):
    id: int
    options: List[FilterOption] = []
    
    class Config:
        from_attributes = True

class FilterConfigUpdate(BaseModel):
    label: Optional[str] = None
    is_active: Optional[bool] = None
    order_index: Optional[int] = None