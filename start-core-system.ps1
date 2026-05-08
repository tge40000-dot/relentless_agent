# Start Core System (Simplified - Without Heavy AI Packages)
# Launches the basic system without ML packages to save space

Write-Host "=== Relentless Billionaire Core System ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting core system without heavy AI packages..." -ForegroundColor Yellow

# Check Python
$pythonVersion = python --version 2>&1
Write-Host "✓ Python: $pythonVersion" -ForegroundColor Green

# Check venv
if (Test-Path "venv") {
    Write-Host "✓ Virtual environment found" -ForegroundColor Green
    & .\venv\Scripts\Activate.ps1
} else {
    python -m venv venv
    & .\venv\Scripts\Activate.ps1
}

# Install core dependencies only (no ML packages)
Write-Host ""
Write-Host "Installing core dependencies..." -ForegroundColor Yellow
pip install fastapi uvicorn gunicorn psycopg2-binary sqlalchemy redis python-jose passlib python-multipart pydantic pydantic-settings slowapi stripe twilio sendgrid playwright beautifulsoup4 requests aiohttp selenium psutil python-dotenv loguru pytest python-dateutil pytz

Write-Host "✓ Core dependencies installed" -ForegroundColor Green

# Install Playwright browsers
Write-Host ""
Write-Host "Installing Playwright browsers..." -ForegroundColor Yellow
playwright install chromium
Write-Host "✓ Playwright browsers installed" -ForegroundColor Green

# Create directories
Write-Host ""
Write-Host "Creating directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path logs | Out-Null
New-Item -ItemType Directory -Force -Path output | Out-Null
Write-Host "✓ Directories created" -ForegroundColor Green

Write-Host ""
Write-Host "Core system ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Note: ML packages (scikit-learn, openai) skipped to save space." -ForegroundColor Yellow
Write-Host "System will run in rule-based mode without them." -ForegroundColor Yellow
Write-Host ""
Write-Host "To add AI features later, run: pip install scikit-learn openai" -ForegroundColor White
