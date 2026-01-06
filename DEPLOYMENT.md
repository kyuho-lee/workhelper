# AWS 배포 가이드

## 배포 아키텍처
```
사용자
  ↓
CloudFront (CDN) - S3 (정적 파일)
  ↓
ALB (Load Balancer)
  ↓
EC2 / ECS (백엔드)
  ↓
RDS MySQL (데이터베이스)
```

## 옵션 1: EC2 배포 (간단)

### 1. EC2 인스턴스 생성
- AMI: Ubuntu 22.04 LTS
- 인스턴스 타입: t2.micro (프리티어)
- 보안 그룹: HTTP(80), HTTPS(443), SSH(22), Custom(8000)

### 2. 서버 접속 및 환경 설정
```bash
# SSH 접속
ssh -i your-key.pem ubuntu@your-ec2-ip

# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# Python 설치
sudo apt install python3.12 python3.12-venv python3-pip -y

# Node.js 설치
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# MySQL 클라이언트 설치
sudo apt install mysql-client-core-8.0 -y
```

### 3. 프로젝트 배포
```bash
# Git 클론 (또는 파일 업로드)
git clone <your-repo> /home/ubuntu/workhelper
cd /home/ubuntu/workhelper

# 백엔드 설정
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# .env 파일 생성 (RDS 정보 입력)
nano .env

# 백엔드 실행 (테스트)
uvicorn app.main:app --host 0.0.0.0 --port 8000

# 프론트엔드 빌드
cd ../frontend
npm install
npm run build
```

### 4. Nginx 설정
```bash
sudo apt install nginx -y

# Nginx 설정 파일
sudo nano /etc/nginx/sites-available/workhelper
```
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 프론트엔드
    location / {
        root /home/ubuntu/workhelper/frontend/build;
        try_files $uri /index.html;
    }

    # 백엔드 API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
```bash
# 설정 활성화
sudo ln -s /etc/nginx/sites-available/workhelper /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. 백엔드 서비스 등록 (systemd)
```bash
sudo nano /etc/systemd/system/workhelper.service
```
```ini
[Unit]
Description=WorkHelper FastAPI
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/workhelper/backend
Environment="PATH=/home/ubuntu/workhelper/backend/venv/bin"
ExecStart=/home/ubuntu/workhelper/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000

[Install]
WantedBy=multi-user.target
```
```bash
sudo systemctl daemon-reload
sudo systemctl enable workhelper
sudo systemctl start workhelper
sudo systemctl status workhelper
```

## 옵션 2: RDS 데이터베이스 설정

### 1. RDS MySQL 인스턴스 생성
- 엔진: MySQL 8.0
- 인스턴스 클래스: db.t3.micro (프리티어)
- 스토리지: 20GB
- 퍼블릭 액세스: 예 (또는 VPC 내부만)

### 2. 보안 그룹 설정
- 인바운드 규칙: MySQL/Aurora (3306) - EC2 보안 그룹에서만 허용

### 3. 데이터베이스 생성
```sql
-- RDS 엔드포인트로 접속
mysql -h your-rds-endpoint.rds.amazonaws.com -u admin -p

CREATE DATABASE workhelper CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

### 4. 백엔드 .env 업데이트
```env
DATABASE_URL=mysql+pymysql://admin:password@your-rds-endpoint.rds.amazonaws.com:3306/workhelper
```

## 옵션 3: S3 + CloudFront (프론트엔드 호스팅)

### 1. S3 버킷 생성
- 버킷 이름: workhelper-frontend
- 정적 웹사이트 호스팅 활성화

### 2. 프론트엔드 빌드 업로드
```bash
cd frontend
npm run build
aws s3 sync build/ s3://workhelper-frontend/
```

### 3. CloudFront 배포 생성
- Origin: S3 버킷
- Default Root Object: index.html
- Error Pages: 404 → /index.html (React Router용)

## 비용 예상 (프리티어)

| 서비스 | 프리티어 | 초과 시 비용 |
|--------|----------|--------------|
| EC2 t2.micro | 750시간/월 (1년) | ~$10/월 |
| RDS db.t3.micro | 750시간/월 (1년) | ~$15/월 |
| S3 | 5GB | ~$0.023/GB |
| CloudFront | 50GB 전송 | ~$0.085/GB |

**총 예상 비용 (프리티어 이후): $25-30/월**

## SSL/HTTPS 설정

### AWS Certificate Manager (무료)
1. ACM에서 인증서 요청
2. 도메인 소유 확인
3. CloudFront 또는 ALB에 인증서 연결

## 모니터링

- CloudWatch: 로그 및 메트릭 모니터링
- RDS 성능 인사이트
- EC2 CPU/메모리 사용률

## 백업

- RDS 자동 백업 (7일 보관)
- EC2 AMI 스냅샷 (주간)
- 코드: Git 저장소

## 보안 체크리스트

- ✅ 보안 그룹 최소 권한 원칙
- ✅ RDS 퍼블릭 액세스 비활성화 (가능하면)
- ✅ .env 파일 Git에서 제외
- ✅ SSL/HTTPS 사용
- ✅ IAM 역할 최소 권한
- ✅ 정기 백업
- ✅ 보안 패치 자동 업데이트