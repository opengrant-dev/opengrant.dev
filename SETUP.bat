@echo off
title OpenGrant Setup
color 0A
echo.
echo  ==========================================
echo   OpenGrant - First Time Setup
echo  ==========================================
echo.

REM --- Python check ---
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found!
    echo.
    echo  Install Python 3.10 or newer from:
    echo  https://python.org/downloads
    echo.
    echo  IMPORTANT: Check "Add Python to PATH"
    echo  during installation!
    echo.
    pause
    exit /b 1
)
for /f "tokens=2 delims= " %%v in ('python --version 2^>^&1') do set PYVER=%%v
echo [OK] Python %PYVER% found

REM --- Warn if Python is too old ---
for /f "tokens=1,2 delims=." %%a in ("%PYVER%") do (
    if %%a LSS 3 (
        echo [ERROR] Python 3.10+ required. You have %PYVER%
        pause
        exit /b 1
    )
    if %%a EQU 3 if %%b LSS 10 (
        echo [ERROR] Python 3.10+ required. You have %PYVER%
        echo.
        echo Download from: https://python.org/downloads
        pause
        exit /b 1
    )
)

REM --- Node.js check ---
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found!
    echo.
    echo  Install Node.js 18 or newer from:
    echo  https://nodejs.org
    echo.
    pause
    exit /b 1
)
for /f %%v in ('node --version 2^>^&1') do set NODEVER=%%v
echo [OK] Node.js %NODEVER% found

REM --- .env setup ---
if not exist backend\.env (
    if exist backend\.env.example (
        copy backend\.env.example backend\.env >nul
    ) else (
        echo [ERROR] backend\.env.example not found!
        echo Please re-download the project.
        pause
        exit /b 1
    )
    echo.
    echo  ==========================================
    echo   ACTION NEEDED:
    echo   1. Open file: backend\.env
    echo   2. Replace: your_api_key_here
    echo   3. With your FREE Groq key from https://console.groq.com:
    echo      https://console.groq.com
    echo   4. Save the file
    echo   5. Press any key here to continue
    echo  ==========================================
    echo.
    start notepad backend\.env
    pause >nul
)
echo [OK] Config file ready

REM --- pip upgrade ---
echo.
echo Upgrading pip...
python -m pip install --upgrade pip --quiet
echo [OK] pip up to date

REM --- Python packages ---
echo.
echo Installing Python packages (may take 1-3 minutes)...
echo If this fails, copy the error above and open an Issue on GitHub.
echo.
python -m pip install -r backend\requirements.txt
if errorlevel 1 (
    echo.
    echo [ERROR] Python package install failed!
    echo.
    echo Common fixes:
    echo  1. Run as Administrator
    echo  2. Check internet connection
    echo  3. Try: python -m pip install -r backend\requirements.txt
    echo.
    pause
    exit /b 1
)
echo [OK] Python packages installed

REM --- Node packages ---
echo.
echo Installing Node.js packages (may take 1-3 minutes)...
cd frontend
call npm install
if errorlevel 1 (
    echo.
    echo [ERROR] npm install failed!
    echo.
    echo Common fixes:
    echo  1. Delete frontend\node_modules folder and retry
    echo  2. Check internet connection
    echo  3. Try running: cd frontend ^&^& npm install
    echo.
    cd ..
    pause
    exit /b 1
)
cd ..
echo [OK] Node.js packages installed

echo.
echo  ==========================================
echo   Setup Complete!
echo   Now double-click START.bat to launch.
echo  ==========================================
echo.
pause
