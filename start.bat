@echo off
echo Starting Study Spark Learning Platform...
echo.
echo This will start both the frontend and backend servers.
echo.
echo Press Ctrl+C to stop both servers.
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo Starting servers...
echo Frontend: http://localhost:5173
echo Backend: http://localhost:8787
echo.

REM Start both servers concurrently
npm run dev:all
