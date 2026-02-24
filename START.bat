@echo off
title OpenGrant
color 0B
echo.
echo  ==========================================
echo   OpenGrant - Launching
echo  ==========================================
echo.
if not exist backend\.env (
    echo [ERROR] Run SETUP.bat first!
    pause
    exit /b 1
)
findstr "your_api_key_here" backend\.env >nul 2>&1
if not errorlevel 1 (
    echo [ERROR] API key not set in backend\.env
    echo Get free key at: https://console.groq.com
    echo.
    start notepad backend\.env
    pause
    exit /b 1
)
echo [OK] Config found. Starting...
echo.
echo Starting Backend API...
start "OpenGrant Backend" cmd /k "cd /d %~dp0backend && python main.py"
echo Starting Frontend...
timeout /t 3 /nobreak >nul
start "OpenGrant Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
echo Opening browser...
timeout /t 5 /nobreak >nul
start http://localhost:5173
echo.
echo  ==========================================
echo   OpenGrant is running!
echo   Website:  http://localhost:5173
echo   API Docs: http://localhost:8000/docs
echo  ==========================================
echo.
echo  To stop: close Backend and Frontend windows.
echo.
exit
