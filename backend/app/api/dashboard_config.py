from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.dashboard_config import DashboardConfig
from app.schemas.dashboard_config import DashboardConfigResponse, DashboardConfigUpdate
from app.core.security import get_current_user, get_current_active_admin
from app.models.user import User

router = APIRouter(prefix="/api/dashboard-config", tags=["Dashboard Config"])

# 기본 위젯 목록
DEFAULT_WIDGETS = [
    {
        "widget_id": "monthly_assets",
        "widget_name": "월별 자산 등록 추이",
        "description": "최근 12개월간 자산 등록 추이를 보여줍니다.",
        "is_visible": True,
        "display_order": 1,
        "config_data": {
            "chart_type": "line",  # line, bar
            "period": 12,  # 개월
            "color": "blue"  # blue, green, red, purple
        }
    },
    {
        "widget_id": "monthly_issues",
        "widget_name": "월별 장애 등록 추이",
        "description": "최근 12개월간 장애 등록 추이를 보여줍니다.",
        "is_visible": True,
        "display_order": 2,
        "config_data": {
            "chart_type": "line",
            "period": 12,
            "color": "red"
        }
    },
    {
        "widget_id": "asset_status",
        "widget_name": "자산 상태별 분포",
        "description": "자산 상태별 통계를 보여줍니다.",
        "is_visible": True,
        "display_order": 3,
        "config_data": {
            "chart_type": "bar",  # bar, doughnut, pie
            "color_scheme": "default"  # default, pastel, vibrant
        }
    },
    {
        "widget_id": "issue_priority",
        "widget_name": "장애 우선순위별 분포",
        "description": "장애 우선순위별 통계를 보여줍니다.",
        "is_visible": True,
        "display_order": 4,
        "config_data": {
            "chart_type": "pie",  # pie, doughnut, bar
            "color_scheme": "default"
        }
    },
    {
        "widget_id": "issue_status",
        "widget_name": "장애 상태별 분포",
        "description": "장애 상태별 통계를 보여줍니다.",
        "is_visible": True,
        "display_order": 5,
        "config_data": {
            "chart_type": "doughnut",  # doughnut, pie, bar
            "color_scheme": "default"
        }
    },
    {
        "widget_id": "asset_categories",
        "widget_name": "자산 분류별 Top 10",
        "description": "가장 많은 자산 분류를 보여줍니다.",
        "is_visible": True,
        "display_order": 6,
        "config_data": {
            "chart_type": "bar",  # bar, pie
            "top_n": 10,  # 5, 10, 15, 20
            "color": "green"
        }
    },
    {
        "widget_id": "recent_assets",
        "widget_name": "최근 등록된 자산",
        "description": "최근에 등록된 자산을 보여줍니다.",
        "is_visible": True,
        "display_order": 7,
        "config_data": {
            "count": 5  # 3, 5, 10
        }
    },
    {
        "widget_id": "recent_issues",
        "widget_name": "최근 등록된 장애",
        "description": "최근에 등록된 장애를 보여줍니다.",
        "is_visible": True,
        "display_order": 8,
        "config_data": {
            "count": 5  # 3, 5, 10
        }
    },
    {
        "widget_id": "assignee_workload",
        "widget_name": "담당자별 업무 현황",
        "description": "담당자별 처리 중인 장애 수와 완료율을 표시합니다.",
        "is_visible": True,
        "display_order": 9,
        "config_data": {}
    },
    {
        "widget_id": "old_unresolved_issues",
        "widget_name": "오래된 미해결 장애",
        "description": "오래된 미해결 장애 Top 5를 표시합니다.",
        "is_visible": True,
        "display_order": 10,
        "config_data": {
            "count": 5
        }
    },
    {
        "widget_id": "period_comparison",
        "widget_name": "기간별 비교",
        "description": "주간/월간 자산 및 장애 통계를 비교합니다.",
        "is_visible": True,
        "display_order": 11,
        "config_data": {}
    }
]

def init_default_widgets(db: Session):
    """기본 위젯이 없으면 생성"""
    existing_count = db.query(DashboardConfig).count()
    if existing_count == 0:
        for widget in DEFAULT_WIDGETS:
            db_widget = DashboardConfig(**widget)
            db.add(db_widget)
        db.commit()

# 모든 위젯 설정 조회
@router.get("", response_model=List[DashboardConfigResponse])
def get_dashboard_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 기본 위젯이 없으면 초기화
    init_default_widgets(db)
    
    configs = db.query(DashboardConfig).order_by(DashboardConfig.display_order).all()
    return configs

# 위젯 설정 업데이트 (관리자만)
@router.put("/{widget_id}", response_model=DashboardConfigResponse)
def update_widget_config(
    widget_id: str,
    config_update: DashboardConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    db_config = db.query(DashboardConfig).filter(
        DashboardConfig.widget_id == widget_id
    ).first()
    
    if not db_config:
        raise HTTPException(status_code=404, detail="Widget not found")
    
    # is_visible 업데이트
    if config_update.is_visible is not None:
        db_config.is_visible = config_update.is_visible
    
    # display_order 업데이트
    if config_update.display_order is not None:
        db_config.display_order = config_update.display_order
    
    # ✅ config_data 업데이트 추가!
    if config_update.config_data is not None:
        print(f"=== 백엔드: config_data 업데이트 ===")
        print(f"위젯 ID: {widget_id}")
        print(f"기존 config_data: {db_config.config_data}")
        print(f"새 config_data: {config_update.config_data}")
        db_config.config_data = config_update.config_data
        print(f"업데이트 완료!")
    
    db.commit()
    db.refresh(db_config)
    
    print(f"DB 커밋 후 config_data: {db_config.config_data}")
    
    return db_config

# 여러 위젯 순서 일괄 업데이트 (관리자만)
@router.post("/reorder")
def reorder_widgets(
    widget_orders: List[dict],  # [{"widget_id": "...", "display_order": 1}, ...]
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    for item in widget_orders:
        widget_id = item.get("widget_id")
        display_order = item.get("display_order")
        
        db_config = db.query(DashboardConfig).filter(
            DashboardConfig.widget_id == widget_id
        ).first()
        
        if db_config:
            db_config.display_order = display_order
    
    db.commit()
    return {"message": "Widget order updated successfully"}

# 설정 초기화 (관리자만)
@router.post("/reset")
def reset_dashboard_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    # 모든 설정 삭제
    db.query(DashboardConfig).delete()
    db.commit()
    
    # 기본 설정 재생성
    init_default_widgets(db)
    
    return {"message": "Dashboard config reset to default"}