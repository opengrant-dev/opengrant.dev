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

REM ── 4. API Key popup ───────────────────────────────────────────────────────
findstr /C:"YOUR_KEY_HERE" "backend\.env" >nul 2>&1
if not errorlevel 1 (
    echo.
    echo  Opening API key setup...
    echo.

    powershell -NoProfile -Command ^
        "Add-Type -AssemblyName Microsoft.VisualBasic; " ^
        "$msg = 'Enter your FREE Groq API Key below.' + [char]13 + [char]10 + [char]13 + [char]10 + " ^
        "       'How to get it (takes 30 seconds):' + [char]13 + [char]10 + " ^
        "       '  1. Go to  https://console.groq.com' + [char]13 + [char]10 + " ^
        "       '  2. Sign up free (Google login works)' + [char]13 + [char]10 + " ^
        "       '  3. Click API Keys  >  Create API Key' + [char]13 + [char]10 + " ^
        "       '  4. Copy the key (starts with gsk_...)' + [char]13 + [char]10 + [char]13 + [char]10 + " ^
        "       'Paste it here:'; " ^
        "$k = [Microsoft.VisualBasic.Interaction]::InputBox($msg, 'OpenGrant Setup', ''); " ^
        "if ($k.Trim() -ne '') { " ^
        "    $c = Get-Content 'backend\\.env' -Raw -Encoding UTF8; " ^
        "    $c = $c -replace 'YOUR_KEY_HERE', $k.Trim(); " ^
        "    [System.IO.File]::WriteAllText((Resolve-Path 'backend\\.env'), $c, [System.Text.Encoding]::UTF8); " ^
        "    Write-Host '[OK] API key saved successfully!'; " ^
        "} else { " ^
        "    Write-Host '[WARNING] No key entered. Set it later in backend\.env'; " ^
        "}"

    echo.
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
