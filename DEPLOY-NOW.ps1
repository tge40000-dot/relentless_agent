# ============================================================
# RELENTLESS BILLIONAIRE — DEPLOY SCRIPT
# Run this from Windows Terminal or PowerShell OUTSIDE Windsurf
# ============================================================

$ErrorActionPreference = "Stop"

Write-Host "RELENTLESS BILLIONAIRE -- DEPLOY" -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Yellow

Set-Location $PSScriptRoot

# Load environment variables from .env file
Write-Host "`nLoading environment variables from .env..." -ForegroundColor Cyan
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    exit 1
}

# Parse .env file and load into environment
Get-Content ".env" | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        # Skip if value is a placeholder
        if ($value -notmatch '^(your_|placeholder)') {
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
            Set-Item -Path "env:$name" -Value $value
        }
    }
}

# Validate required environment variables (excluding CLOUDFLARE_API_TOKEN - using wrangler login)
$requiredVars = @(
    "STRIPE_SECRET_KEY",
    "STRIPE_PUBLISHABLE_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "RESEND_API_KEY",
    "RESEND_FROM_EMAIL",
    "CHRISTOPHER_PHONE"
)

$missingVars = @()
foreach ($var in $requiredVars) {
    if (-not (Get-Item -Path "env:$var" -ErrorAction SilentlyContinue)) {
        $missingVars += $var
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host "ERROR: Missing required environment variables:" -ForegroundColor Red
    $missingVars | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host "`nPlease add these to your .env file." -ForegroundColor Yellow
    exit 1
}

Write-Host "Environment variables loaded successfully." -ForegroundColor Green

# Clear any existing CLOUDFLARE_API_TOKEN to allow wrangler login (OAuth)
Remove-Item Env:CLOUDFLARE_API_TOKEN -ErrorAction SilentlyContinue
$env:CLOUDFLARE_API_TOKEN = $null

# Authenticate with Cloudflare via wrangler login (OAuth)
Write-Host "`nAuthenticating with Cloudflare..." -ForegroundColor Cyan
Write-Host "A browser window will open. Please log in to your Cloudflare account." -ForegroundColor Yellow
wrangler login

# Step 1: Set Worker secrets
Write-Host "`nSTEP 1: Setting Cloudflare Worker secrets..." -ForegroundColor Cyan

$secrets = @{
    "STRIPE_SECRET_KEY"      = $env:STRIPE_SECRET_KEY
    "STRIPE_PUBLISHABLE_KEY" = $env:STRIPE_PUBLISHABLE_KEY
    "STRIPE_WEBHOOK_SECRET"  = $env:STRIPE_WEBHOOK_SECRET
    "RESEND_API_KEY"         = $env:RESEND_API_KEY
    "RESEND_FROM_EMAIL"      = $env:RESEND_FROM_EMAIL
    "CHRISTOPHER_PHONE"      = $env:CHRISTOPHER_PHONE
    "GROQ_API_KEY"           = $env:GROQ_API_KEY
    "AI_MODEL"               = $env:AI_MODEL
}

foreach ($key in $secrets.Keys) {
    Write-Host "  Setting $key..." -NoNewline
    try {
        $secrets[$key] | wrangler secret put $key --config wrangler-api.toml
        Write-Host " Done" -ForegroundColor Green
    }
    catch {
        Write-Host " FAILED" -ForegroundColor Red
        Write-Host "  Error: $_" -ForegroundColor Red
        exit 1
    }
}

# Step 1b: Set Telnyx secrets (skip if placeholder values)
Write-Host "`nSTEP 1b: Setting Telnyx secrets..." -ForegroundColor Cyan

$telnyxKey = $env:TELNYX_API_KEY
$telnyxNum = $env:TELNYX_FROM_NUMBER

if ($telnyxKey -and $telnyxKey -notmatch '^(your_|placeholder)') {
    Write-Host "  Setting TELNYX_API_KEY..." -NoNewline
    try {
        $telnyxKey | wrangler secret put TELNYX_API_KEY --config wrangler-api.toml
        Write-Host " Done" -ForegroundColor Green
    }
    catch {
        Write-Host " FAILED" -ForegroundColor Red
        Write-Host "  Error: $_" -ForegroundColor Red
    }
}
else {
    Write-Host "  Skipping TELNYX_API_KEY (not configured)" -ForegroundColor Yellow
}

if ($telnyxNum -and $telnyxNum -notmatch '^(your_|placeholder)') {
    Write-Host "  Setting TELNYX_FROM_NUMBER..." -NoNewline
    try {
        $telnyxNum | wrangler secret put TELNYX_FROM_NUMBER --config wrangler-api.toml
        Write-Host " Done" -ForegroundColor Green
    }
    catch {
        Write-Host " FAILED" -ForegroundColor Red
        Write-Host "  Error: $_" -ForegroundColor Red
    }
}
else {
    Write-Host "  Skipping TELNYX_FROM_NUMBER (not configured)" -ForegroundColor Yellow
}

# Step 2: Deploy Worker
Write-Host "`nSTEP 2: Deploying Worker..." -ForegroundColor Cyan
try {
    wrangler deploy --config wrangler-api.toml --yes
    Write-Host "Worker deployed!" -ForegroundColor Green
}
catch {
    Write-Host "Worker deployment failed: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Push all live data
Write-Host "`nSTEP 3: Pushing live data..." -ForegroundColor Cyan
if (Test-Path ".\push-data.ps1") {
    try {
        .\push-data.ps1
    }
    catch {
        Write-Host "Data push failed: $_" -ForegroundColor Red
        Write-Host "Continuing anyway..." -ForegroundColor Yellow
    }
}
else {
    Write-Host "push-data.ps1 not found, skipping..." -ForegroundColor Yellow
}

Write-Host "`n=================================" -ForegroundColor Yellow
Write-Host "RELENTLESS BILLIONAIRE IS LIVE!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Verify: https://relentlessbillionaire.com/api/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Live payment links:" -ForegroundColor Cyan
if (Test-Path "stripe_products.json") {
    try {
        $products = Get-Content "stripe_products.json" | ConvertFrom-Json
        foreach ($p in $products.products) {
            if ($p.payment_link) {
                Write-Host "  $($p.name): $($p.payment_link)"
            }
        }
    }
    catch {
        Write-Host "Could not load stripe_products.json" -ForegroundColor Yellow
    }
}
else {
    Write-Host "stripe_products.json not found" -ForegroundColor Yellow
}
