@echo off
echo Starting Intelligent Onboarding System...
echo.

REM Start backend in first window
echo Starting Backend on http://localhost:3001
start "Backend Server" cmd /k "cd backend && node server.js"

REM Wait a moment for backend to start
timeout /t 3 /nobreak

REM Start frontend in second window
echo Starting Frontend on http://localhost:5173
start "Frontend Server" cmd /k "cd frontend && node node_modules/vite/bin/vite.js"

echo.
echo Both servers are starting in separate windows!
echo - Backend: http://localhost:3001
echo - Frontend: http://localhost:5173
echo.
pause
