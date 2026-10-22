@echo off
title Modern Interior - Folder Bridge Server
color 0A

echo ======================================================
echo    MODERN INTERIOR - OFFICE CPU FOLDER BRIDGE
echo ======================================================
echo.

cd /d "%~dp0"

:: 1. Verify files are properly extracted from ZIP
if not exist "%~dp0bridge.ps1" (
    echo [ERROR] bridge.ps1 was not found in: "%~dp0"
    echo.
    echo It looks like you ran this from inside the ZIP file!
    echo Please right-click ModernInterior-FolderBridge.zip,
    echo click "Extract All", and run start-bridge.bat from the extracted folder.
    echo.
    pause
    exit /b 1
)

:: 2. Check if a real Node.js installation exists
set "USE_NODE=0"
node -v >nul 2>nul
if %errorlevel% equ 0 (
    if exist "%~dp0server.js" (
        set "USE_NODE=1"
    )
)

if "%USE_NODE%"=="1" (
    echo [OK] Using Node.js runtime on port 5001...
    echo.
    node "%~dp0server.js"
) else (
    echo [OK] Using Windows PowerShell runtime (Zero-install)...
    echo.
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0bridge.ps1"
)

echo.
echo ======================================================
echo [STOPPED] Bridge process has finished or was stopped.
echo ======================================================
echo.
pause
