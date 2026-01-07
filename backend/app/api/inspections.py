from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import get_db
from app.models.inspection import InspectionCampaign, InventoryInspection
from app.models.asset import Asset
from app.schemas.inspection import (
    InspectionCampaign as InspectionCampaignSchema,
    InspectionCampaignCreate,
    InventoryInspection as InventoryInspectionSchema,
    InventoryInspectionCreate,
    QRScanRequest,
    InspectionStats
)
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()

# QR 스캔 - 자산 조회
@router.get("/scan/{asset_number}")
def scan_asset(
    asset_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """QR 코드로 자산 조회"""
    asset = db.query(Asset).filter(Asset.asset_number == asset_number).first()
    
    if not asset:
        raise HTTPException(status_code=404, detail="자산을 찾을 수 없습니다")
    
    # 이미 실사했는지 확인 (오늘)
    today = datetime.now().date()
    existing = db.query(InventoryInspection).filter(
        InventoryInspection.asset_id == asset.id,
        InventoryInspection.inspection_date >= datetime.combine(today, datetime.min.time())
    ).first()
    
    return {
        "asset": asset,
        "already_inspected": existing is not None,
        "inspection": existing
    }

# QR 스캔 - 실사 기록
@router.post("/scan")
def record_inspection(
    scan_data: QRScanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """QR 스캔으로 실사 기록"""
    # 자산 찾기
    asset = db.query(Asset).filter(Asset.asset_number == scan_data.asset_number).first()
    if not asset:
        raise HTTPException(status_code=404, detail="자산을 찾을 수 없습니다")
    
    # 중복 체크 (오늘)
    today = datetime.now().date()
    existing = db.query(InventoryInspection).filter(
        InventoryInspection.asset_id == asset.id,
        InventoryInspection.inspection_date >= datetime.combine(today, datetime.min.time())
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="이미 실사 완료된 자산입니다")
    
    # 실사 기록 생성
    inspection = InventoryInspection(
        campaign_id=scan_data.campaign_id,
        asset_id=asset.id,
        inspection_date=datetime.now(),
        inspector_id=current_user.id,
        inspector_name=current_user.full_name or current_user.username,
        status=scan_data.status,
        actual_location=scan_data.actual_location or asset.location,
        actual_status=scan_data.actual_location,
        condition_notes=scan_data.condition_notes
    )
    
    db.add(inspection)
    
    # 자산의 마지막 점검일 업데이트
    asset.last_inspection_date = datetime.now().date()
    
    db.commit()
    db.refresh(inspection)
    
    return {
        "message": "실사 완료",
        "inspection": inspection
    }

# 실사 통계
@router.get("/stats", response_model=InspectionStats)
def get_inspection_stats(
    campaign_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """실사 통계 조회"""
    # 전체 자산 수
    total_assets = db.query(Asset).count()
    
    # 실사 완료 수 (오늘 또는 캠페인)
    today = datetime.now().date()
    query = db.query(InventoryInspection)
    
    if campaign_id:
        query = query.filter(InventoryInspection.campaign_id == campaign_id)
    else:
        query = query.filter(
            InventoryInspection.inspection_date >= datetime.combine(today, datetime.min.time())
        )
    
    inspected_count = query.count()
    pending_count = total_assets - inspected_count
    
    # 상태별 집계
    normal_count = query.filter(InventoryInspection.status == '정상').count()
    location_mismatch_count = query.filter(InventoryInspection.status == '위치불일치').count()
    status_abnormal_count = query.filter(InventoryInspection.status == '상태이상').count()
    missing_count = query.filter(InventoryInspection.status == '분실').count()
    
    inspection_rate = (inspected_count / total_assets * 100) if total_assets > 0 else 0
    
    return InspectionStats(
        total_assets=total_assets,
        inspected_count=inspected_count,
        pending_count=pending_count,
        normal_count=normal_count,
        location_mismatch_count=location_mismatch_count,
        status_abnormal_count=status_abnormal_count,
        missing_count=missing_count,
        inspection_rate=round(inspection_rate, 1)
    )

# 실사 기록 목록
@router.get("/", response_model=List[InventoryInspectionSchema])
def get_inspections(
    campaign_id: int = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """실사 기록 목록"""
    query = db.query(InventoryInspection)
    
    if campaign_id:
        query = query.filter(InventoryInspection.campaign_id == campaign_id)
    
    return query.order_by(InventoryInspection.inspection_date.desc()).offset(skip).limit(limit).all()

# 캠페인 생성
@router.post("/campaigns", response_model=InspectionCampaignSchema)
def create_campaign(
    campaign: InspectionCampaignCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """실사 캠페인 생성"""
    db_campaign = InspectionCampaign(
        **campaign.dict(),
        created_by=current_user.id
    )
    db.add(db_campaign)
    db.commit()
    db.refresh(db_campaign)
    return db_campaign

# 캠페인 목록
@router.get("/campaigns", response_model=List[InspectionCampaignSchema])
def get_campaigns(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """캠페인 목록"""
    return db.query(InspectionCampaign).order_by(InspectionCampaign.created_at.desc()).offset(skip).limit(limit).all()