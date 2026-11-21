@echo off
title Install Dependencies
cd /d "%~dp0"

echo ========================================================
echo   Installing Dependencies from requirements.txt
echo ========================================================
echo.

py -m pip install --upgrade pip 2>nul || python -m pip install --upgrade pip
py -m pip install -r requirements.txt || python -m pip install -r requirements.txt

if errorlevel 1 (
    echo.
    echo [ERROR] Installation failed.
    echo.
) else (
    echo.
    echo ========================================================
    echo   [SUCCESS] All dependencies installed successfully!
    echo   You can now run START_API.bat
    echo ========================================================
    echo.
)
pause
