# WorkHelper - 업무 관리 시스템

중소기업을 위한 IT 자산 및 장애 관리 시스템

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## 🚀 주요 기능

### ✅ 자산 관리
- 자산 등록/수정/삭제/검색
- PC, 노트북, 네트워크 장비 등 IT 자산 관리
- QR 코드 생성 및 출력
- 자산 상태 추적 (사용중, 수리중, 폐기 등)
- 카테고리 및 위치별 분류
- 엑셀 내보내기
- 일괄 작업 (삭제, 상태 변경)

### ✅ 장애 처리
- 장애 접수 및 처리 현황 관리
- 우선순위 설정 (긴급, 높음, 보통, 낮음)
- 담당자 배정 및 진행 상태 추적
- 댓글 및 첨부파일 지원
- 상태별 진행 상황 추적

### ✅ 대시보드 & 통계
**11개 위젯으로 구성된 실시간 대시보드:**
- 월별 자산/장애 등록 추이
- 자산 상태별/분류별 분포 (Top 10)
- 장애 우선순위별/상태별 분포
- 담당자별 업무 현황 (완료율 표시)
- 오래된 미해결 장애 Top 5
- 기간별 비교 (주간/월간)
- 최근 등록된 자산/장애
- 위젯 표시/숨김 및 순서 변경 가능

### ✅ 보고서 생성
- 기간별 자산/장애 보고서 자동 생성
- PDF 출력 지원
- A4 최적화, 색상 인쇄

### ✅ 고급 검색 & 필터
- 동적 필터 시스템
- 저장된 필터 관리 (즐겨찾기)
- 다중 조건 검색
- Excel 내보내기

### ✅ 알림 시스템
- 실시간 알림
- 미읽음 알림 개수 표시
- 알림 읽음/삭제 관리

### ✅ 사용자 관리
- 관리자/일반 사용자 권한 구분
- JWT 토큰 기반 인증
- 안전한 비밀번호 암호화

### ✅ UI/UX
- 반응형 디자인 (PC/태블릿/모바일)
- 다크 모드 지원
- 직관적인 인터페이스
- 페이지네이션

---

## 🛠️ 기술 스택

### Backend
- **Python 3.12**
- **FastAPI** - 고성능 웹 프레임워크
- **SQLAlchemy** - ORM
- **MySQL** - 데이터베이스
- **PyMySQL** - MySQL 드라이버
- **JWT** - 인증
- **python-dotenv** - 환경 변수 관리
- **Pydantic** - 데이터 검증

### Frontend
- **React 18**
- **Tailwind CSS** - UI 스타일링
- **React Router** - 라우팅
- **Axios** - HTTP 클라이언트
- **Chart.js** - 차트 시각화
- **QRCode.react** - QR 코드 생성
- **jsPDF** - PDF 생성

---

## 📋 사전 요구사항

- Python 3.12 이상
- Node.js 18 이상
- MySQL 8.0 이상 (또는 XAMPP)
- Git

---

## 🔧 설치 및 실행

### 1. 저장소 클론
```bash
git clone https://github.com/kyuho-lee/workhelper.git
cd workhelper
```

### 2. 백엔드 설정
```bash
cd backend

# 가상환경 생성 및 활성화 (Windows)
python -m venv venv
venv\Scripts\activate

# Mac/Linux
# python3 -m venv venv
# source venv/bin/activate

# 패키지 설치
pip install -r requirements.txt

# .env 파일 생성
copy .env.example .env  # Windows
# cp .env.example .env  # Mac/Linux
```

**`.env` 파일 설정:**
```env
# 데이터베이스 설정
DATABASE_URL=mysql+pymysql://root:your_password@localhost:3306/workhelper

# JWT 설정 (아래 명령어로 비밀키 생성!)
# python -c "import secrets; print(secrets.token_urlsafe(32))"
SECRET_KEY=your-generated-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS 설정
CORS_ORIGINS=["http://localhost:3000"]

# 환경 설정
ENVIRONMENT=development
```

**백엔드 서버 실행:**
```bash
uvicorn app.main:app --reload
```

- **백엔드 API:** http://localhost:8000
- **API 문서:** http://localhost:8000/docs (Swagger UI)

### 3. 데이터베이스 설정

**MySQL에서 데이터베이스 생성:**
```sql
CREATE DATABASE workhelper CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

테이블은 백엔드 실행 시 자동으로 생성됩니다.

### 4. 프론트엔드 설정
```bash
cd frontend

# 패키지 설치
npm install

# .env 파일 생성
copy .env.example .env  # Windows
# cp .env.example .env  # Mac/Linux
```

**프론트엔드 `.env` 파일:**
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_ENVIRONMENT=development
```

**개발 서버 실행:**
```bash
npm start
```

**프로덕션 빌드:**
```bash
npm run build
```

- **프론트엔드:** http://localhost:3000

---

## 🔐 기본 계정

**관리자 계정:**
- 사용자명: `admin`
- 비밀번호: `admin123`

**일반 사용자 계정:**
- 사용자명: `user`
- 비밀번호: `user123`

⚠️ **보안을 위해 최초 로그인 후 반드시 비밀번호를 변경하세요!**

---

