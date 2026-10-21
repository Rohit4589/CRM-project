' Modern Interior - Silent Startup Script
' Runs start-bridge.bat completely hidden in background without any popup window

Set WshShell = CreateObject("WScript.Shell")
strPath = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = strPath
WshShell.Run "cmd /c """ & strPath & "\start-bridge.bat""", 0, False
Set WshShell = Nothing
