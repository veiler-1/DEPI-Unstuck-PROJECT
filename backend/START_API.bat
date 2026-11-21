@echo off
title Freelance Scraper API
cd /d "%~dp0"
set PYTHONIOENCODING=utf-8

echo ========================================================
echo   Freelance Scrapers - FastAPI Server
echo ========================================================
echo.
echo   Dashboard:  http://localhost:8000
echo   Swagger:    http://localhost:8000/docs
echo   DB Status:  http://localhost:8000/api/db-status
echo.
echo   Listening on all network interfaces (0.0.0.0:8000)
echo   Press Ctrl+C to stop the server
echo ========================================================
echo.

py -m uvicorn main:app --host 0.0.0.0 --port 8000
if errorlevel 1 (
    python -m uvicorn main:app --host 0.0.0.0 --port 8000
)

if errorlevel 1 (
    echo.
    echo --------------------------------------------------------
    echo [ERROR] Failed to start server!
    echo Please make sure dependencies are installed:
    echo   Run: INSTALL_REQUIREMENTS.bat
    echo --------------------------------------------------------
    echo.
)

pause
