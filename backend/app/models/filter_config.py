from sqlalchemy import Column, Integer, String, Boolean
from app.database import Base

class FilterConfig(Base):
    __tablename__ = "filter_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)  # 내부 이름 (예: manufacturer)
    label = Column(String(100), nullable=False)  # 화면에 표시될 이름 (예: 제조사)
    filter_type = Column(String(50), nullable=False)  # dropdown, text, date, number
    field_name = Column(String(100), nullable=False)  # DB 컬럼명 (예: manufacturer)
    is_active = Column(Boolean, default=True)  # 활성화 여부
    order_index = Column(Integer, default=0)  # 표시 순서
    entity_type = Column(String(50), default='asset')  # asset 또는 issue