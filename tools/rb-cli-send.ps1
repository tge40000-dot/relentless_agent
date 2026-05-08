param(
    [Parameter(Mandatory=$true)]
    [string] $Task
)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$agentRoot = Join-Path $root ".."
$py = Join-Path $agentRoot "venv\Scripts\python.exe"

$url = "http://127.0.0.1:8000/task"
$payload = @{"task" = $Task} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $url -Method POST -Body $payload -ContentType "application/json" -TimeoutSec 10
    Write-Host "Status: 200"
    Write-Host "Response: $($response | ConvertTo-Json)"
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
