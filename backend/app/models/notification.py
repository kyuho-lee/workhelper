from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.sql import func
from app.database import Base

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)  # 알림 받을 사용자 ID
    username = Column(String(100), nullable=False, index=True)  # 알림 받을 사용자명
    title = Column(String(200), nullable=False)  # 알림 제목
    message = Column(Text, nullable=False)  # 알림 내용
    type = Column(String(50), nullable=False)  # issue, comment, asset 등
    related_id = Column(Integer)  # 관련 항목 ID (장애 ID, 댓글 ID 등)
    is_read = Column(Boolean, default=False)  # 읽음 여부
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    read_at = Column(DateTime(timezone=True), nullable=True)  # 읽은 시간