@echo off
echo ====================================
echo WorkHelper Clean Build
echo ====================================
echo.

echo [1/4] 기존 빌드 폴더 삭제 중...
if exist build rmdir /s /q build
echo 빌드 폴더 삭제 완료!
echo.

echo [2/4] 캐시 폴더 삭제 중...
if exist node_modules\.cache rmdir /s /q node_modules\.cache
echo 캐시 폴더 삭제 완료!
echo.

echo [3/4] 새로운 빌드 시작...
call npm run build
echo.

if errorlevel 1 (
    echo [ERROR] 빌드 실패!
    echo ====================================
    pause
    exit /b 1
)

echo [4/4] 빌드 완료!
echo ====================================
echo 빌드 결과: C:\workhelper\frontend\build
echo.
pause