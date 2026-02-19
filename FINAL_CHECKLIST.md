# WorkHelper 배포 최종 체크리스트

## ✅ Phase 1: 개발 완료 (100%)

### 핵심 기능
- [x] 자산 CRUD (생성, 조회, 수정, 삭제)
- [x] 장애 CRUD
- [x] QR 코드 생성
- [x] 파일 업로드
- [x] 댓글 시스템
- [x] 알림 시스템
- [x] 첨부파일 관리
- [x] 카테고리 관리
- [x] 위치 관리
- [x] 사용자 관리
- [x] JWT 인증

### 대시보드
- [x] 월별 자산 등록 추이
- [x] 월별 장애 등록 추이
- [x] 자산 상태별 분포
- [x] 장애 우선순위별 분포
- [x] 장애 상태별 분포
- [x] 자산 분류별 Top 10
- [x] 최근 등록된 자산
- [x] 최근 등록된 장애
- [x] 담당자별 업무 현황
- [x] 오래된 미해결 장애
- [x] 기간별 비교

### 고급 기능
- [x] 동적 필터 시스템
- [x] 저장된 필터
- [x] Excel 내보내기
- [x] 일괄 삭제
- [x] 고급 검색
- [x] 보고서 생성 (PDF)
- [x] 페이지네이션
- [x] 다크모드

---

## ✅ Phase 2: 배포 준비 (100%)

### Git & 버전 관리
- [x] Git 저장소 초기화
- [x] .gitignore 설정
- [x] GitHub 원격 저장소 연결
- [x] venv, node_modules 제외
- [x] .env 파일 제외
- [x] 첫 커밋 및 푸시

### 환경 변수 시스템
- [x] config.py 생성
- [x] .env 파일 설정
- [x] .env.example 템플릿
- [x] JWT 비밀키 생성
- [x] MySQL 비밀번호 설정
- [x] security.py 환경 변수 적용
- [x] database.py 환경 변수 적용
- [x] main.py CORS 환경 변수 적용
- [x] python-dotenv 설치

### 패키지 관리
- [x] requirements.txt 업데이트
- [x] package.json 확인

---

## ✅ Phase 3: 프로덕션 빌드 (100%)

### 프론트엔드
- [x] React 프로덕션 빌드
- [x] build 폴더 생성
- [x] 정적 파일 서빙 테스트 (Nginx)

### 문서화
- [x] README.md 작성
- [x] DEPLOYMENT_GUIDE.md 작성
- [ ] API 문서 정리

---

## ✅ Phase 4: 배포 (AWS EC2 운영 중)

### 서버 설정
- [x] 배포 서버 선택: AWS EC2 (t2.micro, Ubuntu)
- [x] 탄력적 IP: 43.200.14.79
- [x] Nginx 리버스 프록시 설정
- [x] Swap 4GB 설정 (/swapfile, fstab 영구 등록)
- [ ] 도메인 등록
- [ ] SSL 인증서 설정

### 데이터베이스
- [x] 프로덕션 데이터베이스 생성 (MySQL, localhost)
- [ ] 백업 전략 수립
- [ ] 자동 백업 스크립트

### 보안
- [x] 보안 그룹 설정 (SSH, HTTP, HTTPS, 8000)
- [ ] MySQL 외부 접근 차단
- [ ] HTTPS 적용
- [ ] 보안 헤더 추가
- [ ] Rate Limiting

### 모니터링
- [ ] 로그 설정
- [ ] 에러 모니터링
- [ ] 성능 모니터링
- [ ] 알림 설정

---

## 📋 프로덕션 배포 시 필수 변경사항

### 1. 환경 변수 (.env)

```env
# 프로덕션 설정으로 변경!
ENVIRONMENT=production

# 강력한 비밀키로 변경!
SECRET_KEY=<새로운-안전한-비밀키>

# 프로덕션 도메인 추가!
CORS_ORIGINS=["https://yourdomain.com"]

# 프로덕션 데이터베이스!
DATABASE_URL=mysql+pymysql://user:password@production-db:3306/workhelper
```

### 2. MySQL 설정

```sql
-- 프로덕션 사용자 생성
CREATE USER 'workhelper_prod'@'%' IDENTIFIED BY 'strong-password-here';
GRANT ALL PRIVILEGES ON workhelper_prod.* TO 'workhelper_prod'@'%';
FLUSH PRIVILEGES;
```

### 3. 백엔드 실행

**개발:**
```bash
uvicorn app.main:app --reload
```

**프로덕션:**
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

