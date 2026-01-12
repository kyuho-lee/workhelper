from sqlalchemy import Column, Integer, String, Text, DateTime, Date, Numeric, Enum as SQLEnum
import enum
from sqlalchemy.sql import func
from app.database import Base
from sqlalchemy.orm import relationship  # 🔥 이 줄 추가!

# 자산 상태 Enum
class AssetStatus(str, enum.Enum):
    ACTIVE = "active"              # 정상
    UNDER_REPAIR = "under_repair"  # 수리중
    MAINTENANCE = "maintenance"    # 정비중
    DISPOSED = "disposed"          # 폐기

class Asset(Base):
    __tablename__ = "assets"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_number = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
    manufacturer = Column(String(100))
    model = Column(String(100))
    status = Column(String(20), nullable=False)
    location = Column(String(100))
    assigned_to = Column(String(100))
    purchase_date = Column(DateTime)
    
    # 새로 추가된 필드들
    serial_number = Column(String(100))
    purchase_price = Column(Numeric(10, 2))
    warranty_end_date = Column(Date)
    last_inspection_date = Column(Date)
    next_inspection_date = Column(Date)
    
    
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    issues = relationship("Issue", back_populates="asset")