@echo off

REM ============================================
REM STANDALONE WARNING SYSTEM - LOCAL DEMO
REM ============================================

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║  🚨 HAZARD ^& PMO STANDALONE SYSTEM - LOCAL DEMO SETUP     ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Check if Node is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 14+ first.
    echo.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js version:
node --version
echo ✅ npm version:
npm --version
echo.

REM Navigate to project directory
cd /d "%~dp0"

echo 📂 Current directory: %CD%
echo.

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing dependencies (this may take a minute)...
    call npm install
    echo ✅ Dependencies installed
    echo.
)

REM Start dev server
echo 🚀 Starting development server...
echo.
echo ════════════════════════════════════════════════════════════
echo.
echo   📍 ACCESS THE DEMO AT:
echo.
echo      🌐 http://localhost:3000
echo.
echo ════════════════════════════════════════════════════════════
echo.
echo   📋 TESTING QUICK STEPS:
echo.
echo   1️⃣  Click 'Hazard Input' tab
echo   2️⃣  Select TMA institution
echo   3️⃣  Click 5+ districts on map
echo   4️⃣  Click 'Submit Warning'
echo   5️⃣  Switch to 'PMO Dashboard' tab
echo   6️⃣  Click hazard and 'Issue Warning'
echo.
echo   🐛 DEBUGGING:
echo.
echo   • Press F12 to open DevTools
echo   • Go to Console tab to see logs
echo   • Check Network tab for errors
echo.
echo ════════════════════════════════════════════════════════════
echo.

call npm start
pause
