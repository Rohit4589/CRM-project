@echo off
title Modern Interior - Folder Bridge Server
color 0A

echo ======================================================
echo    MODERN INTERIOR - OFFICE CPU FOLDER BRIDGE
echo ======================================================
echo.
echo Starting local bridge for F:\ drive folder creation...
echo.

cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Using Node.js runtime...
    node server.js
) else (
    echo [OK] Using Native Windows PowerShell runtime (No Node.js needed)...
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0bridge.ps1"
)

if %errorlevel% neq 0 (
    echo.
    echo Server stopped with error.
    pause
)
