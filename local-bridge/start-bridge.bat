@echo off
title Modern Interior - Folder Bridge Server
color 0A

echo ======================================================
echo    MODERN INTERIOR - OFFICE CPU FOLDER BRIDGE
echo ======================================================
echo.
echo Starting bridge on http://127.0.0.1:5001 ...
echo.

cd /d "%~dp0"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0bridge.ps1"

echo.
echo ======================================================
echo Bridge stopped.
echo ======================================================
pause
