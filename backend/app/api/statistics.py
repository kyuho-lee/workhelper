from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, timedelta
from app.database import get_db
from app.models.issue import Issue
from app.models.asset import Asset
from app.models.user import User
from app.core.security import get_current_user

router = APIRouter(prefix="/api/statistics", tags=["Statistics"])

@router.get("/dashboard")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """대시보드 통계"""
    
    # 요약 통계
    total_assets = db.query(Asset).count()
    total_issues = db.query(Issue).count()
    open_issues = db.query(Issue).filter(
        Issue.status.in_(['open', 'in_progress'])
    ).count()
    
    # 월별 자산 등록 추이 (최근 12개월)
    now = datetime.now()
    monthly_assets = []
    for i in range(11, -1, -1):
        target_date = now - timedelta(days=30*i)
        month_start = datetime(target_date.year, target_date.month, 1)
        if target_date.month == 12:
            month_end = datetime(target_date.year + 1, 1, 1) - timedelta(days=1)
        else:
            month_end = datetime(target_date.year, target_date.month + 1, 1) - timedelta(days=1)
        
        count = db.query(Asset).filter(
            Asset.created_at >= month_start,
            Asset.created_at <= month_end
        ).count()
        
        monthly_assets.append({
            "month": f"{target_date.year}-{target_date.month:02d}",
            "count": count
        })
    
    # 월별 장애 등록 추이 (최근 12개월)
    monthly_issues = []
    for i in range(11, -1, -1):
        target_date = now - timedelta(days=30*i)
        month_start = datetime(target_date.year, target_date.month, 1)
        if target_date.month == 12:
            month_end = datetime(target_date.year + 1, 1, 1) - timedelta(days=1)
        else:
            month_end = datetime(target_date.year, target_date.month + 1, 1) - timedelta(days=1)
        
        count = db.query(Issue).filter(
            Issue.created_at >= month_start,
            Issue.created_at <= month_end
        ).count()
        
        monthly_issues.append({
            "month": f"{target_date.year}-{target_date.month:02d}",
            "count": count
        })
    
    # 자산 상태별 분포
    asset_status = db.query(
        Asset.status,
        func.count(Asset.id).label('count')
    ).group_by(Asset.status).all()
    
    asset_status_data = [
        {"status": status or "미지정", "count": count}
        for status, count in asset_status
    ]
    
    # 장애 우선순위별 분포
    issue_priority = db.query(
        Issue.priority,
        func.count(Issue.id).label('count')
    ).group_by(Issue.priority).all()
    
    issue_priority_data = [
        {"priority": priority or "미지정", "count": count}
        for priority, count in issue_priority
    ]
    
    # 장애 상태별 분포
    issue_status = db.query(
        Issue.status,
        func.count(Issue.id).label('count')
    ).group_by(Issue.status).all()
    
    status_map = {
        'open': '처리중',
        'in_progress': '진행중',
        'resolved': '해결됨',
        'closed': '종료'
    }
    
    issue_status_data = [
        {"status": status_map.get(status, status or "미지정"), "count": count}
        for status, count in issue_status
    ]
    
    # 자산 카테고리별 분포 (Top 10)
    asset_categories = db.query(
        Asset.category,
        func.count(Asset.id).label('count')
    ).filter(
        Asset.category.isnot(None),
        Asset.category != ''
    ).group_by(Asset.category).order_by(
        func.count(Asset.id).desc()
    ).limit(10).all()
    
    asset_categories_data = [
        {"category": category, "count": count}
        for category, count in asset_categories
    ]
    
    return {
        "summary": {
            "total_assets": total_assets,
            "total_issues": total_issues,
            "open_issues": open_issues
        },
        "monthly_assets": monthly_assets,
        "monthly_issues": monthly_issues,
        "asset_status": asset_status_data,
        "issue_priority": issue_priority_data,
        "issue_status": issue_status_data,
        "asset_categories": asset_categories_data
    }

