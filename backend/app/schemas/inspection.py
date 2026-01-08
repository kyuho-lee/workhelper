from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from decimal import Decimal

# 자산 정보 (실사 목록용 간단 버전)
class AssetSimple(BaseModel):
    id: int
    asset_number: str
    name: str
    category: str
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    status: str
    location: Optional[str] = None
    serial_number: Optional[str] = None
    purchase_price: Optional[Decimal] = None
    purchase_date: Optional[datetime] = None
    warranty_end_date: Optional[date] = None
    last_inspection_date: Optional[date] = None
    next_inspection_date: Optional[date] = None
    
    class Config:
        from_attributes = True

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
    
    # 자산 정보 추가
    asset: Optional[AssetSimple] = None
    
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