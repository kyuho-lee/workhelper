from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app.models import issue as models
from app.schemas import issue as schemas

router = APIRouter(prefix="/api/issues", tags=["Issues"])

@router.post("/", response_model=schemas.Issue)
def create_issue(issue: schemas.IssueCreate, db: Session = Depends(get_db)):
    db_issue = models.Issue(**issue.dict())
    db.add(db_issue)
    db.commit()
    db.refresh(db_issue)
    return db_issue

@router.get("/", response_model=List[schemas.Issue])
def get_issues(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    issues = db.query(models.Issue).offset(skip).limit(limit).all()
    return issues

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
    
    for key, value in issue_update.dict(exclude_unset=True).items():
        setattr(db_issue, key, value)
    
    # 상태가 resolved로 변경되면 resolved_at 설정
    if issue_update.status == "resolved" and not db_issue.resolved_at:
        db_issue.resolved_at = datetime.now()
    
    db.commit()
    db.refresh(db_issue)
    return db_issue

@router.delete("/{issue_id}")
def delete_issue(issue_id: int, db: Session = Depends(get_db)):
    db_issue = db.query(models.Issue).filter(models.Issue.id == issue_id).first()
    if not db_issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    db.delete(db_issue)
    db.commit()
    return {"message": "Issue deleted successfully"}