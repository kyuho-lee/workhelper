from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date

# Inspection Campaign Schemas
class InspectionCampaignBase(BaseModel):
    campaign_name: str
    start_date: date
    end_date: date
    description: Optional[str] = None
    status: Optional[str] = 'planned'

class InspectionCampaignCreate(InspectionCampaignBase):
    pass

class InspectionCampaign(InspectionCampaignBase):
    id: int
    created_by: Optional[int]
    created_at: datetime
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# Inventory Inspection Schemas
class InventoryInspectionBase(BaseModel):
    asset_id: int
    status: str
    actual_location: Optional[str] = None
    actual_status: Optional[str] = None
    condition_notes: Optional[str] = None

class InventoryInspectionCreate(InventoryInspectionBase):
    campaign_id: Optional[int] = None

class InventoryInspection(InventoryInspectionBase):
    id: int
    campaign_id: Optional[int]
    inspection_date: datetime
    inspector_id: Optional[int]
    inspector_name: str
    photo_url: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

# QR Scan Schema
class QRScanRequest(BaseModel):
    asset_number: str
    status: str
    actual_location: Optional[str] = None
    condition_notes: Optional[str] = None
    campaign_id: Optional[int] = None

# Statistics Schema
class InspectionStats(BaseModel):
    total_assets: int
    inspected_count: int
    pending_count: int
    normal_count: int
    location_mismatch_count: int
    status_abnormal_count: int
    missing_count: int
    inspection_rate: float