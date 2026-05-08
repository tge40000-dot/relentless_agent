param(
  [switch]$NoBrowser
)

Write-Host "=== RELENTLESS AGENT — ONE DROP LAUNCH ===" -ForegroundColor Yellow

# Detect Python
$python = ""
$venvPython = "C:\relentless_agent\venv\Scripts\python.exe"

if (Test-Path $venvPython) {
    $python = $venvPython
    Write-Host "Using virtual environment Python." -ForegroundColor Cyan
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    $python = "python"
    Write-Host "Using system Python." -ForegroundColor Cyan
} else {
    Write-Host "ERROR: Python not found." -ForegroundColor Red
    exit
}

# Correct agent command
$AgentPath = "C:\relentless_agent"
$AgentCmd  = "$python run_server.py"

# Optional panel
$PanelPath = "C:\relentless_agent\panel"
$PanelCmd  = "npm run dev"
$PanelUrl  = "http://localhost:3002"

# Health URL (FastAPI default)
$HealthUrl = "http://localhost:8000/health"

function Start-BackgroundProcess {
  param(
    [string]$Path,
    [string]$Command,
    [string]$Name
  )

  Write-Host "Starting $Name..." -ForegroundColor Cyan
  Push-Location $Path
  $job = Start-Job -ScriptBlock {
    param($cmd)
    & powershell -NoLogo -NoProfile -Command $cmd
  } -ArgumentList $Command
  Pop-Location

  Write-Host "$Name started as Job Id: $($job.Id)" -ForegroundColor Green
  return $job
}

# Start agent
$agentJob = Start-BackgroundProcess -Path $AgentPath -Command $AgentCmd -Name "Relentless Agent"

# Start panel
$panelJob = $null
if (Test-Path $PanelPath) {
  $panelJob = Start-BackgroundProcess -Path $PanelPath -Command $PanelCmd -Name "Agent Control Panel"
}

Write-Host "Waiting for agent to come online..." -ForegroundColor DarkYellow
Start-Sleep -Seconds 5

try {
  $resp = Invoke-RestMethod -Uri $HealthUrl -Method GET -TimeoutSec 5
  Write-Host "Agent health check OK." -ForegroundColor Green
} catch {
  Write-Host "Agent health check failed or not implemented yet." -ForegroundColor Yellow
}

if (-not $NoBrowser -and $panelJob -ne $null) {
  Write-Host "Opening Agent Control Panel at $PanelUrl" -ForegroundColor Yellow
  Start-Process $PanelUrl
}

Write-Host ""
Write-Host "=== RELENTLESS AGENT ONLINE ===" -ForegroundColor Green
Write-Host "Agent Job Id:  $($agentJob.Id)"
if ($panelJob -ne $null) {
  Write-Host "Panel Job Id:  $($panelJob.Id)"
}
Write-Host "Use 'Get-Job' and 'Stop-Job' to manage processes." -ForegroundColor DarkGray
