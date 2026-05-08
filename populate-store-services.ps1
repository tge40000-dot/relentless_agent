# ================================
# Populate Store Services
# Adds AI-powered services to the relentlessbillionaire.com store
# ================================

$apiUrl = "https://relentlessbillionaire.com/api/content/store_services"
$adminKey = "rb-admin-2026"

$services = @(
    @{
        id = "svc_lead_generation"
        name = "AI Lead Generation"
        description = "Automated lead generation using AI to identify and qualify potential customers for your business"
        price = 297
        price_unit = "month"
        duration = "Ongoing subscription"
        deliverables = @(
            "Qualified leads delivered daily",
            "Lead scoring reports",
            "CRM integration",
            "Automated follow-up sequences"
        )
        category = "ai_automation"
        active = $true
        created_at = (Get-Date).ToString("o")
    },
    @{
        id = "svc_crm_intake"
        name = "AI CRM Intake Automation"
        description = "Automated CRM data entry and organization from multiple sources"
        price = 197
        price_unit = "month"
        duration = "Ongoing subscription"
        deliverables = @(
            "Automated data entry",
            "Deduplication",
            "Data enrichment",
            "Daily sync reports"
        )
        category = "ai_automation"
        active = $true
        created_at = (Get-Date).ToString("o")
    },
    @{
        id = "svc_crm_scoring"
        name = "AI Lead Scoring & Prioritization"
        description = "AI-powered lead scoring to prioritize high-value prospects"
        price = 247
        price_unit = "month"
        duration = "Ongoing subscription"
        deliverables = @(
            "Lead scores",
            "Priority rankings",
            "Conversion probability predictions",
            "Custom scoring criteria"
        )
        category = "ai_automation"
        active = $true
        created_at = (Get-Date).ToString("o")
    },
    @{
        id = "svc_flyer_production"
        name = "AI Flyer & Content Generation"
        description = "Automated flyer and marketing content generation using AI"
        price = 49
        price_unit = "pack"
        duration = "24-48 hour turnaround"
        deliverables = @(
            "10 unique flyers",
            "Multiple format options",
            "Brand-aligned designs",
            "Unlimited revisions"
        )
        category = "content_creation"
        active = $true
        created_at = (Get-Date).ToString("o")
    },
    @{
        id = "svc_outreach"
        name = "AI Outreach Automation"
        description = "Automated personalized outreach campaigns via email and messaging"
        price = 347
        price_unit = "month"
        duration = "Ongoing subscription"
        deliverables = @(
            "Automated campaigns",
            "Personalization",
            "Response tracking",
            "Analytics dashboard"
        )
        category = "ai_automation"
        active = $true
        created_at = (Get-Date).ToString("o")
    }
)

Write-Host "Preparing to populate store services..." -ForegroundColor Cyan

# Fetch existing services first
Write-Host "Fetching existing services..." -ForegroundColor Yellow
try {
    $existingServices = Invoke-RestMethod -Uri $apiUrl -Method Get -TimeoutSec 10
    Write-Host "Found $($existingServices.Count) existing services" -ForegroundColor Cyan
}
catch {
    Write-Host "No existing services found (or API error)" -ForegroundColor Yellow
    $existingServices = @()
}

# Combine existing with new services
$allServices = $existingServices + $services
Write-Host "Total services after adding: $($allServices.Count)" -ForegroundColor Cyan
Write-Host ""

# Convert to JSON
$jsonPayload = $allServices | ConvertTo-Json -Depth 10

Write-Host "Sending services to API..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Body $jsonPayload -ContentType "application/json" -Headers @{"X-Admin-Key" = $adminKey} -TimeoutSec 30
    
    if ($response.success) {
        Write-Host "✅ Store services populated successfully!" -ForegroundColor Green
        Write-Host "Response: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Green
    } else {
        Write-Host "❌ API returned unsuccessful response" -ForegroundColor Red
        Write-Host "Response: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Red
    }
}
catch {
    Write-Host "❌ Failed to populate store services" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Verifying data was stored..." -ForegroundColor Yellow

try {
    $verifyResponse = Invoke-RestMethod -Uri $apiUrl -Method Get -TimeoutSec 10
    Write-Host "✅ Verification successful!" -ForegroundColor Green
    Write-Host "Total services in store: $($verifyResponse.Count)" -ForegroundColor Cyan
    
    foreach ($svc in $verifyResponse) {
        Write-Host "  - $($svc.name): $($svc.price)" -ForegroundColor White
    }
}
catch {
    Write-Host "⚠️  Verification failed, but data may still be stored" -ForegroundColor Yellow
    Write-Host "Error: $_" -ForegroundColor Yellow
}u

Write-Host ""
Write-Host "Done!" -ForegroundColor Green
