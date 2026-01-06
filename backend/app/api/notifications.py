from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import Notification as NotificationSchema
from app.core.security import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationSchema])
def get_notifications(
    skip: int = 0,
    limit: int = 50,
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """현재 사용자의 알림 목록 조회"""
    query = db.query(Notification).filter(Notification.username == current_user.username)
    
    if unread_only:
        query = query.filter(Notification.is_read == False)
    
    notifications = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
    return notifications

@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """읽지 않은 알림 개수 조회"""
    count = db.query(Notification).filter(
        Notification.username == current_user.username,
        Notification.is_read == False
    ).count()
    
    return {"count": count}

@router.put("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """알림을 읽음으로 표시"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.username == current_user.username
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="알림을 찾을 수 없습니다.")
    
    notification.is_read = True
    notification.read_at = datetime.now()
    db.commit()
    
    return {"message": "알림이 읽음으로 표시되었습니다."}

@router.put("/read-all")
def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """모든 알림을 읽음으로 표시"""
    db.query(Notification).filter(
        Notification.username == current_user.username,
        Notification.is_read == False
    ).update({
        "is_read": True,
        "read_at": datetime.now()
    })
    db.commit()
    
    return {"message": "모든 알림이 읽음으로 표시되었습니다."}

@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """알림 삭제"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.username == current_user.username
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="알림을 찾을 수 없습니다.")
    
    db.delete(notification)
    db.commit()
    
    return {"message": "알림이 삭제되었습니다."}

# 헬퍼 함수: 알림 생성
def create_notification(
    db: Session,
    username: str,
    title: str,
    message: str,
    notification_type: str,
    related_id: int = None
):
    """알림 생성 헬퍼 함수 (다른 API에서 호출용)"""
    from app.models.user import User
    
    # 사용자 ID 조회
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return None
    
    notification = Notification(
        user_id=user.id,
        username=username,
        title=title,
        message=message,
        type=notification_type,
        related_id=related_id
    )
    
    db.add(notification)
    db.commit()
    db.refresh(notification)
    
    return notification