@echo off
cd /d "%~dp0"
title OpenGrant
color 0B

REM ── Check setup was done ───────────────────────────────────────────────────
if not exist "backend\.env" (
    echo Run SETUP.bat first!
    pause
    exit /b 1
)
if not exist "frontend\node_modules" (
    echo Run SETUP.bat first to install packages!
    pause
    exit /b 1
)

REM ── Start backend ─────────────────────────────────────────────────────────
echo Starting OpenGrant...
start "OpenGrant Backend" cmd /k "cd backend && python main.py"

REM ── Wait then start frontend ───────────────────────────────────────────────
timeout /t 3 /nobreak >nul
start "OpenGrant Frontend" cmd /k "cd frontend && npm run dev"

REM ── Open browser ──────────────────────────────────────────────────────────
timeout /t 5 /nobreak >nul
start http://localhost:5173

echo.
echo  OpenGrant is running!
echo  Website:  http://localhost:5173
echo  API docs: http://localhost:8765/docs
echo.
echo  Close the Backend and Frontend windows to stop.
echo.
exit
