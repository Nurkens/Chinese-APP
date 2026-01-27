# Setup script for Chinese Learning App Backend
Write-Host "=== Chinese Learning App Backend Setup ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean install
Write-Host "Step 1: Cleaning old installations..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force node_modules
    Write-Host "  ✓ Removed node_modules" -ForegroundColor Green
}
if (Test-Path "package-lock.json") {
    Remove-Item package-lock.json
    Write-Host "  ✓ Removed package-lock.json" -ForegroundColor Green
}
Write-Host ""

# Step 2: Install dependencies
Write-Host "Step 2: Installing dependencies..." -ForegroundColor Yellow
npm install --legacy-peer-deps
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  ✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Check database
Write-Host "Step 3: Database setup..." -ForegroundColor Yellow
Write-Host "  ⚠ Please ensure database 'chinese_app' exists on port 5433" -ForegroundColor Yellow
Write-Host ""
Write-Host "  To create database manually:" -ForegroundColor Cyan
Write-Host "    Option 1: Open pgAdmin → Create Database → Name: chinese_app" -ForegroundColor Gray
Write-Host "    Option 2: Open SQL Shell (psql) from Start menu" -ForegroundColor Gray
Write-Host "              Port: 5433, Password: user" -ForegroundColor Gray
Write-Host "              Then run: CREATE DATABASE chinese_app;" -ForegroundColor Gray
Write-Host ""
$confirm = Read-Host "  Database 'chinese_app' is ready? (y/n)"
if ($confirm -ne 'y') {
    Write-Host "  Setup paused. Please create the database first." -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Continuing with database 'chinese_app'" -ForegroundColor Green
Write-Host ""

# Step 4: Generate Prisma Client
Write-Host "Step 4: Generating Prisma Client..." -ForegroundColor Yellow
npx prisma@5.22.0 generate
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Prisma Client generated" -ForegroundColor Green
} else {
    Write-Host "  ✗ Failed to generate Prisma Client" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 5: Run migrations
Write-Host "Step 5: Running database migrations..." -ForegroundColor Yellow
npx prisma@5.22.0 migrate dev --name init
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Migrations completed" -ForegroundColor Green
} else {
    Write-Host "  ✗ Migration failed" -ForegroundColor Red
    Write-Host "  Check if database credentials are correct in .env" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Step 6: Success message
Write-Host "=== Setup Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Start the server:    npm run start:dev" -ForegroundColor White
Write-Host "  2. Seed initial data:   Invoke-WebRequest -Uri http://localhost:3000/words/seed -Method POST" -ForegroundColor White
Write-Host "  3. Open Swagger UI:     http://localhost:3000/api" -ForegroundColor White
Write-Host "  4. Open Prisma Studio:  npx prisma studio" -ForegroundColor White
Write-Host ""
