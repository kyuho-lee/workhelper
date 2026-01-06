# WorkHelper - 업무 관리 시스템

중소기업을 위한 자산 및 장애 관리 시스템

## 🚀 주요 기능

- **자산 관리**: PC, 노트북, 네트워크 장비 등 자산 등록/수정/삭제/검색
- **장애 처리**: 장애 접수, 진행 상황 추적
- **대시보드**: 실시간 통계 및 현황 파악
- **반응형 디자인**: PC, 태블릿, 모바일 지원

### 자산 관리
- ✅ 자산 등록/수정/삭제
- ✅ 자산 검색 및 필터링
- ✅ 자산 상세 정보 조회
- ✅ QR 코드 생성 및 다운로드
- ✅ 엑셀 내보내기

### 장애 처리
- ✅ 장애 접수 및 관리
- ✅ 상태별 진행 상황 추적
- ✅ 우선순위 설정

### 대시보드
- ✅ 실시간 통계
- ✅ 분류별/상태별 차트
- ✅ 빠른 작업 링크

### UI/UX
- ✅ 반응형 디자인 (PC/태블릿/모바일)
- ✅ 다크 모드 지원
- ✅ 직관적인 인터페이스

## 🛠️ 기술 스택

### 백엔드
- **Python 3.12**
- **FastAPI** - 고성능 웹 프레임워크
- **SQLAlchemy** - ORM
- **MySQL** - 데이터베이스

### 프론트엔드
- **React 18**
- **Tailwind CSS** - UI 스타일링
- **React Router** - 라우팅
- **Axios** - HTTP 클라이언트

## 📋 사전 요구사항

- Python 3.12 이상
- Node.js 18 이상
- MySQL (또는 XAMPP)

## 🔧 설치 및 실행

### 1. 저장소 클론
```bash
git clone <repository-url>
cd workhelper
```

### 2. 백엔드 설정
```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux

# 패키지 설치
pip install -r requirements.txt

# 환경 변수 설정
# .env 파일을 생성하고 데이터베이스 정보 입력

# 서버 실행
uvicorn app.main:app --reload
```

백엔드 서버: http://localhost:8000
API 문서: http://localhost:8000/docs

### 3. 프론트엔드 설정
```bash
cd frontend

# 패키지 설치
npm install

# 개발 서버 실행
npm start
```

프론트엔드: http://localhost:3000

### 4. 데이터베이스 설정

MySQL에서 데이터베이스 생성:
```sql
CREATE DATABASE workhelper CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

## 📁 프로젝트 구조
```
workhelper/
├── backend/
│   ├── app/
│   │   ├── models/          # 데이터베이스 모델
│   │   ├── schemas/         # Pydantic 스키마
│   │   ├── api/             # API 라우터
│   │   ├── database.py      # DB 연결
│   │   └── main.py          # FastAPI 앱
│   ├── venv/
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React 컴포넌트
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   └── package.json
│
└── README.md
```

## 🌐 API 엔드포인트

### 자산 관리
- `GET /api/assets` - 자산 목록 조회
- `POST /api/assets` - 자산 등록
- `GET /api/assets/{id}` - 자산 상세 조회
- `PUT /api/assets/{id}` - 자산 수정
- `DELETE /api/assets/{id}` - 자산 삭제

### 장애 처리
- `GET /api/issues` - 장애 목록 조회
- `POST /api/issues` - 장애 등록
- `GET /api/issues/{id}` - 장애 상세 조회
- `PUT /api/issues/{id}` - 장애 수정
- `DELETE /api/issues/{id}` - 장애 삭제

## 🔜 향후 계획

- [ ] 사용자 인증 및 권한 관리
- [ ] QR 코드 생성 및 스캔
- [ ] 장애 처리 수정/삭제 기능
- [ ] 통계 차트 (Chart.js)
- [ ] 엑셀 내보내기
- [ ] 다크 모드
- [ ] 파일 업로드 (자산 이미지)
- [ ] 알림 기능
- [ ] 모바일 앱 (React Native)
- [ ] AWS 배포

## 📝 라이선스

MIT License

## 👨‍💻 개발자

전산 담당자

## 📧 문의

이슈 및 문의사항은 GitHub Issues를 이용해주세요.