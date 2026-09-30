@echo off
title SATYAPAN Local Launcher
echo ========================================================
echo       Starting SATYAPAN Border Defense System
echo ========================================================
echo.

echo [1/2] Starting Backend API Server (Port 8000)...
start "SATYAPAN Backend API" cmd /k "cd /d %~dp0backend && python satyapan_unified_api.py"

echo [2/2] Starting Frontend Vite Server (Port 5173)...
start "SATYAPAN Frontend UI" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers are launching!
echo  - Frontend: http://localhost:5173
echo  - Backend:  http://127.0.0.1:8000
echo.
pause
