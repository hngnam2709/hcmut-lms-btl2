@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo ============================================
echo  HCMUT LMS BTL2 - setup
echo ============================================
echo.

where uv >nul 2>&1
if errorlevel 1 (
  echo [ERROR] uv is not installed or not on PATH.
  echo Install uv from https://docs.astral.sh/uv/ and run this file again.
  echo The application itself runs offline after dependencies are installed once.
  pause
  exit /b 1
)

if not exist ".env" (
  copy ".env.example" ".env" >nul
  echo [INFO] Created .env from .env.example. Edit it before starting the app.
) else (
  echo [INFO] Keeping the existing .env file.
)

if exist ".venv" (
  echo [INFO] Synchronizing the existing Python environment...
  uv sync --offline
  if errorlevel 1 (
    echo [WARN] Offline sync failed; retrying with network access.
    uv sync
  )
) else (
  echo [INFO] Creating the Python environment...
  uv sync
)

if errorlevel 1 (
  echo [ERROR] Python dependencies could not be installed.
  pause
  exit /b 1
)

echo.
echo Setup complete.
echo.
echo Next steps:
echo   1. Edit .env with your MySQL host/user/password.
echo   2. Create and seed the database:
echo        mysql -u root -p ^< database\run_all.sql
echo      or for a disposable database:
echo        mysql -u root -p ^< database\reset_database.sql
echo        mysql -u root -p ^< database\run_all.sql
echo   3. Run check_environment.bat
echo   4. Run run.bat and open http://127.0.0.1:5000
echo.
pause
