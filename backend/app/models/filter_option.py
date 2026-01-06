from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class FilterOption(Base):
    __tablename__ = "filter_options"
    
    id = Column(Integer, primary_key=True, index=True)
    filter_config_id = Column(Integer, ForeignKey('filter_configs.id', ondelete='CASCADE'), nullable=False)
    value = Column(String(200), nullable=False)  # 실제 값
    label = Column(String(200), nullable=False)  # 화면에 표시될 이름
    order_index = Column(Integer, default=0)  # 표시 순서