from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.filter_config import FilterConfig
from app.models.filter_option import FilterOption
from app.models.user import User
from app.schemas.filter_config import (
    FilterConfig as FilterConfigSchema,
    FilterConfigCreate,
    FilterConfigUpdate,
    FilterOptionCreate
)
from app.core.security import get_current_user, get_current_active_admin

router = APIRouter(prefix="/api/filter-configs", tags=["Filter Configs"])

@router.get("", response_model=List[FilterConfigSchema])
def get_filter_configs(
    entity_type: str = 'asset',
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """필터 설정 목록 조회 (모든 사용자)"""
    query = db.query(FilterConfig).filter(FilterConfig.entity_type == entity_type)
    
    if active_only:
        query = query.filter(FilterConfig.is_active == True)
    
    configs = query.order_by(FilterConfig.order_index).all()
    
    # 각 필터의 옵션도 함께 조회
    for config in configs:
        config.options = db.query(FilterOption).filter(
            FilterOption.filter_config_id == config.id
        ).order_by(FilterOption.order_index).all()
    
    return configs

@router.post("", response_model=FilterConfigSchema)
def create_filter_config(
    filter_config: FilterConfigCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)  # 관리자만
):
    """필터 설정 생성 (관리자 전용)"""
    
    # 중복 체크
    existing = db.query(FilterConfig).filter(
        FilterConfig.name == filter_config.name,
        FilterConfig.entity_type == filter_config.entity_type
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="이미 존재하는 필터 이름입니다.")
    
    # 필터 생성
    db_filter = FilterConfig(
        name=filter_config.name,
        label=filter_config.label,
        filter_type=filter_config.filter_type,
        field_name=filter_config.field_name,
        is_active=filter_config.is_active,
        order_index=filter_config.order_index,
        entity_type=filter_config.entity_type
    )
    
    db.add(db_filter)
    db.commit()
    db.refresh(db_filter)
    
    # 옵션 추가 (드롭다운인 경우)
    if filter_config.options:
        for option_data in filter_config.options:
            option = FilterOption(
                filter_config_id=db_filter.id,
                value=option_data.value,
                label=option_data.label,
                order_index=option_data.order_index
            )
            db.add(option)
        
        db.commit()
        db.refresh(db_filter)
    
    # 옵션 다시 조회
    db_filter.options = db.query(FilterOption).filter(
        FilterOption.filter_config_id == db_filter.id
    ).all()
    
    return db_filter

@router.put("/{config_id}", response_model=FilterConfigSchema)
def update_filter_config(
    config_id: int,
    filter_update: FilterConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """필터 설정 수정 (관리자 전용)"""
    
    db_filter = db.query(FilterConfig).filter(FilterConfig.id == config_id).first()
    
    if not db_filter:
        raise HTTPException(status_code=404, detail="필터를 찾을 수 없습니다.")
    
    # 업데이트
    if filter_update.label is not None:
        db_filter.label = filter_update.label
    if filter_update.is_active is not None:
        db_filter.is_active = filter_update.is_active
    if filter_update.order_index is not None:
        db_filter.order_index = filter_update.order_index
    
    db.commit()
    db.refresh(db_filter)
    
    # 옵션 조회
    db_filter.options = db.query(FilterOption).filter(
        FilterOption.filter_config_id == db_filter.id
    ).all()
    
    return db_filter

@router.delete("/{config_id}")
def delete_filter_config(
    config_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """필터 설정 삭제 (관리자 전용)"""
    
    db_filter = db.query(FilterConfig).filter(FilterConfig.id == config_id).first()
    
    if not db_filter:
        raise HTTPException(status_code=404, detail="필터를 찾을 수 없습니다.")
    
    db.delete(db_filter)
    db.commit()
    
    return {"message": "필터가 삭제되었습니다."}

# 옵션 관리
@router.post("/{config_id}/options")
def add_filter_option(
    config_id: int,
    option: FilterOptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """필터 옵션 추가 (관리자 전용)"""
    
    db_filter = db.query(FilterConfig).filter(FilterConfig.id == config_id).first()
    
    if not db_filter:
        raise HTTPException(status_code=404, detail="필터를 찾을 수 없습니다.")
    
    db_option = FilterOption(
        filter_config_id=config_id,
        value=option.value,
        label=option.label,
        order_index=option.order_index
    )
    
    db.add(db_option)
    db.commit()
    db.refresh(db_option)
    
    return db_option

@router.delete("/options/{option_id}")
def delete_filter_option(
    option_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """필터 옵션 삭제 (관리자 전용)"""
    
    db_option = db.query(FilterOption).filter(FilterOption.id == option_id).first()
    
    if not db_option:
        raise HTTPException(status_code=404, detail="옵션을 찾을 수 없습니다.")
    
    db.delete(db_option)
    db.commit()
    
    return {"message": "옵션이 삭제되었습니다."}