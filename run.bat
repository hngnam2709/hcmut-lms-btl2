@echo off
setlocal EnableExtensions
cd /d "%~dp0"

if not exist ".venv" (
  echo [ERROR] .venv is missing. Run setup.bat first.
  pause
  exit /b 1
)
if not exist ".env" (
  echo [WARN] .env is missing. Copying .env.example to .env.
  copy ".env.example" ".env" >nul
)

if "%FLASK_RUN_HOST%"=="" set "FLASK_RUN_HOST=127.0.0.1"
if "%FLASK_RUN_PORT%"=="" set "FLASK_RUN_PORT=5000"

echo Starting HCMUT LMS BTL2 at http://%FLASK_RUN_HOST%:%FLASK_RUN_PORT%
echo Press Ctrl+C to stop.
echo.
start "" /B cmd /c "timeout /t 2 >nul & start http://%FLASK_RUN_HOST%:%FLASK_RUN_PORT%"
uv run python run.py
