from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.comment import Comment
from app.schemas.comment import CommentCreate, CommentResponse, CommentUpdate
from app.core.security import get_current_user
from app.models.user import User
from app.api.notifications import create_notification  # 알림 함수 import

router = APIRouter(prefix="/api/comments", tags=["Comments"])

# 특정 대상의 댓글 조회 (자산 또는 장애)
@router.get("/{target_type}/{target_id}", response_model=List[CommentResponse])
def get_comments(
    target_type: str,
    target_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if target_type not in ['asset', 'issue']:
        raise HTTPException(status_code=400, detail="Invalid target type")
    
    comments = db.query(Comment).filter(
        Comment.target_type == target_type,
        Comment.target_id == target_id
    ).order_by(Comment.created_at.desc()).all()
    
    return comments

# 댓글 작성
@router.post("/{target_type}/{target_id}", response_model=CommentResponse)
def create_comment(
    target_type: str,
    target_id: int,
    comment: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if target_type not in ['asset', 'issue']:
        raise HTTPException(status_code=400, detail="Invalid target type")
    
    # 대상이 존재하는지 확인
    if target_type == 'asset':
        from app.models.asset import Asset
        target = db.query(Asset).filter(Asset.id == target_id).first()
    else:
        from app.models.issue import Issue
        target = db.query(Issue).filter(Issue.id == target_id).first()
    
    if not target:
        raise HTTPException(status_code=404, detail=f"{target_type.capitalize()} not found")
    
    db_comment = Comment(
        content=comment.content,
        author=current_user.full_name,
        author_id=current_user.id,
        target_type=target_type,
        target_id=target_id
    )
    
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    
    # 알림 전송
    if target_type == 'issue':
        # 장애에 댓글이 달린 경우
        # 신고자에게 알림 (본인 제외)
        if target.reporter and target.reporter != current_user.username:
            create_notification(
                db=db,
                username=target.reporter,
                title="새로운 댓글이 작성되었습니다",
                message=f"{current_user.full_name}님이 '{target.title}' 장애에 댓글을 작성했습니다.",
                notification_type="comment",
                related_id=target_id
            )
        
        # 담당자에게 알림 (본인 제외, 신고자와 다른 경우)
        if target.assignee and target.assignee != current_user.username and target.assignee != target.reporter:
            create_notification(
                db=db,
                username=target.assignee,
                title="새로운 댓글이 작성되었습니다",
                message=f"{current_user.full_name}님이 '{target.title}' 장애에 댓글을 작성했습니다.",
                notification_type="comment",
                related_id=target_id
            )
    
    elif target_type == 'asset':
        # 자산에 댓글이 달린 경우
        # 담당자에게 알림 (본인 제외)
        if target.assigned_to and target.assigned_to != current_user.username:
            create_notification(
                db=db,
                username=target.assigned_to,
                title="새로운 댓글이 작성되었습니다",
                message=f"{current_user.full_name}님이 '{target.name}' 자산에 댓글을 작성했습니다.",
                notification_type="comment",
                related_id=target_id
            )
    
    return db_comment

# 댓글 수정
@router.put("/{comment_id}", response_model=CommentResponse)
def update_comment(
    comment_id: int,
    comment_update: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_comment = db.query(Comment).filter(Comment.id == comment_id).first()
    
    if not db_comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # 본인 댓글만 수정 가능
    if db_comment.author_id != current_user.id and current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="권한이 없습니다.")
    
    db_comment.content = comment_update.content
    db.commit()
    db.refresh(db_comment)
    
    return db_comment

# 댓글 삭제
@router.delete("/{comment_id}")
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_comment = db.query(Comment).filter(Comment.id == comment_id).first()
    
    if not db_comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # 본인 댓글만 삭제 가능 (관리자는 모든 댓글 삭제 가능)
    if db_comment.author_id != current_user.id and current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="권한이 없습니다.")
    
    db.delete(db_comment)
    db.commit()
    
    return {"message": "Comment deleted successfully"}