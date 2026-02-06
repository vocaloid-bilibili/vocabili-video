@echo off
cd /d "%~dp0"
echo 正在启动...
echo.
start "" cmd /c "timeout /t 2 >nul && start http://localhost:3002"
node server.js
pause