또는 Gunicorn 사용:
```bash
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000
```

### 4. 프론트엔드 배포

**빌드:**
```bash
cd frontend
npm run build
```

**Nginx 설정 예시:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # 프론트엔드
    location / {
        root /path/to/workhelper/frontend/build;
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

---

## 🔒 보안 체크리스트

- [ ] 모든 비밀번호 변경
- [ ] SECRET_KEY 새로 생성
- [ ] MySQL root 비밀번호 설정
- [ ] 관리자 계정 비밀번호 변경
- [ ] HTTPS 적용
- [ ] CORS 도메인 제한
- [ ] SQL Injection 방어 확인
- [ ] XSS 방어 확인
- [ ] CSRF 토큰 적용

---

## 📊 성능 최적화

- [ ] 데이터베이스 인덱스 추가
- [ ] 쿼리 최적화
- [ ] 이미지 압축
- [ ] CDN 사용
- [ ] Gzip 압축
- [ ] 캐싱 전략

---

## 🎯 현재 상태

**개발 환경 (로컬):**
- ✅ 백엔드: http://localhost:8000
- ✅ 프론트엔드: http://localhost:3000
- ✅ 데이터베이스: MySQL (localhost)

**프로덕션 환경 (AWS):**
- ✅ 서비스 URL: http://43.200.14.79
- ✅ 백엔드: uvicorn (port 8000, nohup 실행)
- ✅ 프론트엔드: Nginx 정적 서빙 (build 폴더)
- ✅ 데이터베이스: MySQL (localhost)
- ✅ Swap: 4GB 설정 완료

---

## 🔄 배포 방법

### 방법 1: deploy.bat 사용 (로컬 빌드 → push → 서버 pull)
```bash
# 로컬에서 deploy.bat 실행 후
# AWS 서버에 SSH 접속하여:
cd /home/ubuntu/workhelper
git pull origin main
# 백엔드 변경 시: uvicorn 재시작
# 프론트엔드 변경 시: npm run build (서버에서)
```

### 방법 2: 수동 배포
```bash
# 1. 로컬에서 커밋 & push
git add <파일>
git commit -m "메시지"
git push origin main

# 2. AWS 서버 접속
ssh -i "C:/AWS/workhelper-key.pem" ubuntu@43.200.14.79

# 3. 서버에서 pull
cd /home/ubuntu/workhelper && git pull origin main

# 4. 백엔드 재시작 (코드 변경 시)
kill $(pgrep -f uvicorn)
cd backend && nohup venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 > /dev/null 2>&1 &

# 5. 프론트엔드 재빌드 (코드 변경 시)
cd frontend && NODE_OPTIONS='--max-old-space-size=1024' npm run build
```

---

## 🐛 버그 수정 이력

### 2026-02-19: 자산 수정 실패 버그 수정
- **증상**: 자산 수정 시 "수정 실패" 에러 팝업
- **원인**: 백엔드 update_asset이 AssetCreate 스키마 사용 (모든 필드 필수), 프론트엔드에서 빈 문자열이 date/decimal 타입 파싱 실패
- **수정 파일**:
  - `backend/app/api/assets.py`: AssetCreate → AssetUpdate 스키마, exclude_unset=True
  - `frontend/src/components/AssetEdit.js`: 빈 문자열 → null 변환, asset_number 제외
- **커밋**: a452166

### 2026-02-19: AWS 서버 Swap 4GB 추가
- **증상**: RAM 부족 (914MB 중 817MB 사용, Swap 없음)으로 빌드 실패 및 서비스 불안정
- **조치**: /swapfile 4GB 생성, /etc/fstab 영구 등록

---

## 📋 AWS 서버 정보

| 항목 | 값 |
|---|---|
| 인스턴스 타입 | t2.micro |
| OS | Ubuntu 22.04 LTS |
| 탄력적 IP | 43.200.14.79 |
| 내부 IP | 172.31.45.229 |
| SSH 키 | C:\AWS\workhelper-key.pem |
| SSH 접속 | `ssh -i "C:/AWS/workhelper-key.pem" ubuntu@43.200.14.79` |
| RAM | 914MB + Swap 4GB |
| 디스크 | 29GB (사용 ~5GB) |
| CPU | 2코어 |
| 프로젝트 경로 | /home/ubuntu/workhelper |
| GitHub | https://github.com/kyuho-lee/workhelper |

---

## 📞 지원

문제가 발생하면:
1. 로그 확인
2. .env 설정 확인
3. 데이터베이스 연결 확인
4. GitHub Issues 등록