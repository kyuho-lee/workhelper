from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.api import assets, issues, qr, upload, auth, users, comments, statistics, dashboard_config, categories, locations, attachments, notifications, filter_configs, reports 
from app.core.config import settings

# 테이블 생성
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="WorkHelper API",
    description="중소기업 자산 및 장애 관리 시스템",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,  # ← 이렇게 변경!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(assets.router)
app.include_router(issues.router)
app.include_router(qr.router)
app.include_router(upload.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(comments.router) 
app.include_router(statistics.router)  # 추가
app.include_router(dashboard_config.router)
# 새 라우터 추가!
app.include_router(categories.router)
app.include_router(locations.router)
app.include_router(attachments.router)  # 추가!
app.include_router(notifications.router)  # 추가!

app.include_router(filter_configs.router)  # 추가!
app.include_router(reports.router)  # 추가!


@app.get("/")
def read_root():
    return {
        "message": "WorkHelper API is running!",
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}