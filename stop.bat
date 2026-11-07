@echo off
setlocal EnableExtensions
cd /d "%~dp0"
set "PORT=%~1"
if "%PORT%"=="" set "PORT=5000"

echo Looking for a listening process on port %PORT%...
set "FOUND=0"
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":%PORT%" ^| findstr "LISTENING"') do (
  echo Stopping PID %%P
  taskkill /PID %%P /F >nul 2>&1
  set "FOUND=1"
)
if "%FOUND%"=="0" (
  echo No listening process was found on port %PORT%.
) else (
  echo Stop command completed.
)
if "%~1"=="" pause
