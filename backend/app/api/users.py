from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse
from app.core.security import get_current_active_admin, get_current_user, get_password_hash  # get_current_user 추가

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.get("", response_model=List[UserResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """관리자 전용: 전체 사용자 목록"""
    users = db.query(User).all()
    return users

@router.get("/simple-list")
def get_simple_user_list(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # 모든 로그인 사용자 접근 가능
):
    """모든 사용자 접근 가능: 담당자 선택용 간단한 사용자 목록"""
    users = db.query(User).all()
    return [
        {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name
        }
        for user in users
    ]

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="자기 자신은 삭제할 수 없습니다.")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    
    db.delete(user)
    db.commit()
    return {"message": "사용자가 삭제되었습니다."}
    
@router.put("/{user_id}/reset-password")
def reset_user_password(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="자기 자신의 비밀번호는 초기화할 수 없습니다.")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    
    # 임시 비밀번호 설정
    temp_password = "Password123!"
    user.hashed_password = get_password_hash(temp_password)
    
    db.commit()
    
    return {
        "message": "비밀번호가 초기화되었습니다.",
        "temp_password": temp_password,
        "username": user.username
    }