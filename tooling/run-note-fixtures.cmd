@echo off
setlocal
pushd "%~dp0"

echo Running runtime note fixtures...

set "NODE_EXE=node"
where node >nul 2>nul
if errorlevel 1 (
  if exist "C:\nodejs\node.exe" (
    set "NODE_EXE=C:\nodejs\node.exe"
  ) else (
    echo Node.js is not available on PATH.
    echo Expected fallback was not found at C:\nodejs\node.exe
    echo Install Node.js or add it to PATH, then run this script again.
    exit /b 1
  )
)

"%NODE_EXE%" .\tests\run-note-fixtures.mjs
set EXITCODE=%ERRORLEVEL%

if not "%EXITCODE%"=="0" (
  echo.
  echo Runtime fixture checks failed.
  echo If you see a Playwright install error, run:
  echo   npm i -D playwright
  echo   npx playwright install chromium
  popd
  exit /b %EXITCODE%
)

echo.
echo Runtime fixture checks passed.
popd
exit /b 0
