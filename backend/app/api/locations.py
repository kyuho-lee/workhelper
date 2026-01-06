from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.location import Location
from app.schemas.location import Location as LocationSchema, LocationCreate, LocationUpdate

router = APIRouter(prefix="/api/locations", tags=["Locations"])

@router.get("", response_model=List[LocationSchema])
def get_locations(db: Session = Depends(get_db)):
    """모든 위치 조회"""
    locations = db.query(Location).filter(Location.is_active == True).all()
    return locations

@router.get("/{location_id}", response_model=LocationSchema)
def get_location(location_id: int, db: Session = Depends(get_db)):
    """특정 위치 조회"""
    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    return location

@router.post("", response_model=LocationSchema)
def create_location(location: LocationCreate, db: Session = Depends(get_db)):
    """새 위치 생성"""
    # 중복 체크
    existing = db.query(Location).filter(Location.name == location.name).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"위치 '{location.name}'는 이미 존재합니다.")
    
    db_location = Location(**location.dict())
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    return db_location

@router.put("/{location_id}", response_model=LocationSchema)
def update_location(location_id: int, location: LocationUpdate, db: Session = Depends(get_db)):
    """위치 수정"""
    db_location = db.query(Location).filter(Location.id == location_id).first()
    if not db_location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    # 업데이트
    for key, value in location.dict(exclude_unset=True).items():
        setattr(db_location, key, value)
    
    db.commit()
    db.refresh(db_location)
    return db_location

@router.delete("/{location_id}")
def delete_location(location_id: int, db: Session = Depends(get_db)):
    """위치 삭제 (soft delete)"""
    db_location = db.query(Location).filter(Location.id == location_id).first()
    if not db_location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    # Soft delete
    db_location.is_active = False
    db.commit()
    
    return {"message": "Location deleted successfully"}