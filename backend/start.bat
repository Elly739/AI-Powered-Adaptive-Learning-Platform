@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":8000" ^| findstr /R "LISTENING"') do (
    echo Detected stale process on port 8000 (PID %%P). Clearing it...
    taskkill /PID %%P /F >nul 2>&1
)

start /b python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
