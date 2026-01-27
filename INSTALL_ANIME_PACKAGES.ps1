# PowerShell Script to Install Anime Feature Dependencies
# Run this as Administrator

Write-Host "🎮 Installing Anime Feature Dependencies for Chinese Learning App" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to frontend directory
Set-Location -Path "C:\Users\nurke\chinese-app\frontend"

Write-Host "📍 Current Directory: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""

# Check if node_modules exists
if (-Not (Test-Path "node_modules")) {
    Write-Host "❌ node_modules folder not found. Running npm install first..." -ForegroundColor Red
    npm install
}

Write-Host "📦 Installing animation packages..." -ForegroundColor Green
Write-Host ""

# Install packages one by one with detailed output
Write-Host "[1/4] Installing framer-motion..." -ForegroundColor Cyan
npm install framer-motion@11.15.0 --save --legacy-peer-deps
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ framer-motion installed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ framer-motion installation failed" -ForegroundColor Red
}
Write-Host ""

Write-Host "[2/4] Installing hanzi-writer..." -ForegroundColor Cyan
npm install hanzi-writer@4.0.1 --save --legacy-peer-deps
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ hanzi-writer installed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ hanzi-writer installation failed" -ForegroundColor Red
}
Write-Host ""

Write-Host "[3/4] Installing pixi.js..." -ForegroundColor Cyan
npm install pixi.js@8.6.7 --save --legacy-peer-deps
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ pixi.js installed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ pixi.js installation failed" -ForegroundColor Red
}
Write-Host ""

Write-Host "[4/4] Installing pixi-live2d-display..." -ForegroundColor Cyan
npm install pixi-live2d-display@0.5.0 --save --legacy-peer-deps
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ pixi-live2d-display installed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ pixi-live2d-display installation failed" -ForegroundColor Red
}
Write-Host ""

# Verify installations
Write-Host "🔍 Verifying installations..." -ForegroundColor Yellow
Write-Host ""

$packages = @("framer-motion", "hanzi-writer", "pixi.js", "pixi-live2d-display")
foreach ($package in $packages) {
    $packagePath = "node_modules\$package"
    if (Test-Path $packagePath) {
        Write-Host "✅ $package - INSTALLED" -ForegroundColor Green
    } else {
        Write-Host "❌ $package - NOT FOUND" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "🎊 Installation Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start backend: cd backend && npm run start:dev" -ForegroundColor White
Write-Host "2. Start frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host "3. Open http://localhost:5173" -ForegroundColor White
Write-Host "4. Click the anime feature buttons (AI Tutor, Gacha, Hanzi Practice)" -ForegroundColor White
Write-Host ""
Write-Host "加油! (Keep going!) 🚀" -ForegroundColor Magenta
