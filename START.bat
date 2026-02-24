@echo off
title OpenGrant
color 0B

REM --- If setup not done yet, run setup first ---
if not exist backend\.env (
    echo Run SETUP.bat first to get started!
    pause
    exit /b 1
)
if not exist frontend\node_modules (
    echo Run SETUP.bat first to get started!
    pause
    exit /b 1
)

echo.
echo  Starting OpenGrant...
echo.

start "OpenGrant Backend" cmd /k "cd /d %~dp0backend && python main.py"
timeout /t 4 /nobreak >nul
start "OpenGrant Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 4 /nobreak >nul
start http://localhost:5173

echo  Done! Website: http://localhost:5173
echo  To stop: close the two windows that opened.
echo.
exit
