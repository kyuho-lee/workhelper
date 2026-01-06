from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from app.database import Base
import enum

class EntityType(str, enum.Enum):
    asset = "asset"
    issue = "issue"

class Attachment(Base):
    __tablename__ = "attachments"
    
    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(Enum(EntityType), nullable=False)  # 'asset' 또는 'issue'
    entity_id = Column(Integer, nullable=False)  # 자산 ID 또는 장애 ID
    
    filename = Column(String(255), nullable=False)  # 원본 파일명
    filepath = Column(String(500), nullable=False)  # 저장된 파일 경로
    filesize = Column(Integer, nullable=False)  # 파일 크기 (bytes)
    content_type = Column(String(100), nullable=False)  # MIME type (image/jpeg, application/pdf 등)
    
    uploaded_by = Column(String(100), nullable=False)  # 업로드한 사용자
    created_at = Column(DateTime, server_default=func.now())