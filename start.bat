@echo off
echo Starting Knowledge Nexus AI...

:: 0. Cleanup existing processes
echo [0/3] Stopping existing processes...
taskkill /F /IM node.exe > nul 2>&1
taskkill /F /IM python.exe > nul 2>&1

:: 1. Start Ollama in the background
echo [1/3] Starting Local Ollama Server...
set OLLAMA_MODELS=D:\ollama_models
start /B "Ollama" ollama serve > nul 2>&1

:: Wait a few seconds for Ollama to boot
timeout /t 3 /nobreak > nul

:: 2. Start the FastAPI Backend in a new window
echo [2/3] Starting Python Backend Server...
cd D:\knowledge-nexus-ai\backend
start "Knowledge Nexus Backend" cmd /k "call .\venv\Scripts\activate.bat && uvicorn main:app --host 0.0.0.0 --port 8000"

:: 3. Start the React Frontend in a new window
echo [3/3] Starting React Frontend...
cd D:\knowledge-nexus-ai\frontend
start "Knowledge Nexus Frontend" cmd /k "npm run dev"

echo.
echo ========================================================
echo All services started successfully!
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8000/docs
echo ========================================================
pause
