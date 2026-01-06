from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.category import Category
from app.schemas.category import Category as CategorySchema, CategoryCreate, CategoryUpdate

router = APIRouter(prefix="/api/categories", tags=["Categories"])

@router.get("", response_model=List[CategorySchema])
def get_categories(db: Session = Depends(get_db)):
    """모든 카테고리 조회"""
    categories = db.query(Category).filter(Category.is_active == True).all()
    return categories

@router.get("/{category_id}", response_model=CategorySchema)
def get_category(category_id: int, db: Session = Depends(get_db)):
    """특정 카테고리 조회"""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@router.post("", response_model=CategorySchema)
def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    """새 카테고리 생성"""
    # 중복 체크
    existing = db.query(Category).filter(Category.name == category.name).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"카테고리 '{category.name}'는 이미 존재합니다.")
    
    db_category = Category(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@router.put("/{category_id}", response_model=CategorySchema)
def update_category(category_id: int, category: CategoryUpdate, db: Session = Depends(get_db)):
    """카테고리 수정"""
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # 업데이트
    for key, value in category.dict(exclude_unset=True).items():
        setattr(db_category, key, value)
    
    db.commit()
    db.refresh(db_category)
    return db_category

@router.delete("/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db)):
    """카테고리 삭제 (soft delete)"""
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Soft delete
    db_category.is_active = False
    db.commit()
    
    return {"message": "Category deleted successfully"}