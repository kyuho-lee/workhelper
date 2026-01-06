from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models import issue as models
from app.models.user import User
from app.schemas import issue as schemas
from app.core.security import get_current_user
from app.api.notifications import create_notification  # 알림 함수 import

router = APIRouter(prefix="/api/issues", tags=["Issues"])

# Pydantic 모델
class BulkDeleteRequest(BaseModel):
    issue_ids: List[int]

@router.post("/", response_model=schemas.Issue)
def create_issue(issue: schemas.IssueCreate, db: Session = Depends(get_db)):
    db_issue = models.Issue(**issue.dict())
    db.add(db_issue)
    db.commit()
    db.refresh(db_issue)
    
    # 담당자에게 알림 전송
    if db_issue.assignee and db_issue.assignee != db_issue.reporter:
        create_notification(
            db=db,
            username=db_issue.assignee,
            title="새로운 장애가 할당되었습니다",
            message=f"'{db_issue.title}' 장애가 할당되었습니다. (신고자: {db_issue.reporter})",
            notification_type="issue",
            related_id=db_issue.id
        )
    
    return db_issue

@router.get("/", response_model=List[schemas.Issue])
def get_issues(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    issues = db.query(models.Issue).offset(skip).limit(limit).all()
    return issues

@router.delete("/bulk-delete")
def bulk_delete_issues(
    request: BulkDeleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """여러 장애를 한 번에 삭제"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다")
    
    deleted_count = 0
    for issue_id in request.issue_ids:
        issue = db.query(models.Issue).filter(models.Issue.id == issue_id).first()
        if issue:
            db.delete(issue)
            deleted_count += 1
    
    db.commit()
    
    return {
        "message": f"{deleted_count}개의 장애가 삭제되었습니다",
        "deleted_count": deleted_count
    }

@router.get("/{issue_id}", response_model=schemas.Issue)
def get_issue(issue_id: int, db: Session = Depends(get_db)):
    issue = db.query(models.Issue).filter(models.Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return issue

@router.put("/{issue_id}", response_model=schemas.Issue)
def update_issue(issue_id: int, issue_update: schemas.IssueUpdate, db: Session = Depends(get_db)):
    db_issue = db.query(models.Issue).filter(models.Issue.id == issue_id).first()
    if not db_issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    # 이전 값 저장
    old_assignee = db_issue.assignee
    old_status = db_issue.status
    
    # 업데이트
    for key, value in issue_update.dict(exclude_unset=True).items():
        setattr(db_issue, key, value)
    
    # 상태가 resolved로 변경되면 resolved_at 설정
    if issue_update.status == "resolved" and not db_issue.resolved_at:
        db_issue.resolved_at = datetime.now()
    
    db.commit()
    db.refresh(db_issue)
    
    # 알림 생성
    # 1. 담당자가 변경된 경우 - 새 담당자에게 알림
    if issue_update.assignee and issue_update.assignee != old_assignee:
        if issue_update.assignee != db_issue.reporter:  # 신고자와 다른 경우만
            create_notification(
                db=db,
                username=issue_update.assignee,
                title="장애가 재할당되었습니다",
                message=f"'{db_issue.title}' 장애가 회원님에게 할당되었습니다.",
                notification_type="issue",
                related_id=db_issue.id
            )
    
    # 2. 상태가 변경된 경우 - 신고자에게 알림
    if issue_update.status and issue_update.status != old_status:
        status_text = {
            'open': '처리중',
            'in_progress': '진행중',
            'resolved': '해결됨',
            'closed': '종료'
        }.get(issue_update.status, issue_update.status)
        
        create_notification(
            db=db,
            username=db_issue.reporter,
            title="장애 상태가 변경되었습니다",
            message=f"'{db_issue.title}' 장애의 상태가 '{status_text}'(으)로 변경되었습니다.",
            notification_type="issue",
            related_id=db_issue.id
        )
    
    return db_issue

@router.delete("/{issue_id}")
def delete_issue(issue_id: int, db: Session = Depends(get_db)):
    db_issue = db.query(models.Issue).filter(models.Issue.id == issue_id).first()
    if not db_issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    db.delete(db_issue)
    db.commit()
    return {"message": "Issue deleted successfully"}