@router.get("/assignee-workload")
def get_assignee_workload(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """담당자별 업무 현황"""
    
    # 담당자별 장애 통계
    from sqlalchemy import case
    
    assignee_stats = db.query(
        Issue.assignee,
        func.count(Issue.id).label('total'),
        func.sum(
            case(
                (Issue.status.in_(['open', 'in_progress']), 1),
                else_=0
            )
        ).label('in_progress'),
        func.sum(
            case(
                (Issue.status.in_(['resolved', 'closed']), 1),
                else_=0
            )
        ).label('completed')
    ).filter(
        Issue.assignee.isnot(None),
        Issue.assignee != ''
    ).group_by(Issue.assignee).all()
    
    result = []
    for assignee, total, in_progress, completed in assignee_stats:
        completion_rate = 0
        if total > 0:
            completion_rate = round((completed / total) * 100, 1)
        
        result.append({
            "assignee": assignee,
            "total": total,
            "in_progress": in_progress or 0,
            "completed": completed or 0,
            "completion_rate": completion_rate
        })
    
    # 완료율 기준 정렬
    result.sort(key=lambda x: x['completion_rate'], reverse=True)
    
    return result

@router.get("/old-unresolved-issues")
def get_old_unresolved_issues(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """오래된 미해결 장애 Top N"""
    
    # 미해결 장애 (open, in_progress)
    unresolved_issues = db.query(Issue).filter(
        Issue.status.in_(['open', 'in_progress'])
    ).order_by(Issue.created_at.asc()).limit(limit).all()
    
    now = datetime.now()
    result = []
    
    for issue in unresolved_issues:
        if issue.created_at:
            elapsed_days = (now - issue.created_at).days
            
            # 긴급도 판단
            if elapsed_days >= 7:
                urgency = 'high'  # 빨강
            elif elapsed_days >= 3:
                urgency = 'medium'  # 노랑
            else:
                urgency = 'low'  # 초록
            
            result.append({
                "id": issue.id,
                "title": issue.title,
                "priority": issue.priority,
                "assignee": issue.assignee,
                "elapsed_days": elapsed_days,
                "urgency": urgency,
                "created_at": issue.created_at.isoformat()
            })
    
    return result

@router.get("/period-comparison")
def get_period_comparison(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """주간/월간 비교 통계"""
    
    now = datetime.now()
    
    # 이번 주 (월요일 시작)
    today = now.date()
    weekday = today.weekday()  # 0=월요일, 6=일요일
    this_week_start = today - timedelta(days=weekday)
    this_week_end = today
    
    # 지난 주
    last_week_start = this_week_start - timedelta(days=7)
    last_week_end = this_week_start - timedelta(days=1)
    
    # 이번 달
    this_month_start = datetime(now.year, now.month, 1).date()
    this_month_end = today
    
    # 지난 달
    if now.month == 1:
        last_month_start = datetime(now.year - 1, 12, 1).date()
        last_month_end = datetime(now.year, 1, 1).date() - timedelta(days=1)
    else:
        last_month_start = datetime(now.year, now.month - 1, 1).date()
        last_month_end = this_month_start - timedelta(days=1)
    
    # 이번 주 자산/장애
    this_week_assets = db.query(Asset).filter(
        func.date(Asset.created_at) >= this_week_start,
        func.date(Asset.created_at) <= this_week_end
    ).count()
    
    this_week_issues = db.query(Issue).filter(
        func.date(Issue.created_at) >= this_week_start,
        func.date(Issue.created_at) <= this_week_end
    ).count()
    
    # 지난 주 자산/장애
    last_week_assets = db.query(Asset).filter(
        func.date(Asset.created_at) >= last_week_start,
        func.date(Asset.created_at) <= last_week_end
    ).count()
    
    last_week_issues = db.query(Issue).filter(
        func.date(Issue.created_at) >= last_week_start,
        func.date(Issue.created_at) <= last_week_end
    ).count()
    
    # 이번 달 자산/장애
    this_month_assets = db.query(Asset).filter(
        func.date(Asset.created_at) >= this_month_start,
        func.date(Asset.created_at) <= this_month_end
    ).count()
    
    this_month_issues = db.query(Issue).filter(
        func.date(Issue.created_at) >= this_month_start,
        func.date(Issue.created_at) <= this_month_end
    ).count()
    
    # 지난 달 자산/장애
    last_month_assets = db.query(Asset).filter(
        func.date(Asset.created_at) >= last_month_start,
        func.date(Asset.created_at) <= last_month_end
    ).count()
    
    last_month_issues = db.query(Issue).filter(
        func.date(Issue.created_at) >= last_month_start,
        func.date(Issue.created_at) <= last_month_end
    ).count()
    
    # 증감률 계산
    def calculate_change(current, previous):
        if previous == 0:
            if current == 0:
                return 0
            return 100
        return round(((current - previous) / previous) * 100, 1)
    
    return {
        "weekly": {
            "assets": {
                "this_week": this_week_assets,
                "last_week": last_week_assets,
                "change": calculate_change(this_week_assets, last_week_assets)
            },
            "issues": {
                "this_week": this_week_issues,
                "last_week": last_week_issues,
                "change": calculate_change(this_week_issues, last_week_issues)
            }
        },
        "monthly": {
            "assets": {
                "this_month": this_month_assets,
                "last_month": last_month_assets,
                "change": calculate_change(this_month_assets, last_month_assets)
            },
            "issues": {
                "this_month": this_month_issues,
                "last_month": last_month_issues,
                "change": calculate_change(this_month_issues, last_month_issues)
            }
        }
    }