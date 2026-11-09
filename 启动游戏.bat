@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 握拳出击
where python >nul 2>nul
if errorlevel 1 (
  echo 未检测到 Python，请先安装 Python 3 并勾选 Add to PATH
  pause
  exit /b 1
)
start "握拳出击 本地服务器" cmd /c "python _server.py"
powershell -NoProfile -Command "Start-Sleep -Seconds 3; Start-Process 'http://localhost:8010/'"
exit /b 0
