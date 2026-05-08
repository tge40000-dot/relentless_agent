# Start Autonomous AI System
# Launches the complete 24/7 revenue generation and community building system

Write-Host "=== Relentless Billionaire Autonomous AI System ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Mission: Build a community that helps entrepreneurs succeed" -ForegroundColor White
Write-Host "Method: 24/7 AI-powered revenue generation" -ForegroundColor White
Write-Host "Values: Legal compliance, community buildin, excellence" -ForegroundColor White
Write-Host ""

# Check Python installation
Write-Host "Checking Python installation..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Python installed: $pythonVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Python not found. Please install Python 3.12+" -ForegroundColor Red
    exit 1
}

# Check virtual environment
Write-Host ""
Write-Host "Checking virtual environment..." -ForegroundColor Yellow
$venvPython = "$PSScriptRoot\venv\Scripts\python.exe"
if (Test-Path $venvPython) {
    Write-Host "✓ Virtual environment found" -ForegroundColor Green
} else {
    Write-Host "⚠️  Virtual environment not found. Creating..." -ForegroundColor Yellow
    python -m venv "$PSScriptRoot\venv"
    Write-Host "✓ Virtual environment created" -ForegroundColor Green
}

# Configure pip to use local temp/cache directories
Write-Host ""
Write-Host "Configuring pip cache directories..." -ForegroundColor Yellow
$pipCache = "$PSScriptRoot\.pip_cache"
$pipTemp = "$PSScriptRoot\.pip_temp"
$env:TEMP = $pipTemp
$env:TMP = $pipTemp
$env:PIP_CACHE_DIR = $pipCache
New-Item -ItemType Directory -Force -Path $pipTemp | Out-Null
New-Item -ItemType Directory -Force -Path $pipCache | Out-Null

# Install dependencies
Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
& $venvPython -m pip install --cache-dir=$pipCache -r requirements.txt
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Install Playwright browsers
Write-Host ""
Write-Host "Installing Playwright browsers..." -ForegroundColor Yellow
$env:PLAYWRIGHT_BROWSERS_PATH = "$PSScriptRoot\.playwright"
New-Item -ItemType Directory -Force -Path "$PSScriptRoot\.playwright" | Out-Null
& $venvPython -m playwright install chromium
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Playwright browsers installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Playwright installation failed (web scraping may not work)" -ForegroundColor Yellow
}

# Create necessary directories
Write-Host ""
Write-Host "Creating directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path logs | Out-Null
New-Item -ItemType Directory -Force -Path models | Out-Null
New-Item -ItemType Directory -Force -Path output | Out-Null
Write-Host "✓ Directories created" -ForegroundColor Green

# Check environment variables
Write-Host ""
Write-Host "Checking environment configuration..." -ForegroundColor Yellow
if (Test-Path "config\.env") {
    Write-Host "✓ Environment file found" -ForegroundColor Green
} else {
    Write-Host "⚠️  Environment file not found. Please configure config/.env" -ForegroundColor Yellow
    Write-Host "Required variables:" -ForegroundColor White
    Write-Host "  - OPENAI_API_KEY (for content generation)" -ForegroundColor White
    Write-Host "  - STRIPE_SECRET_KEY (for payments)" -ForegroundColor White
    Write-Host "  - TWILIO_ACCOUNT_SID (for SMS)" -ForegroundColor White
    Write-Host "  - TWILIO_AUTH_TOKEN (for SMS)" -ForegroundColor White
    Write-Host "  - SENDGRID_API_KEY (for email)" -ForegroundColor White
    Write-Host "  - ADMIN_PHONE (for alerts)" -ForegroundColor White
    Write-Host ""
    Write-Host "System will run in fallback mode without these keys." -ForegroundColor Yellow
}

# Start the autonomous AI system
Write-Host ""
Write-Host "Starting Autonomous AI System..." -ForegroundColor Green
Write-Host "Press CtrlG+C to stop" -ForegroundColor Yellow
Write-Host ""

& $venvPython autonomous_ai_system.py
