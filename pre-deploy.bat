@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo 🚀 Running Pre-deployment Checks and Verification
echo ===================================================

echo.
echo 🧹 [Step 1/7] Cleaning Build Directories...
call npm run clean
if %ERRORLEVEL% neq 0 (
    echo ❌ Clean failed!
    exit /b %ERRORLEVEL%
)

echo.
echo 🔍 [Step 2/7] Running Code Linter...
call npm run lint
if %ERRORLEVEL% neq 0 (
    echo ❌ Lint check failed! Please fix the errors before deploying.
    exit /b %ERRORLEVEL%
)

echo.
echo 🧪 [Step 3/7] Running Jest Unit Tests (Fast Mode)...
call npm test
if %ERRORLEVEL% neq 0 (
    echo ❌ Fast unit tests failed!
    exit /b %ERRORLEVEL%
)

echo.
echo 📊 [Step 4/7] Running Jest Unit Tests with Coverage Gates...
call npm run test:coverage
if %ERRORLEVEL% neq 0 (
    echo ❌ Coverage tests or coverage gates failed!
    exit /b %ERRORLEVEL%
)

echo.
echo 🌐 [Step 5/7] Running Playwright E2E Browser Tests...
call npm run test:e2e
if %ERRORLEVEL% neq 0 (
    echo ❌ E2E browser tests failed!
    exit /b %ERRORLEVEL%
)

echo.
echo 🔥 [Step 6/7] Deploying Firestore Rules and Indexes...
call firebase deploy --only firestore
if %ERRORLEVEL% neq 0 (
    echo ❌ Firebase deployment failed!
    exit /b %ERRORLEVEL%
)

echo.
echo 📦 [Step 7/7] Compiling Production Build...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo ❌ Next.js build compilation failed!
    exit /b %ERRORLEVEL%
)

echo.
echo ===================================================
echo 🎉 Pre-deployment verification and firebase push completed!
echo ===================================================
