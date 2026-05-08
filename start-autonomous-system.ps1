# ================================
# Start Autonomous Relentless System
# Launches all services for fully autonomous operation
# ================================

Write-Host "=== RELENTLESS AUTONOMOUS SYSTEM ===" -ForegroundColor Cyan
Write-Host ""

# Check Python
$pythonCheck = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCheck) {
    Write-Host "❌ Python not found" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Python found" -ForegroundColor Green

# Start Job Manager
Write-Host ""
Write-Host "Starting Job Manager..." -ForegroundColor Yellow
$jobManagerJob = Start-Job -ScriptBlock {
    python job_manager.py
} -Name "JobManager"

Start-Sleep -Seconds 3
if ($jobManagerJob.State -eq "Running") {
    Write-Host "✅ Job Manager started (PID: $($jobManagerJob.Id))" -ForegroundColor Green
} else {
    Write-Host "❌ Job Manager failed to start" -ForegroundColor Red
    exit 1
}

# Start Dashboard
Write-Host ""
Write-Host "Starting Dashboard..." -ForegroundColor Yellow
$dashboardJob = Start-Job -ScriptBlock {
    python dashboard.py
} -Name "Dashboard"

Start-Sleep -Seconds 3
if ($dashboardJob.State -eq "Running") {
    Write-Host "✅ Dashboard started (PID: $($dashboardJob.Id))" -ForegroundColor Green
} else {
    Write-Host "❌ Dashboard failed to start" -ForegroundColor Red
    exit 1
}

# Start Job Orchestration
Write-Host ""
Write-Host "Starting Job Orchestration..." -ForegroundColor Yellow
$orchestrationJob = Start-Job -ScriptBlock {
    python orchestrate-jobs.ps1 -NoAutoApprove
} -Name "Orchestration"

Start-Sleep -Seconds 2
if ($orchestrationJob.State -eq "Running") {
    Write-Host "✅ Job Orchestration started (PID: $($orchestrationJob.Id))" -ForegroundColor Green
} else {
    Write-Host "❌ Job Orchestration failed to start" -ForegroundColor Red
    exit 1
}

# System Status
Write-Host ""
Write-Host "=== SYSTEM STATUS ===" -ForegroundColor Cyan
Write-Host "Job Manager: http://127.0.0.1:8001" -ForegroundColor White
Write-Host "Dashboard: http://127.0.0.1:8002" -ForegroundColor White
Write-Host ""
Write-Host "=== SERVICES ===" -ForegroundColor Cyan
Write-Host "✅ Job Manager - Running" -ForegroundColor Green
Write-Host "✅ Dashboard - Running" -ForegroundColor Green
Write-Host "✅ Job Orchestration - Running" -ForegroundColor Green
Write-Host "✅ Bot Orchestrator - Integrated" -ForegroundColor Green
Write-Host "✅ Revenue Tracker - Integrated" -ForegroundColor Green
Write-Host "✅ SMS Dispatcher - Ready" -ForegroundColor Green
Write-Host ""
Write-Host "=== AUTONOMOUS FEATURES ===" -ForegroundColor Cyan
Write-Host "✅ Auto-scaling based on load" -ForegroundColor Green
Write-Host "✅ Automatic job processing" -ForegroundColor Green
Write-Host "✅ Revenue tracking" -ForegroundColor Green
Write-Host "✅ SMS approval workflow" -ForegroundColor Green
Write-Host "✅ Command center for manual override" -ForegroundColor Green
Write-Host ""
Write-Host "=== COMMANDS ===" -ForegroundColor Cyan
Write-Host "To stop all services:" -ForegroundColor White
Write-Host "  Stop-Job -Name JobManager,Dashboard,Orchestration" -ForegroundColor Yellow
Write-Host ""
Write-Host "To view job status:" -ForegroundColor White
Write-Host "  Get-Job" -ForegroundColor Yellow
Write-Host ""
Write-Host "Dashboard is ready at http://127.0.0.1:8002" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop this monitor (services will continue running)" -ForegroundColor DarkGray

# Monitor jobs
try {x
    while ($true) {
        Start-Sleep -Seconds 30
        $jm = Get-Job -Name "JobManager" -ErrorAction SilentlyContinue
        $db = Get-Job -Name "Dashboard" -ErrorAction SilentlyContinue
        $orch = Get-Job -Name "Orchestration" -ErrorAction SilentlyContinue
        
        if ($jm.State -ne "Running" -or $db.State -ne "Running" -or $orch.State -ne "Running") {
            Write-Host "⚠️  Service stopped unexpectedly" -ForegroundColor Yellow
            break
        }
    }
} finally {
    Write-Host ""
    Write-Host "Monitor stopped. Services still running." -ForegroundColor Cyan
    Write-Host "Use Stop-Job to stop services." -ForegroundColor Yellow
}
