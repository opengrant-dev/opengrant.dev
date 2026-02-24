@echo off
title OpenGrant
color 0B
echo.
echo  ==========================================
echo   OpenGrant - Starting Up
echo  ==========================================
echo.

REM --- Check setup was done ---
if not exist backend\.env (
    echo [ERROR] Setup not done yet!
    echo.
    echo  Please double-click SETUP.bat first.
    echo.
    pause
    exit /b 1
)

REM --- Check API key is set ---
findstr /C:"YOUR_KEY_HERE" backend\.env >nul 2>&1
if not errorlevel 1 (
    echo [ERROR] API key not configured!
    echo.
    echo  1. Open: backend\.env
    echo  2. Replace "your_api_key_here" with your real key
    echo  3. Get a FREE key at: https://console.groq.com
    echo.
    start notepad backend\.env
    pause
    exit /b 1
)

REM --- Check Python ---
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Run SETUP.bat first.
    pause
    exit /b 1
)

REM --- Check node_modules ---
if not exist frontend\node_modules (
    echo [ERROR] Node packages not installed. Run SETUP.bat first.
    pause
    exit /b 1
)

echo [OK] All checks passed. Starting...
echo.

REM --- Start backend in a window that stays open on crash ---
echo Starting Backend API (port 8000)...
start "OpenGrant Backend" cmd /k "cd /d %~dp0backend && echo Starting backend... && python main.py || (echo. && echo [ERROR] Backend crashed! && echo Check the error above. && echo Common fixes: && echo   1. Check backend\.env has correct API key && echo   2. Run SETUP.bat again && echo   3. Make sure port 8000 is not already in use && pause)"

REM --- Wait for backend to initialize ---
echo Waiting for backend to start...
timeout /t 4 /nobreak >nul

REM --- Start frontend ---
echo Starting Frontend (port 5173)...
start "OpenGrant Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

REM --- Open browser ---
echo Opening browser...
timeout /t 4 /nobreak >nul
start http://localhost:5173

echo.
echo  ==========================================
echo   OpenGrant is running!
echo.
echo   Website:  http://localhost:5173
echo   API Docs: http://localhost:8000/docs
echo.
echo   To stop: close the Backend and Frontend
echo   windows that just opened.
echo  ==========================================
echo.
exit
