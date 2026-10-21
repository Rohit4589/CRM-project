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
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not found in PATH!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

node server.js

if %errorlevel% neq 0 (
    echo.
    echo Server stopped with error.
    pause
)
