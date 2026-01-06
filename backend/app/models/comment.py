from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class Comment(Base):
    __tablename__ = "comments"
    
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    author = Column(String(100), nullable=False)  # 작성자 이름
    author_id = Column(Integer, nullable=False)  # 작성자 ID
    
    # 댓글이 달린 대상 (자산 또는 장애)
    target_type = Column(String(20), nullable=False)  # 'asset' or 'issue'
    target_id = Column(Integer, nullable=False)  # 자산 ID 또는 장애 ID
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())