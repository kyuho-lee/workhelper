from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
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
    clean_asset_number = asset_number.replace("ASSET:", "")
    
    asset = db.query(Asset).filter(Asset.asset_number == clean_asset_number).first()
    
    if not asset:
        raise HTTPException(status_code=404, detail="자산을 찾을 수 없습니다")
    
    # 🔥 오늘 실사 기록 확인
    today = datetime.now().date()
    existing = db.query(InventoryInspection).filter(
        InventoryInspection.asset_id == asset.id,
        InventoryInspection.inspection_date >= datetime.combine(today, datetime.min.time())
    ).first()
    
    # 🔥 실사 가능 여부 판단
    already_inspected = False
    
    if existing:
        # 오늘 이미 실사했음
        # 하지만 다음 실사일이 지났으면 실사 가능!
        if asset.next_inspection_date and today >= asset.next_inspection_date:
            already_inspected = False  # 다음 실사일 지남 → 실사 가능
        else:
            already_inspected = True  # 아직 다음 실사일 안 됨 → 실사 불가
    
    return {
        "asset": asset,
        "already_inspected": already_inspected,
        "inspection": existing,
        "next_inspection_date": asset.next_inspection_date  # 프론트엔드 참고용
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
    
    # 🔥 오늘 실사 기록 확인
    today = datetime.now().date()
    existing = db.query(InventoryInspection).filter(
        InventoryInspection.asset_id == asset.id,
        InventoryInspection.inspection_date >= datetime.combine(today, datetime.min.time())
    ).first()
    
    # 🔥 실사 가능 여부 판단
    can_inspect = True
    
    if existing:
        # 오늘 이미 실사했지만, 다음 실사일이 지났으면 가능
        if asset.next_inspection_date and today >= asset.next_inspection_date:
            can_inspect = True
        else:
            can_inspect = False
    
    if not can_inspect:
        raise HTTPException(status_code=400, detail="이미 실사 완료된 자산입니다")
    
    # 🔥 실사 기록 생성 (자산 상태는 건드리지 않음)
    inspection = InventoryInspection(
        campaign_id=scan_data.campaign_id,
        asset_id=asset.id,
        inspection_date=datetime.now(),
        inspector_id=current_user.id,
        inspector_name=current_user.full_name or current_user.username,
        status=scan_data.status,
        actual_location=scan_data.actual_location or asset.location,
        actual_status=scan_data.status,
        condition_notes=scan_data.condition_notes
    )
    
    db.add(inspection)
    
    # 🔥 자산의 마지막 실사일 + 다음 실사일 업데이트
    asset.last_inspection_date = datetime.now().date()
    asset.next_inspection_date = datetime.now().date() + timedelta(days=180)  # 6개월 후
    
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
    """실사 통계 조회 (다음 점검일 기준)"""
    today = datetime.now().date()
    
    # 🔥 전체 자산 가져오기
    all_assets = db.query(Asset).all()
    total_assets = len(all_assets)
    
    # 🔥 실사 완료 = 다음 점검일이 오늘 이후 (실사 주기 내)
    inspected_assets = [
        asset for asset in all_assets 
        if asset.next_inspection_date and asset.next_inspection_date > today
    ]
    inspected_count = len(inspected_assets)
    
    # 🔥 실사 필요 = 다음 점검일이 오늘 이전 또는 null (점검 필요)
    pending_assets = [
        asset for asset in all_assets
        if not asset.next_inspection_date or asset.next_inspection_date <= today
    ]
    pending_count = len(pending_assets)
    
    # 🔥 상태별 집계 (실사 완료된 자산들의 최근 실사 기록 기준)
    normal_count = 0
    location_mismatch_count = 0
    status_abnormal_count = 0
    missing_count = 0
    
    for asset in inspected_assets:
        # 각 자산의 가장 최근 실사 기록 조회
        latest_inspection = db.query(InventoryInspection).filter(
            InventoryInspection.asset_id == asset.id
        ).order_by(InventoryInspection.inspection_date.desc()).first()
        
        if latest_inspection:
            if latest_inspection.status == '정상':
                normal_count += 1
            elif latest_inspection.status == '위치불일치':
                location_mismatch_count += 1
            elif latest_inspection.status == '상태이상':
                status_abnormal_count += 1
            elif latest_inspection.status == '분실':
                missing_count += 1
    
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