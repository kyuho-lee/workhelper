from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Issue(Base):
    __tablename__ = "issues"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200))
    description = Column(Text)
    status = Column(String(20), default="open")
    priority = Column(String(20))  # 낮음, 보통, 높음, 긴급
    reporter = Column(String(100))  # 신고자
    assignee = Column(String(100), nullable=True)  # 담당자
    
    # 🔥 asset_id 추가 - 외래키!
    asset_id = Column(Integer, ForeignKey('assets.id'), nullable=True, index=True)
    asset_number = Column(String(50), nullable=True)  # 호환성 유지
    
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # 🔥 Relationship - Asset과 연결!
    asset = relationship("Asset", back_populates="issues")