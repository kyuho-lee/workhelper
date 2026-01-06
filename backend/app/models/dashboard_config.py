from sqlalchemy import Column, Integer, String, Boolean, Text, JSON
from sqlalchemy.sql import func
from app.database import Base

class DashboardConfig(Base):
    __tablename__ = "dashboard_config"
    
    id = Column(Integer, primary_key=True, index=True)
    widget_id = Column(String(50), unique=True, nullable=False)
    widget_name = Column(String(100), nullable=False)
    is_visible = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)
    description = Column(Text)
    config_data = Column(JSON, default={})  # 위젯별 커스텀 설정 저장