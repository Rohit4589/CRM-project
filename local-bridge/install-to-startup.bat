@echo off
title Modern Interior - Install Bridge to Windows Startup
color 0B

echo ========================================================
echo   MODERN INTERIOR - AUTO-STARTUP INSTALLER
echo ========================================================
echo.
echo Setting up Folder Bridge to automatically start when
echo this computer turns on...
echo.

set "SCRIPT_DIR=%~dp0"
set "VBS_TARGET=%SCRIPT_DIR%start-bridge-silent.vbs"
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_PATH=%STARTUP_FOLDER%\ModernInteriorBridge.lnk"

powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT_PATH%'); $s.TargetPath = 'wscript.exe'; $s.Arguments = '\"%VBS_TARGET%\"'; $s.WorkingDirectory = '%SCRIPT_DIR%'; $s.Save()"

if exist "%SHORTCUT_PATH%" (
    echo [SUCCESS] Auto-startup shortcut created successfully!
    echo Location: "%SHORTCUT_PATH%"
    echo.
    echo Starting the Folder Bridge right now...
    start "" wscript.exe "%VBS_TARGET%"
    echo [RUNNING] Modern Interior Folder Bridge is now active in the background!
    echo.
) else (
    echo [WARNING] Could not create startup shortcut automatically.
    echo You can double-click "start-bridge.bat" to start it manually.
)

pause