## 📁 프로젝트 구조
```
workhelper/
├── backend/
│   ├── app/
│   │   ├── api/          # API 라우터
│   │   │   ├── assets.py
│   │   │   ├── issues.py
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── comments.py
│   │   │   ├── attachments.py
│   │   │   ├── notifications.py
│   │   │   ├── statistics.py
│   │   │   ├── dashboard_config.py
│   │   │   ├── categories.py
│   │   │   ├── locations.py
│   │   │   ├── filter_configs.py
│   │   │   ├── reports.py
│   │   │   ├── qr.py
│   │   │   └── upload.py
│   │   ├── core/         # 설정 및 보안
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── validators.py
│   │   ├── models/       # 데이터베이스 모델
│   │   ├── schemas/      # Pydantic 스키마
│   │   ├── database.py
│   │   └── main.py
│   ├── uploads/          # 업로드 파일
│   ├── venv/
│   ├── .env
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/   # React 컴포넌트
│   │   │   ├── AssetList.js
│   │   │   ├── IssueList.js
│   │   │   ├── Dashboard.js
│   │   │   ├── DashboardSettings.js
│   │   │   ├── Top3Widgets.js
│   │   │   ├── Login.js
│   │   │   ├── Navbar.js
│   │   │   └── ...
│   │   ├── contexts/     # Context API
│   │   │   └── AuthContext.js
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   ├── .env
│   └── package.json
│
├── .gitignore
├── README.md
├── DEPLOYMENT_GUIDE.md
└── FINAL_CHECKLIST.md
```

---

## 🌐 주요 API 엔드포인트

### 인증
- `POST /api/auth/login` - 로그인
- `POST /api/auth/register` - 회원가입

### 자산 관리
- `GET /api/assets` - 자산 목록 조회
- `POST /api/assets` - 자산 등록
- `GET /api/assets/{id}` - 자산 상세 조회
- `PUT /api/assets/{id}` - 자산 수정
- `DELETE /api/assets/{id}` - 자산 삭제
- `POST /api/assets/bulk-delete` - 일괄 삭제

### 장애 처리
- `GET /api/issues` - 장애 목록 조회
- `POST /api/issues` - 장애 등록
- `GET /api/issues/{id}` - 장애 상세 조회
- `PUT /api/issues/{id}` - 장애 수정
- `DELETE /api/issues/{id}` - 장애 삭제
- `POST /api/issues/bulk-delete` - 일괄 삭제

### 통계 & 대시보드
- `GET /api/statistics/dashboard` - 대시보드 통계
- `GET /api/statistics/assignee-workload` - 담당자별 업무 현황
- `GET /api/statistics/old-unresolved-issues` - 오래된 미해결 장애
- `GET /api/statistics/period-comparison` - 기간별 비교
- `GET /api/dashboard-config` - 위젯 설정

### 기타
- `GET /api/categories` - 카테고리 목록
- `GET /api/locations` - 위치 목록
- `GET /api/notifications/unread-count` - 미읽음 알림 개수
- `POST /api/reports/generate` - 보고서 생성
- `GET /api/qr/{asset_id}` - QR 코드 생성

**전체 API 문서:** http://localhost:8000/docs

---

## 🚀 배포

상세한 배포 가이드는 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)를 참조하세요.

### 프로덕션 배포 체크리스트

**필수 설정:**
- [ ] 환경 변수 설정 (`.env` 파일)
- [ ] JWT SECRET_KEY 새로 생성
- [ ] MySQL 비밀번호 설정
- [ ] CORS 도메인 설정
- [ ] 관리자 비밀번호 변경

**배포 준비:**
- [ ] 프론트엔드 빌드 (`npm run build`)
- [ ] requirements.txt 업데이트
- [ ] HTTPS 인증서 준비
- [ ] 방화벽 설정
- [ ] 백업 전략 수립

**배포 옵션:**
- AWS EC2 + RDS (추천)
- Docker 컨테이너
- VPS (Virtual Private Server)
- 로컬 서버

---

## 🔜 향후 계획

- [ ] 모바일 앱 (React Native)
- [ ] 실시간 채팅 (WebSocket)
- [ ] 이메일 알림
- [ ] 자동 백업 시스템
- [ ] API Rate Limiting
- [ ] 로그 분석 대시보드
- [ ] 다국어 지원
- [ ] SSO (Single Sign-On) 통합

---

## 🐛 문제 해결

### 데이터베이스 연결 실패
- `.env` 파일의 `DATABASE_URL` 확인
- MySQL 서비스 실행 확인
- 데이터베이스 생성 확인
- 비밀번호에 특수문자가 있다면 URL 인코딩 필요
  - `@` → `%40`
  - `!` → `%21`

### CORS 에러
- `.env` 파일의 `CORS_ORIGINS` 확인
- 프론트엔드 URL이 정확한지 확인

### JWT 토큰 에러
- `.env` 파일의 `SECRET_KEY` 설정 확인
- 다시 로그인 시도

### 빌드 실패
- Node.js 버전 확인 (18 이상)
- `node_modules` 삭제 후 재설치
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

---

## 📝 라이선스

MIT License

---

## 👨‍💻 개발자

**규호** - IT 담당자

---

## 📞 문의 및 지원

프로젝트에 대한 문의사항이나 버그 리포트는 GitHub Issues를 이용해주세요.

**GitHub Repository:** https://github.com/kyuho-lee/workhelper

---

## 🙏 감사의 말

이 프로젝트는 중소기업의 IT 자산 관리를 효율화하고 장애 처리 프로세스를 개선하기 위해 개발되었습니다.

---

**Made with ❤️ by 규호**