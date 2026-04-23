# JKmall Run Script
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   JKmall - Kenyan E-Commerce Platform" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan

$backendPath = Join-Path $PSScriptRoot "backend"
$frontendPath = Join-Path $PSScriptRoot "frontend"

# Check if PostgreSQL is running
Write-Host "`n[1/3] Checking PostgreSQL..." -ForegroundColor Yellow
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if ($pgService -and $pgService.Status -ne "Running") {
    Write-Host "Starting PostgreSQL service..." -ForegroundColor Yellow
    Start-Service -Name $pgService.Name
    Start-Sleep -Seconds 3
}

# Create database if not exists
Write-Host "[2/3] Ensuring database exists..." -ForegroundColor Yellow
$env:PGPASSWORD = "your_password_here"
& psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'jkmall'" | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Note: Make sure PostgreSQL is running and 'jkmall' database exists." -ForegroundColor Red
    Write-Host "Create it with: CREATE DATABASE jkmall;" -ForegroundColor Yellow
}

# Start Backend
Write-Host "[3/3] Starting servers..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host ""

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm run dev"
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev"

Write-Host "`nServers starting in separate windows!" -ForegroundColor Cyan
Write-Host "Admin login: admin@jkmall.co.ke / admin123" -ForegroundColor Yellow
