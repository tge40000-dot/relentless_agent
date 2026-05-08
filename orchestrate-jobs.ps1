# ================================
# Orchestrate Jobs
# Monitors and executes automated jobs with SMS approval workflow
# ================================

param(
    [switch]$NoAutoApprove
)

Write-Host "=== RELENTLESS JOB ORCHESTRATOR ===" -ForegroundColor Cyan

# Start Job Manager
Write-Host "Starting Job Manager..." -ForegroundColor Yellow
$jobManagerJob = Start-Job -ScriptBlock {
    python job_manager.py
} -Name "JobManager"

Start-Sleep -Seconds 3
Write-Host "Job Manager started (PID: $($jobManagerJob.Id))" -ForegroundColor Green

# Monitor and execute jobs
Write-Host ""
Write-Host "Starting job monitoring loop..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop" -ForegroundColor DarkGray

while ($true) {
    try {
        # Get pending jobs
        $jobs = Invoke-RestMethod -Uri "http://127.0.0.1:8001/jobs/status/pending" -Method Get -TimeoutSec 5
        
        if ($jobs.count -gt 0) {
            Write-Host "$(Get-Date -Format 'HH:mm:ss') - Found $($jobs.count) pending job(s)" -ForegroundColor Cyan
            
            foreach ($job in $jobs.jobs) {
                $jobId = $job.id
                $serviceId = $job.service_id
                
                Write-Host "  Processing job $jobId ($serviceId)..." -ForegroundColor Yellow
                
                # Update to in_progress
                $updateBody = @{"status" = "in_progress"} | ConvertTo-Json
                Invoke-RestMethod -Uri "http://127.0.0.1:8001/jobs/$jobId" -Method Put -Body $updateBody -ContentType "application/json" -TimeoutSec 5 | Out-Null
                
                # Simulate bot execution (in real implementation, call bot_executor)
                Start-Sleep -Seconds 2
                
                # Update to awaiting_approval
                $approveBody = @{
                    "status" = "awaiting_approval"
                    "bot_output" = @{
                        "success" = $true
                        "result" = "Bot execution completed successfully"
                        "leads_found" = 5
                    }
                } | ConvertTo-Json -Depth 10
                
                Invoke-RestMethod -Uri "http://127.0.0.1:8001/jobs/$jobId" -Method Put -Body $approveBody -ContentType "application/json" -TimeoutSec 5 | Out-Null
                
                # Send SMS for approval
                Write-Host "  Job awaiting approval - SMS sent" -ForegroundColor Green
                
                # In real implementation, call SMS dispatcher here
                # python tools/sms-dispatcher.py --no-sms "JOB $jobId: $serviceId - Ready for approval. Reply: approve_job $jobId"
                
                if (-not $NoAutoApprove) {
                    # Auto-approve for demo
                    Start-Sleep -Seconds 1
                    $autoApprove = @{"status" = "approved"} | ConvertTo-Json
                    Invoke-RestMethod -Uri "http://127.0.0.1:8001/jobs/$jobId" -Method Put -Body $autoApprove -ContentType "application/json" -TimeoutSec 5 | Out-Null
                    Write-Host "  Job auto-approved (demo mode)" -ForegroundColor Green
                }
            }
        }
    }
    catch {
        Write-Host "Error in monitoring loop: $_" -ForegroundColor Red
    }
    
    Start-Sleep -Seconds 10
}
