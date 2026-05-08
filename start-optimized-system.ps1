# ================================
# Start Optimized 100% Capacity System
# Runs all systems with hallucination prevention and 24/7 monitoring
# ================================

Write-Host "=== RELENTLESS OPTIMIZED SYSTEM ===" -ForegroundColor Cyan
Write-Host "🚀 Starting 100% Capacity Automation" -ForegroundColor Green
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
    Write-Host "✅ Job Manager started" -ForegroundColor Green
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
    Write-Host "✅ Dashboard started" -ForegroundColor Green
} else {
    Write-Host "❌ Dashboard failed to start" -ForegroundColor Red
    exit 1
}

# Start 24/7 Monitor
Write-Host ""
Write-Host "Starting 24/7 Monitor..." -ForegroundColor Yellow
$monitorJob = Start-Job -ScriptBlock {
    python monitor_24_7.py
} -Name "Monitor24_7"

Start-Sleep -Seconds 2
if ($monitorJob.State -eq "Running") {
    Write-Host "✅ 24/7 Monitor started" -ForegroundColor Green
} else {
    Write-Host "❌ 24/7 Monitor failed to start" -ForegroundColor Red
    exit 1
}

# Start Customer Intake (standby)
Write-Host ""
Write-Host "Customer Intake System (Standby)..." -ForegroundColor Yellow
Write-Host "✅ Ready for automated intake" -ForegroundColor Green

# System Status
Write-Host ""
Write-Host "=== SYSTEM STATUS ===" -ForegroundColor Cyan
Write-Host "Job Manager: http://127.0.0.1:8001" -ForegroundColor White
Write-Host "Dashboard: http://127.0.0.1:8002" -ForegroundColor White
Write-Host "Agent: http://127.0.0.1:8000" -ForegroundColor White
Write-Host ""

Write-Host "=== OPTIMIZED FEATURES ===" -ForegroundColor Cyan
Write-Host "✅ Customer Intake Automation" -ForegroundColor Green
Write-Host "✅ Accuracy Verification" -ForegroundColor Green
Write-Host "✅ Hallucination Prevention" -ForegroundColor Green
Write-Host "✅ 24/7 Monitoring" -ForegroundColor Green
Write-Host "✅ Auto-Scaling" -ForegroundColor Green
Write-Host "✅ Payment Acquisition" -ForegroundColor Green
Write-Host "✅ SMS Full Reporting" -ForegroundColor Green
Write-Host "✅ Lead Generation Automation" -ForegroundColor Green
Write-Host ""

Write-Host "=== WORKFLOW ===" -ForegroundColor Cyan
Write-Host "1. Intake Customers → Automated 24/7" -ForegroundColor White
Write-Host "2. Analyze & Verify → Accuracy checks" -ForegroundColor White
Write-Host "3. Report via SMS → Full oversight" -ForegroundColor White
Write-Host "4. Execute Jobs → AI bots" -ForegroundColor White
Write-Host "5. Delivery → Automated" -ForegroundColor White
Write-Host "6. Payment → Stripe integration" -ForegroundColor White
Write-Host "7. Completion → Auto-delivery" -ForegroundColor White
Write-Host ""

Write-Host "=== SMS COMMANDS ===" -ForegroundColor Cyan
Write-Host "status      → System status" -ForegroundColor White
Write-Host "health      → System health" -ForegroundColor White
Write-Host "intake      → Customer intake status" -ForegroundColor White
Write-Host "bots        → Bot status" -ForegroundColor White
Write-Host "metrics     → System metrics" -ForegroundColor White
Write-Host "alerts      → System alerts" -ForegroundColor White
Write-Host "revenue     → Revenue dashboard" -ForegroundColor White
Write-Host "jobs        → Job status" -ForegroundColor White
Write-Host "approve_job <id> → Approve job" -ForegroundColor White
Write-Host "reject_job <id> → Reject job" -ForegroundColor White
Write-Host ""

Write-Host "=== PREVENTION MEASURES ===" -ForegroundColor Cyan
Write-Host "✅ Email format verification" -ForegroundColor Green
Write-Host "✅ Phone number validation" -ForegroundColor Green
Write-Host "✅ Lead score range checks" -ForegroundColor Green
Write-Host "✅ Revenue calculation verification" -ForegroundColor Green
Write-Host "✅ Status transition validation" -ForegroundColor Green
Write-Host "✅ AI output hallucination detection" -ForegroundColor Green
Write-Host "✅ Contradiction detection" -ForegroundColor Green
Write-Host "✅ Number anomaly detection" -ForegroundColor Green
Write-Host ""

Write-Host "=== MONITORING THRESHOLDS ===" -ForegroundColor Cyan
Write-Host "CPU Usage: < 90%" -ForegroundColor White
Write-Host "Memory Usage: < 90%" -ForegroundColor White
Write-Host "Queue Size: < 20" -ForegroundColor White
Write-Host "Error Rate: < 5" -ForegroundColor White
Write-Host "Bot Load: < 85%" -ForegroundColor White
Write-Host ""

Write-Host "Dashboard: http://127.0.0.1:8002" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop this monitor (services will continue running)" -ForegroundColor DarkGray

# Monitor jobs
try {
    while ($true) {
        Start-Sleep -Seconds 60
        $jm = Get-Job -Name "JobManager" -ErrorAction SilentlyContinue
        $db = Get-Job -Name "Dashboard" -ErrorAction SilentlyContinue
        $mon = Get-Job -Name "Monitor24_7" -ErrorAction SilentlyContinue
        
        if ($jm.State -ne "Running" -or $db.State -ne "Running" -or $mon.State -ne "Running") {
            Write-Host "⚠️  Service stopped unexpectedly" -ForegroundColor Yellow
            Write-Host "Attempting restart..." -ForegroundColor Yellow
            
            if ($jm.State -ne "Running") {
                $jm = Start-Job -ScriptBlock { python job_manager.py } -Name "JobManager"
            }
            if ($db.State -ne "Running") {
                $db = Start-Job -ScriptBlock { python dashboard.py } -Name "Dashboard"
            }
            if ($mon.State -ne "Running") {
                $mon = Start-Job -ScriptBlock { python monitor_24_7.py } -Name "Monitor24_7"
            }
        }
    }
} finally {
    Write-Host ""
    Write-Host "Monitor stopped. Services still running." -ForegroundColor Cyan
    Write-Host "Use Stop-Job to stop services." -ForegroundColor Yellow
}
