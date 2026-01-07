from sqlalchemy import Column, Integer, String, DateTime, Text, Enum, Date, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class InspectionCampaign(Base):
    __tablename__ = "inspection_campaigns"
    
    id = Column(Integer, primary_key=True, index=True)
    campaign_name = Column(String(200), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    description = Column(Text)
    status = Column(Enum('planned', 'active', 'completed'), default='planned')
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    
    # Relationships
    inspections = relationship("InventoryInspection", back_populates="campaign")
    creator = relationship("User", foreign_keys=[created_by])

class InventoryInspection(Base):
    __tablename__ = "inventory_inspections"
    
    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("inspection_campaigns.id"))
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)
    inspection_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    inspector_id = Column(Integer, ForeignKey("users.id"))
    inspector_name = Column(String(100), nullable=False)
    status = Column(Enum('정상', '위치불일치', '상태이상', '분실'), nullable=False, default='정상')
    actual_location = Column(String(200))
    actual_status = Column(String(50))
    condition_notes = Column(Text)
    photo_url = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    campaign = relationship("InspectionCampaign", back_populates="inspections")
    asset = relationship("Asset")
    inspector = relationship("User", foreign_keys=[inspector_id])