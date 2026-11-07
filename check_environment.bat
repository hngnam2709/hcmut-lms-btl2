@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
set "FAIL=0"

echo ============================================
echo  HCMUT LMS BTL2 - environment check
echo ============================================
echo.

call :check_command "Python" python
if not errorlevel 1 (
  python -c "import sys; raise SystemExit(0 if sys.version_info >= (3,12) else 1)" >nul 2>&1
  if errorlevel 1 (
    echo [FAIL] Python 3.12 or newer is required.
    set "FAIL=1"
  ) else (
    python --version
  )
)

call :check_command "uv" uv
if not errorlevel 1 uv --version

call :check_command "MySQL client" mysql
call :check_command "Docker optional" docker

if not exist ".env" (
  echo [WARN] .env is missing. Run setup.bat, then edit .env.
) else (
  echo [ OK ] .env exists.
)

if exist "frontend\vendor\bootstrap\bootstrap.min.css" (
  echo [ OK ] Local Bootstrap CSS is present.
) else (
  echo [FAIL] Missing frontend\vendor\bootstrap\bootstrap.min.css
  set "FAIL=1"
)

if exist "frontend\vendor\bootstrap\bootstrap.bundle.min.js" (
  echo [ OK ] Local Bootstrap JS is present.
) else (
  echo [FAIL] Missing frontend\vendor\bootstrap\bootstrap.bundle.min.js
  set "FAIL=1"
)

if exist "frontend\index.html" (
  echo [ OK ] Frontend entry point is present.
) else (
  echo [FAIL] Missing frontend\index.html
  set "FAIL=1"
)

if exist ".venv" (
  echo [ OK ] Python virtual environment (.venv) exists.
) else (
  echo [WARN] .venv is missing. Run setup.bat.
)

echo.
if "%FAIL%"=="0" (
  echo Environment check: PASS
) else (
  echo Environment check: FAIL
)
echo.
if "%~1"=="" pause
exit /b %FAIL%

:check_command
where %~2 >nul 2>&1
if errorlevel 1 (
  echo [WARN] %~1 was not found on PATH.
) else (
  echo [ OK ] %~1 is available.
)
exit /b 0
