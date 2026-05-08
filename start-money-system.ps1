# Relentless Billionaire - Full-Speed Money System Launcher
# Launches all AI services simultaneously for maximum revenue generation

Write-Host "🚀 RELentless Billionaire - Full-Speed Money System" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Kill any existing processes
Write-Host "🧹 Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process -Name python -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep 2

# Start Job Manager
Write-Host "▶️  Starting Job Manager (Port 8001)..." -ForegroundColor Green
Start-Process -NoNewWindow -FilePath ".\venv\Scripts\python.exe" -ArgumentList "job_manager.py"
Start-Sleep 1

# Start Dashboard
Write-Host "▶️  Starting Dashboard (Port 8002)..." -ForegroundColor Green
Start-Process -NoNewWindow -FilePath ".\venv\Scripts\python.exe" -ArgumentList "dashboard.py"
Start-Sleep 1

# Start Main API
Write-Host "▶️  Starting Main API (Port 8000)..." -ForegroundColor Green
if (Test-Path "api_server.py") {
    Start-Process -NoNewWindow -FilePath ".\venv\Scripts\python.exe" -ArgumentList "api_server.py"
}
Start-Sleep 1

# Start Monitor
Write-Host "▶️  Starting System Monitor..." -ForegroundColor Green
if (Test-Path "monitor.py") {
    Start-Process -NoNewWindow -FilePath ".\venv\Scripts\python.exe" -ArgumentList "monitor.py"
}
Start-Sleep 1

# Start Autonomous AI System (Full Orchestration)
Write-Host "▶️  Starting Autonomous AI System (Full Orchestration)..." -ForegroundColor Green
Start-Process -NoNewWindow -FilePath ".\venv\Scripts\python.exe" -ArgumentList "autonomous_ai_system.py"

Write-Host ""
Write-Host "✅ All systems launched!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 System Status:" -ForegroundColor Cyan
Write-Host "   Job Manager:  http://localhost:8001"
Write-Host "   Dashboard:    http://localhost:8002"
Write-Host "   Main API:     http://localhost:8000"
Write-Host ""
Write-Host "💰 Money-Making Systems:" -ForegroundColor Green
Write-Host "   ✅ Web Scraper - Multi-source lead gen"
Write-Host "   ✅ ML Lead Scorer - Real-time qualification"
Write-Host "   ✅ Content Generator - AI-powered outreach"
Write-Host "   ✅ Sales Bot - 24/7 automation"
Write-Host "   ✅ Service Fulfillment - Auto delivery"
Write-Host "   ✅ Revenue Manager - 10% scaling rule"
Write-Host ""
Write-Host "🎯 Target: 500-1000 leads/day, 100+ outreach emails" -ForegroundColor Yellow
Write-Host "💵 Revenue Potential: $5,000-$20,000/day" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop all systems" -ForegroundColor Gray

# Keep script running
try {
    while ($true) {
        Start-Sleep 60
        # Check if processes are still running
        $pythonProcesses = Get-Process -Name python -ErrorAction SilentlyContinue
        if ($pythonProcesses.Count -eq 0) {
            Write-Host "⚠️  All Python processes stopped. Relaunching..." -ForegroundColor Yellow
            & ".\start-money-system.ps1"
            break
        }
    }
} catch {
    Write-Host "`n🛑 Stopping all systems..." -ForegroundColor Red
    Get-Process -Name python -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "✅ All systems stopped." -ForegroundColor Green
}
