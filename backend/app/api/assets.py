from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Body 
from pydantic import BaseModel  # 추가!
import pandas as pd
from io import BytesIO
from datetime import datetime
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.asset import Asset
from app.models.issue import Issue
from app.models.user import User  # 추가!
from app.schemas.asset import AssetCreate, Asset as AssetSchema
from app.core.security import get_current_user  # 추가!


router = APIRouter(prefix="/api/assets", tags=["Assets"])

# Pydantic 모델 추가!
class BulkDeleteRequest(BaseModel):
    asset_ids: List[int]

@router.get("", response_model=List[AssetSchema])
def get_assets(db: Session = Depends(get_db)):
    assets = db.query(Asset).all()
    return assets


@router.get("/by-number/{asset_number}", response_model=AssetSchema)  # AssetResponse → AssetSchema
def get_asset_by_number(
    asset_number: str,
    db: Session = Depends(get_db)
):
    """자산번호로 자산 조회"""
    asset = db.query(Asset).filter(Asset.asset_number == asset_number).first()
    if not asset:
        raise HTTPException(status_code=404, detail="자산을 찾을 수 없습니다")
    return asset

@router.get("/{asset_id}", response_model=AssetSchema)
def get_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset

@router.get("/{asset_id}/issues")
def get_asset_issues(asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    issues = db.query(Issue).filter(Issue.asset_number == asset.asset_number).all()
    return issues

@router.post("", response_model=AssetSchema)
def create_asset(asset: AssetCreate, db: Session = Depends(get_db)):
    # 자산번호 중복 체크
    existing_asset = db.query(Asset).filter(Asset.asset_number == asset.asset_number).first()
    if existing_asset:
        raise HTTPException(
            status_code=400, 
            detail=f"자산번호 '{asset.asset_number}'는 이미 존재합니다."
        )
    
    db_asset = Asset(**asset.dict())
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    return db_asset

@router.put("/{asset_id}", response_model=AssetSchema)
def update_asset(asset_id: int, asset: AssetCreate, db: Session = Depends(get_db)):
    db_asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not db_asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    for key, value in asset.dict().items():
        setattr(db_asset, key, value)
    
    db.commit()
    db.refresh(db_asset)
    return db_asset

# 일괄 삭제 API
@router.delete("/bulk-delete")
def bulk_delete_assets(
    request: BulkDeleteRequest,  # Pydantic 모델 사용!
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """여러 자산을 한 번에 삭제"""
    if current_user.role != "admin":  # role 필드 사용!
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다")
    
    deleted_count = 0
    for asset_id in request.asset_ids:  # request.asset_ids 사용!
        asset = db.query(Asset).filter(Asset.id == asset_id).first()
        if asset:
            db.delete(asset)
            deleted_count += 1
    
    db.commit()
    
    return {
        "message": f"{deleted_count}개의 자산이 삭제되었습니다",
        "deleted_count": deleted_count
    }


@router.delete("/{asset_id}")
def delete_asset(asset_id: int, db: Session = Depends(get_db)):
    db_asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not db_asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    db.delete(db_asset)
    db.commit()
    return {"message": "Asset deleted successfully"}

# 엑셀 일괄 업로드 (들여쓰기 수정!)
@router.post("/bulk-upload")
async def bulk_upload_assets(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="엑셀 파일만 업로드 가능합니다.")
    
    try:
        # 엑셀 파일 읽기
        contents = await file.read()
        df = pd.read_excel(BytesIO(contents))
        
        # 필수 컬럼 확인
        required_columns = ['자산번호', '이름', '분류', '상태']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400, 
                detail=f"필수 컬럼이 없습니다: {', '.join(missing_columns)}"
            )
        
        # 데이터 처리
        success_count = 0
        error_count = 0
        errors = []
        
        for index, row in df.iterrows():
            try:
                # 자산번호 중복 체크
                existing_asset = db.query(Asset).filter(
                    Asset.asset_number == str(row['자산번호'])
                ).first()
                
                if existing_asset:
                    errors.append(f"행 {index + 2}: 자산번호 '{row['자산번호']}'는 이미 존재합니다.")
                    error_count += 1
                    continue
                
                # 날짜 처리
                purchase_date = None
                if '구매일' in row and pd.notna(row['구매일']):
                    if isinstance(row['구매일'], datetime):
                        purchase_date = row['구매일']
                    else:
                        try:
                            purchase_date = pd.to_datetime(row['구매일'])
                        except:
                            pass
                
                # 자산 생성
                asset_data = {
                    'asset_number': str(row['자산번호']),
                    'name': str(row['이름']),
                    'category': str(row['분류']),
                    'manufacturer': str(row['제조사']) if '제조사' in row and pd.notna(row['제조사']) else None,
                    'model': str(row['모델']) if '모델' in row and pd.notna(row['모델']) else None,
                    'status': str(row['상태']),
                    'location': str(row['위치']) if '위치' in row and pd.notna(row['위치']) else None,
                    'assigned_to': str(row['담당자']) if '담당자' in row and pd.notna(row['담당자']) else None,
                    'purchase_date': purchase_date,
                    'notes': str(row['메모']) if '메모' in row and pd.notna(row['메모']) else None
                }
                
                db_asset = Asset(**asset_data)
                db.add(db_asset)
                success_count += 1
                
            except Exception as e:
                errors.append(f"행 {index + 2}: {str(e)}")
                error_count += 1
        
        # 커밋
        db.commit()
        
        return {
            "success_count": success_count,
            "error_count": error_count,
            "errors": errors
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"파일 처리 중 오류: {str(e)}")
