@echo off
cd /d "%~dp0"
title OpenGrant Setup
color 0A

echo.
echo  ==========================================
echo   OpenGrant  -  First Time Setup
echo  ==========================================
echo.

REM ── 1. Python check ────────────────────────────────────────────────────────
python --version >nul 2>&1
if errorlevel 1 (
    py --version >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Python not found!
        echo.
        echo  Install Python 3.10 or newer from:
        echo  https://python.org/downloads
        echo.
        echo  IMPORTANT: During install, check the box
        echo  "Add Python to PATH"
        echo.
        pause
        exit /b 1
    )
    set PYTHON=py
) else (
    set PYTHON=python
)
for /f "tokens=*" %%v in ('%PYTHON% --version 2^>^&1') do echo [OK] %%v found

REM ── 2. Node.js check ───────────────────────────────────────────────────────
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
for /f %%v in ('node --version') do echo [OK] Node.js %%v found

REM ── 3. Create .env if missing ──────────────────────────────────────────────
if not exist "backend\.env" (
    if not exist "backend\.env.example" (
        echo [ERROR] backend\.env.example missing. Re-download the project.
        pause
        exit /b 1
    )
    copy "backend\.env.example" "backend\.env" >nul
    echo [OK] Created backend\.env from template
)

REM ── 4. Check if API key is set ─────────────────────────────────────────────
findstr /C:"YOUR_KEY_HERE" "backend\.env" >nul 2>&1
if not errorlevel 1 (
    echo.
    echo  ============================================================
    echo   ACTION REQUIRED - Set your FREE Groq API key:
    echo.
    echo   1. Open: https://console.groq.com
    echo   2. Sign up free ^> click "API Keys" ^> "Create API Key"
    echo   3. Copy the key (starts with gsk_...)
    echo   4. In the file that opens: replace YOUR_KEY_HERE with it
    echo   5. Save the file (Ctrl+S) then close it
    echo   6. Press any key here to continue
    echo  ============================================================
    echo.
    start "" notepad "%~dp0backend\.env"
    pause >nul
    echo.
    findstr /C:"YOUR_KEY_HERE" "backend\.env" >nul 2>&1
    if not errorlevel 1 (
        echo  [WARNING] Key still not set. You can set it later.
        echo  The app will not work until a valid API key is added.
        echo.
    ) else (
        echo [OK] API key set!
    )
)

REM ── 5. Install Python packages ─────────────────────────────────────────────
echo.
echo Installing Python packages...
%PYTHON% -m pip install --upgrade pip -q
%PYTHON% -m pip install -r "backend\requirements.txt"
if errorlevel 1 (
    echo.
    echo [ERROR] Python package install failed!
    echo.
    echo  Try running this window as Administrator, or run:
    echo  python -m pip install -r backend\requirements.txt
    echo.
    pause
    exit /b 1
)
echo [OK] Python packages installed

REM ── 6. Install Node packages ───────────────────────────────────────────────
echo.
echo Installing Node.js packages...
cd /d "%~dp0frontend"
call npm install
if errorlevel 1 (
    echo.
    echo [ERROR] npm install failed!
    echo  Try deleting the frontend\node_modules folder and retry.
    echo.
    cd /d "%~dp0"
    pause
    exit /b 1
)
cd /d "%~dp0"
echo [OK] Node.js packages installed

echo.
echo  ==========================================
echo   Setup complete!
echo.
echo   Now double-click START.bat to launch.
echo  ==========================================
echo.
pause
