from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import Optional
from app.database import get_db
from app.models.asset import Asset
from app.models.issue import Issue
from app.models.user import User
from app.core.security import get_current_user

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("/asset-summary")
def get_asset_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """자산 보고서 데이터"""
    
    # 기본 날짜 범위 (지정 안 하면 전체)
    query = db.query(Asset)
    
    if start_date:
        query = query.filter(Asset.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Asset.created_at <= datetime.fromisoformat(end_date))
    
    assets = query.all()
    
    # 총 자산 수
    total_assets = len(assets)
    
    # 상태별 분포
    status_distribution = {}
    for asset in assets:
        status = asset.status or '미지정'
        status_distribution[status] = status_distribution.get(status, 0) + 1
    
    # 카테고리별 분포
    category_distribution = {}
    for asset in assets:
        category = asset.category or '미지정'
        category_distribution[category] = category_distribution.get(category, 0) + 1
    
    # 위치별 분포
    location_distribution = {}
    for asset in assets:
        location = asset.location or '미지정'
        location_distribution[location] = location_distribution.get(location, 0) + 1
    
    # 최근 추가된 자산 (상위 10개)
    recent_assets = sorted(assets, key=lambda x: x.created_at, reverse=True)[:10]
    
    return {
        "period": {
            "start_date": start_date,
            "end_date": end_date
        },
        "summary": {
            "total_assets": total_assets,
            "status_distribution": status_distribution,
            "category_distribution": category_distribution,
            "location_distribution": location_distribution
        },
        "recent_assets": [
            {
                "asset_number": asset.asset_number,
                "name": asset.name,
                "category": asset.category,
                "status": asset.status,
                "created_at": asset.created_at.isoformat() if asset.created_at else None
            }
            for asset in recent_assets
        ]
    }

@router.get("/issue-summary")
def get_issue_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """장애 보고서 데이터"""
    
    query = db.query(Issue)
    
    if start_date:
        query = query.filter(Issue.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Issue.created_at <= datetime.fromisoformat(end_date))
    
    issues = query.all()
    
    # 총 장애 수
    total_issues = len(issues)
    
    # 상태별 분포
    status_distribution = {}
    for issue in issues:
        status = issue.status or '미지정'
        status_map = {
            'open': '처리중',
            'in_progress': '진행중',
            'resolved': '해결됨',
            'closed': '종료'
        }
        status_label = status_map.get(status, status)
        status_distribution[status_label] = status_distribution.get(status_label, 0) + 1
    
    # 우선순위별 분포
    priority_distribution = {}
    for issue in issues:
        priority = issue.priority or '미지정'
        priority_distribution[priority] = priority_distribution.get(priority, 0) + 1
    
    # 해결된 장애의 평균 해결 시간 (일)
    resolved_issues = [i for i in issues if i.resolved_at]
    avg_resolution_time = 0
    if resolved_issues:
        total_time = sum([
            (i.resolved_at - i.created_at).total_seconds() / 86400
            for i in resolved_issues
        ])
        avg_resolution_time = round(total_time / len(resolved_issues), 1)
    
    # 담당자별 장애 수
    assignee_distribution = {}
    for issue in issues:
        assignee = issue.assignee or '미배정'
        assignee_distribution[assignee] = assignee_distribution.get(assignee, 0) + 1
    
    # 최근 장애 (상위 10개)
    recent_issues = sorted(issues, key=lambda x: x.created_at, reverse=True)[:10]
    
    return {
        "period": {
            "start_date": start_date,
            "end_date": end_date
        },
        "summary": {
            "total_issues": total_issues,
            "status_distribution": status_distribution,
            "priority_distribution": priority_distribution,
            "assignee_distribution": assignee_distribution,
            "avg_resolution_time_days": avg_resolution_time,
            "resolved_count": len(resolved_issues),
            "open_count": total_issues - len(resolved_issues)
        },
        "recent_issues": [
            {
                "title": issue.title,
                "status": issue.status,
                "priority": issue.priority,
                "reporter": issue.reporter,
                "assignee": issue.assignee,
                "created_at": issue.created_at.isoformat() if issue.created_at else None
            }
            for issue in recent_issues
        ]
    }

@router.get("/combined-summary")
def get_combined_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """통합 보고서 데이터 (자산 + 장애)"""
    
    asset_report = get_asset_report(start_date, end_date, db, current_user)
    issue_report = get_issue_report(start_date, end_date, db, current_user)
    
    return {
        "period": {
            "start_date": start_date,
            "end_date": end_date,
            "generated_at": datetime.now().isoformat()
        },
        "assets": asset_report,
        "issues": issue_report
    }