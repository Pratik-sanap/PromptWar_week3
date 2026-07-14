@echo off
echo ===================================================
echo Running Backend Python Unit and Integration Tests...
echo ===================================================
python -m pytest
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Backend tests failed!
    exit /b %ERRORLEVEL%
)

echo.
echo ===================================================
echo Running Frontend React Vitest Unit Tests...
echo ===================================================
npm --prefix frontend run test
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Frontend tests failed!
    exit /b %ERRORLEVEL%
)

echo.
echo ===================================================
echo [SUCCESS] All backend and frontend tests passed successfully!
echo ===================================================
exit /b 0
