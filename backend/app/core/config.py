import os
from typing import List
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

class Settings:
    """애플리케이션 설정"""
    
    # 데이터베이스
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://root:NewPassword123!@localhost:3306/workhelper"
    )
    
    # JWT
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        "your-secret-key-change-this-in-production"
    )
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
    )
    
    # CORS
    CORS_ORIGINS: List[str] = eval(
        os.getenv("CORS_ORIGINS", '["http://localhost:3000"]')
    )
    
    # 환경
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # 파일 업로드
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    MAX_UPLOAD_SIZE: int = int(
        os.getenv("MAX_UPLOAD_SIZE", "10485760")  # 10MB
    )
    
    # 로깅
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    # 앱 정보
    APP_NAME: str = "WorkHelper"
    APP_VERSION: str = "1.0.0"
    
    @property
    def is_production(self) -> bool:
        """프로덕션 환경인지 확인"""
        return self.ENVIRONMENT.lower() == "production"
    
    @property
    def is_development(self) -> bool:
        """개발 환경인지 확인"""
        return self.ENVIRONMENT.lower() == "development"

# 전역 설정 인스턴스
settings = Settings()

# 설정 출력 (개발 환경에서만)
if settings.is_development:
    print("=" * 60)
    print("📋 WorkHelper 설정 로드 완료")
    print("=" * 60)
    print(f"환경: {settings.ENVIRONMENT}")
    print(f"데이터베이스: {settings.DATABASE_URL.split('@')[1] if '@' in settings.DATABASE_URL else 'Not configured'}")
    print(f"CORS Origins: {settings.CORS_ORIGINS}")
    print(f"JWT 만료 시간: {settings.ACCESS_TOKEN_EXPIRE_MINUTES}분")
    print("=" * 60)