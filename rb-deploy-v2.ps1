$token = $env:CLOUDFLARE_API_TOKEN
if (-not $token) {
    Write-Host "ERROR: CLOUDFLARE_API_TOKEN environment variable not set" -ForegroundColor Red
    exit 1
}
$acct  = "0a7be075f32d9d615349825b83ab8fcb"
$name  = "relentless-billionaire-api"
$kvId  = "a5a8acb98514418184de30c1eb8f4dff"

if (-not (Test-Path ".\worker-v2-compact.js")) {
    Write-Host "ERROR: worker-v2-compact.js not found" -ForegroundColor Red
    exit 1
}
$code = Get-Content ".\worker-v2-compact.js" -Raw -ErrorAction Stop
Write-Host "Loaded $($code.Length) bytes" -ForegroundColor Cyan

$uri = "https://api.cloudflare.com/client/v4/accounts/$acct/workers/scripts/$name"

$boundary = "----RBDeploy$(Get-Random)"
$metadata = '{"main_module":"worker.js","bindings":[{"type":"kv_namespace","name":"RELENTLESS_KV","namespace_id":"' + $kvId + '"}],"compatibility_date":"2024-01-01"}'

$body = @"
--$boundary
Content-Disposition: form-data; name="metadata"; filename="metadata.json"
Content-Type: application/json

$metadata
--$boundary
Content-Disposition: form-data; name="worker.js"; filename="worker.js"
Content-Type: application/javascript+module

$code
--$boundary--
"@

try {
    $r = Invoke-RestMethod -Uri $uri -Method PUT `
        -Headers @{"Authorization"="Bearer $token"} `
        -ContentType "multipart/form-data; boundary=$boundary" `
        -Body $body
    if ($r.success) {
        Write-Host "DEPLOYED!" -ForegroundColor Green
        Write-Host "Version: $($r.result.id)" -ForegroundColor Green
    } else {
        $r.errors | ForEach-Object { Write-Host "Error: $($_.message)" -ForegroundColor Red }
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host $_.Exception.Response.StatusCode -ForegroundColor Red
}

Start-Sleep 3
try {
    $h = Invoke-RestMethod "https://relentlessbillionaire.com/api/health" -TimeoutSec 10
    Write-Host "Health: $($h.status)" -ForegroundColor Green
} catch {
    Write-Host "Health check pending..." -ForegroundColor Yellow
}
