from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime, timedelta

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
    # 🔥 "ASSET:" 접두사 제거
    clean_asset_number = asset_number.replace("ASSET:", "")
    
    asset = db.query(Asset).filter(Asset.asset_number == clean_asset_number).first()
    
    if not asset:
        raise HTTPException(status_code=404, detail="자산을 찾을 수 없습니다")
    
    # 🔥 오늘 실사 기록 확인 (최신순)
    today = datetime.now().date()
    existing = db.query(InventoryInspection).filter(
        InventoryInspection.asset_id == asset.id,
        InventoryInspection.inspection_date >= datetime.combine(today, datetime.min.time())
    ).order_by(InventoryInspection.inspection_date.desc()).first()
    
    # 🔥 재실사 허용 조건: 최근 실사 상태가 "정상"이 아닌 경우
    can_reinspect = False
    last_status = None
    
    if existing:
        last_status = existing.status
        if existing.status != '정상':
            can_reinspect = True
    
    return {
        "asset": asset,
        "already_inspected": existing is not None and not can_reinspect,
        "can_reinspect": can_reinspect,
        "last_status": last_status,
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
    
    # 🔥 오늘 실사 기록 확인 (최신순)
    today = datetime.now().date()
    existing = db.query(InventoryInspection).filter(
        InventoryInspection.asset_id == asset.id,
        InventoryInspection.inspection_date >= datetime.combine(today, datetime.min.time())
    ).order_by(InventoryInspection.inspection_date.desc()).first()
    
    # 🔥 재실사 허용 조건
    # 1. 첫 실사: existing이 None
    # 2. 재실사: existing이 있지만 상태가 "정상"이 아님
    if existing and existing.status == '정상':
        raise HTTPException(status_code=400, detail="이미 정상 실사 완료된 자산입니다")
    
    # 🔥 실사 기록 생성 (재실사도 새 레코드로 생성)
    inspection = InventoryInspection(
        campaign_id=scan_data.campaign_id,
        asset_id=asset.id,
        inspection_date=datetime.now(),
        inspector_id=current_user.id,
        inspector_name=current_user.full_name or current_user.username,
        status=scan_data.status,
        actual_location=scan_data.actual_location or asset.location,
        actual_status=scan_data.status,  # 🔥 수정
        condition_notes=scan_data.condition_notes
    )
    
    db.add(inspection)
    
    # 🔥 자산 정보 업데이트
    asset.last_inspection_date = datetime.now().date()
    asset.next_inspection_date = datetime.now().date() + timedelta(days=180)
    
    # 🔥 실사 상태가 "정상"이면 자산 상태도 업데이트 (선택사항)
    if scan_data.status == '정상':
        asset.status = '정상'
    
    db.commit()
    db.refresh(inspection)
    
    return {
        "message": "실사 완료",
        "inspection": inspection,
        "is_reinspection": existing is not None
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

# 실사 기록 목록 (자산 정보 포함)
@router.get("/", response_model=List[InventoryInspectionSchema])
def get_inspections(
    campaign_id: int = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """실사 기록 목록 (자산 정보 포함)"""
    query = db.query(InventoryInspection).options(
        joinedload(InventoryInspection.asset)  # 자산 정보 함께 로드
    )
    
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