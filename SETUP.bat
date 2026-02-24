@echo off
title OpenGrant Setup
color 0A
echo.
echo  ==========================================
echo   OpenGrant - First Time Setup
echo  ==========================================
echo.
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found!
    echo Install from: https://python.org
    echo Check "Add Python to PATH" during install!
    pause
    exit /b 1
)
echo [OK] Python found
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found!
    echo Install from: https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js found
if not exist backend\.env (
    copy backend\.env.example backend\.env >nul
    echo.
    echo  ==========================================
    echo   ACTION NEEDED:
    echo   1. Open file: backend\.env
    echo   2. Replace: your_api_key_here
    echo   3. With your FREE Groq key from:
    echo      https://console.groq.com
    echo   4. Save, then press any key here
    echo  ==========================================
    echo.
    pause >nul
)
echo [OK] Config ready
echo.
echo Installing Python packages (1-2 min)...
pip install -r backend\requirements.txt -q
if errorlevel 1 (
    echo [ERROR] pip install failed
    pause
    exit /b 1
)
echo [OK] Python packages done
echo.
echo Installing Node.js packages (1-2 min)...
cd frontend
call npm install --silent
if errorlevel 1 (
    echo [ERROR] npm install failed
    cd ..
    pause
    exit /b 1
)
cd ..
echo [OK] Node.js packages done
echo.
echo  ==========================================
echo   Setup Complete!
echo   Now double-click START.bat to launch.
echo  ==========================================
echo.
pause
