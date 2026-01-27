# Quick Start Script for Chinese Learning App
# Run this to start both backend and frontend

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Chinese Learning App - Quick Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Seed the database
Write-Host "[Step 1/3] Seeding database with HSK 1-4 words..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\backend"
npm run seed
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database seeded successfully!" -ForegroundColor Green
} else {
    Write-Host "✗ Database seeding failed" -ForegroundColor Red
}
Write-Host ""

# Step 2: Start Backend
Write-Host "[Step 2/3] Starting backend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; Write-Host 'Backend Server' -ForegroundColor Cyan; npm run start:dev"
Write-Host "✓ Backend starting in new window..." -ForegroundColor Green
Write-Host ""

# Step 3: Start Frontend
Write-Host "[Step 3/3] Starting frontend server..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; Write-Host 'Frontend Server' -ForegroundColor Magenta; npm run dev"
Write-Host "✓ Frontend starting in new window..." -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "WAIT 10-15 seconds, then open:" -ForegroundColor Yellow
Write-Host "http://localhost:5173" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Features ready:" -ForegroundColor White
Write-Host "  ✓ Review button - navigates to Word Library" -ForegroundColor White
Write-Host "  ✓ Word Library - HSK 1-4 only (610 words)" -ForegroundColor White
Write-Host "  ✓ AI Tutor, Gacha, Hanzi Practice" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
