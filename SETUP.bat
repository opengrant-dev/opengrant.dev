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
    echo  Install Python 3.10+ from: https://python.org/downloads
    echo  IMPORTANT: Check "Add Python to PATH" during install!
    echo.
    pause
    exit /b 1
)
for /f "tokens=2 delims= " %%v in ('python --version 2^>^&1') do set PYVER=%%v
echo [OK] Python %PYVER% found

REM --- Node.js check ---
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found!
    echo.
    echo  Install Node.js 18+ from: https://nodejs.org
    echo.
    pause
    exit /b 1
)
for /f %%v in ('node --version 2^>^&1') do set NODEVER=%%v
echo [OK] Node.js %NODEVER% found
echo.

REM --- .env setup: copy if missing ---
if not exist backend\.env (
    copy backend\.env.example backend\.env >nul
)

REM --- Loop until API key is actually set ---
:check_key
findstr /C:"YOUR_KEY_HERE" backend\.env >nul 2>&1
if not errorlevel 1 (
    echo.
    echo  ==========================================
    echo   STEP NEEDED: Add your FREE API key
    echo.
    echo   1. Go to: https://console.groq.com
    echo   2. Sign up free, click "API Keys", create one
    echo   3. Copy the key  (starts with gsk_...)
    echo   4. In the Notepad window that opens:
    echo      Replace  YOUR_KEY_HERE  with your key
    echo   5. Save the file  (Ctrl+S)
    echo   6. Close Notepad
    echo   7. Press any key HERE to continue
    echo  ==========================================
    echo.
    start /wait notepad "%~dp0backend\.env"
    findstr /C:"YOUR_KEY_HERE" backend\.env >nul 2>&1
    if not errorlevel 1 (
        echo.
        echo  [!] Key not saved yet. Please try again.
        goto check_key
    )
)
echo [OK] API key is set

REM --- Python packages ---
echo.
echo Installing Python packages (1-3 min)...
python -m pip install --upgrade pip --quiet
python -m pip install -r backend\requirements.txt
if errorlevel 1 (
    echo.
    echo [ERROR] Python install failed! Try running as Administrator.
    pause
    exit /b 1
)
echo [OK] Python packages done

REM --- Node packages ---
echo.
echo Installing Node.js packages (1-3 min)...
cd frontend
call npm install --silent
if errorlevel 1 (
    echo.
    echo [ERROR] npm install failed! Check internet and retry.
    cd ..
    pause
    exit /b 1
)
cd ..
echo [OK] Node.js packages done

echo.
echo  ==========================================
echo   Setup Complete! Launching OpenGrant...
echo  ==========================================
echo.
timeout /t 2 /nobreak >nul

REM --- Launch app immediately after setup ---
call "%~dp0START.bat"
