@echo off
title UNSTUCK - Unified Launcher
cd /d "%~dp0"
set PYTHONIOENCODING=utf-8

echo ========================================================
echo   UNSTUCK PLATFORM - FULL STACK LAUNCHER
echo   Frontend (React/Vite) + Backend (FastAPI Scrapers)
echo ========================================================
echo.

:: Ensure Node is in PATH
set "PATH=C:\Program Files\nodejs;%PATH%"

:: 1. Launch FastAPI Backend in a separate window
echo [1/3] Starting Backend API (Port 8000)...
start "UNSTUCK Backend API (Port 8000)" cmd /k "cd /d ""%~dp0backend"" && (py -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload || python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload)"

:: Give backend 2 seconds to initialize
timeout /t 2 /nobreak >nul

:: 2. Launch browser
echo [2/3] Launching Web Interface...
start http://localhost:5173

:: 3. Launch Frontend dev server
echo [3/3] Starting Frontend Dev Server (Port 5173)...
echo.
echo ========================================================
echo   UNSTUCK is running!
echo   - Frontend: http://localhost:5173
echo   - API Docs: http://localhost:8000/docs
echo   - n8n Flow: http://localhost:5678
echo ========================================================
echo.
cd /d "%~dp0frontend"
call npm run dev
pause
