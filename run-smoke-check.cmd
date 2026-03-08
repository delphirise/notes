@echo off
setlocal
pushd "%~dp0"
powershell -ExecutionPolicy Bypass -File ".\smoke-check.ps1"
set EXIT_CODE=%ERRORLEVEL%
if not "%EXIT_CODE%"=="0" (
  echo.
  echo Smoke check failed with exit code %EXIT_CODE%.
) else (
  echo.
  echo Smoke check passed.
)
echo.
pause
popd
exit /b %EXIT_CODE%
