@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
title OpenGrant - Hacker Terminal
color 0B

REM ── Check setup was done ───────────────────────────────────────────────────
if not exist "backend\.env" (
    echo.
    echo  [ERROR] Run SETUP.bat first!
    echo.
    pause
    exit /b 1
)
if not exist "frontend\node_modules" (
    echo.
    echo  [ERROR] Run SETUP.bat first to install packages!
    echo.
    pause
    exit /b 1
)

cls
echo.
echo  ╔════════════════════════════════════════════════════════════╗
echo  ║   OpenGrant — Launching Backend + Frontend                 ║
echo  ╚════════════════════════════════════════════════════════════╝
echo.

REM ── Start backend with uvicorn (proper FastAPI server) ──────────────────────
echo  [*] Starting Backend on port 8765...
start "OpenGrant Backend" cmd /k "cd /d "%~dp0backend" && python -m uvicorn main:app --host 0.0.0.0 --port 8765 --reload"

REM ── Wait for backend to be ready (increased timeout) ──────────────────────────
echo  [*] Waiting 6 seconds for backend to start...
timeout /t 6 /nobreak >nul

REM ── Start frontend ────────────────────────────────────────────────────────────
echo  [*] Starting Frontend on port 5173...
start "OpenGrant Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

REM ── Wait for frontend to be ready ──────────────────────────────────────────────
echo  [*] Waiting 5 seconds for frontend to start...
timeout /t 5 /nobreak >nul

REM ── Open browser to localhost ─────────────────────────────────────────────────
echo  [+] Opening browser...
start http://localhost:5173

echo.
echo  ╔════════════════════════════════════════════════════════════╗
echo  ║   OpenGrant is now running!                                ║
echo  ║                                                            ║
echo  ║   Website:   http://localhost:5173                         ║
echo  ║   API Docs:  http://localhost:8765/docs                   ║
echo  ║   API:       http://localhost:8765                         ║
echo  ║                                                            ║
echo  ║   Close the Backend and Frontend windows to stop.          ║
echo  ╚════════════════════════════════════════════════════════════╝
echo.
exit
