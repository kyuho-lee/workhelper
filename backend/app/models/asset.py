from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base

class Asset(Base):
    __tablename__ = "assets"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_number = Column(String(50), unique=True, index=True)
    name = Column(String(100))
    category = Column(String(50))  # PC, 노트북, 네트워크장비 등
    manufacturer = Column(String(100))  # 제조사
    model = Column(String(100))  # 모델명
    status = Column(String(20))  # 정상, 수리중, 폐기 등
    location = Column(String(100))  # 위치
    assigned_to = Column(String(100))  # 담당자
    purchase_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())