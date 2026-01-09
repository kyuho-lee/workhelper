@echo off
chcp 65001 > nul
echo ====================================
echo WorkHelper AWS 배포 프로세스
echo ====================================
echo.

echo [1/6] 프론트엔드 디렉토리로 이동...
cd C:\workhelper\frontend
echo.

echo [2/6] 기존 빌드 삭제...
if exist build rmdir /s /q build
if exist node_modules\.cache rmdir /s /q node_modules\.cache
echo 삭제 완료!
echo.

echo [3/6] 새로운 빌드 시작...
call npm run build
if errorlevel 1 (
    echo [ERROR] 빌드 실패!
    pause
    exit /b 1
)
echo 빌드 완료!
echo.

echo [4/6] Git 변경사항 추가...
cd C:\workhelper
git add .
echo.

echo [5/6] Git 커밋...
set commit_msg=Deploy: %date% %time%
git commit -m "%commit_msg%"
echo.

echo [6/6] Git Push...
git push origin main
echo.

echo ====================================
echo 배포 완료!
echo ====================================
echo.
echo 다음 단계:
echo 1. EC2에 SSH 접속
echo 2. cd /home/ubuntu/workhelper
echo 3. git pull origin main
echo 4. 백엔드/프론트엔드 재시작
echo.
pause