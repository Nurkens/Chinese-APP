# PowerShell script to start both backend and frontend servers

Write-Host "🚀 Starting Chinese Learning App Servers" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Get the script directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start Backend
Write-Host "📦 Starting Backend Server (Port 3000)..." -ForegroundColor Green
$backendPath = Join-Path $scriptPath "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm run start:dev"
Write-Host "✅ Backend terminal opened" -ForegroundColor Green
Write-Host ""

# Wait a moment
Start-Sleep -Seconds 2

# Start Frontend
Write-Host "🎨 Starting Frontend Server (Port 5173)..." -ForegroundColor Yellow
$frontendPath = Join-Path $scriptPath "frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev"
Write-Host "✅ Frontend terminal opened" -ForegroundColor Yellow
Write-Host ""

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "🎊 Servers Starting!" -ForegroundColor Magenta
Write-Host ""
Write-Host "Backend:  http://localhost:3000" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "Wait 10-15 seconds for servers to start, then open:" -ForegroundColor White
Write-Host "http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
