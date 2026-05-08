# ===== RELI — RELENTLESS BILLIONAIRE CLI =====
# Usage: reli <command> [payload]

param(
    [Parameter(Position=0)]
    [string]$Command,

    [Parameter(Position=1, ValueFromRemainingArguments)]
    [string[]]$Args
)

$Payload = ($Args -join " ").Trim()
$AgentServerUrl = "http://localhost:8000"

# ===== HELPERS =====
function PostJson($endpoint, $body) {
    try {
        $response = Invoke-RestMethod -Uri "$AgentServerUrl/$endpoint" `
            -Method Post `
            -ContentType "application/json" `
            -Body $body
        return $response
    } catch {
        Write-Host "ERROR: $_" -ForegroundColor Red
    }
}

function GetJson($endpoint) {
    try {
        $response = Invoke-RestMethod -Uri "$AgentServerUrl/$endpoint" -Method Get
        return $response
    } catch {
        Write-Host "ERROR: $_" -ForegroundColor Red
    }
}

# ===== COMMANDS =====
switch ($Command) {

    "task" {
        if (-not $Payload) {
            Write-Host "Usage: reli task ""your task description""" -ForegroundColor Yellow
            return
        }
        $body = @{ task = $Payload } | ConvertTo-Json
        $result = PostJson "task" $body
        Write-Host "Task queued." -ForegroundColor Green
        $result | ConvertTo-Json | Write-Host
    }

    "status" {
        $taskId = $Payload
        PostJson "task/$taskId" "{}"
    }

    "tasks" {
        $result = PostJson "tasks" "{}"
        if ($result) {
            $result | ConvertTo-Json -Depth 3 | Write-Host
        } else {
            Write-Host "No tasks found." -ForegroundColor Yellow
        }
    }

    "list" {
        $result = GetJson "tasks"
        if ($result) {
            $result | ConvertTo-Json -Depth 3 | Write-Host
        } else {
            Write-Host "No tasks found." -ForegroundColor Yellow
        }
    }

    # ===== LEAD GENERATION =====
    "leads" {
        if (-not $Payload) {
            Write-Host "Usage: reli leads ""target market"" [criteria]" -ForegroundColor Yellow
            Write-Host "Example: reli leads ""singles 25 and up"" ""min_age:25""" -ForegroundColor Gray
            return
        }
        $parts = $Payload -split " ", 2
        $market = $parts[0]
        $criteria = if ($parts[1]) { $parts[1] } else { "" }
        $body = @{ market = $market; criteria = $criteria } | ConvertTo-Json
        $result = PostJson "leads/scrape" $body
        if ($result) {
            Write-Host "Lead generation started." -ForegroundColor Green
            $result | ConvertTo-Json -Depth 3 | Write-Host
        }
    }

    "leads-saved" {
        $result = GetJson "leads/saved"
        if ($result) {
            Write-Host "Saved lead files:" -ForegroundColor Cyan
            $result | ConvertTo-Json -Depth 3 | Write-Host
        } else {
            Write-Host "No saved lead files found." -ForegroundColor Yellow
        }
    }

    "leads-export" {
        if (-not $Payload) {
            Write-Host "Usage: reli leads-export <filename>" -ForegroundColor Yellow
            return
        }
        $result = GetJson "leads/export/$Payload"
        if ($result) {
            $result | ConvertTo-Json -Depth 3 | Write-Host
        } else {
            Write-Host "Export failed or file not found." -ForegroundColor Red
        }
    }

    "leads-score" {
        if (-not $Payload) {
            Write-Host "Usage: reli leads-score ""criteria_json""" -ForegroundColor Yellow
            Write-Host "Example: reli leads-score '{""min_revenue"":""1M""}'" -ForegroundColor Gray
            return
        }
        $body = @{ criteria = $Payload } | ConvertTo-Json
        $result = PostJson "leads/score" $body
        if ($result) {
            Write-Host "Leads scored." -ForegroundColor Green
            $result | ConvertTo-Json -Depth 3 | Write-Host
        }
    }

    # ===== SILENT MODE =====
    "silent-on" {
        $result = PostJson "silent-on" "{}"
        Write-Host "Silent mode ON. At work / church." -ForegroundColor DarkGray
    }

    "silent-off" {
        $result = PostJson "silent-off" "{}"
        Write-Host "Silent mode OFF. Hustle mode." -ForegroundColor Green
    }

    "config" {
        $result = GetJson "config"
        $result | ConvertTo-Json | Write-Host
    }

    # ===== FINANCIAL GUARDRAILS =====
    "spend" {
        # reli spend 49.99 "Buy Canva Pro"
        $parts = $Payload -split " ", 2
        $amount = $parts[0]
        $desc = $parts[1]
        if (-not $amount -or -not $desc) {
            Write-Host "Usage: reli spend <amount> <description>" -ForegroundColor Yellow
            return
        }
        $body = @{ task = $desc; amount = [double]$amount } | ConvertTo-Json
        $result = PostJson "spend" $body
        Write-Host "Spend request submitted. Awaiting YOUR approval." -ForegroundColor Yellow
        $result | ConvertTo-Json | Write-Host
    }

    "approve" {
        $approvalId = $Payload
        $result = PostJson "approve/$approvalId" "{}"
        Write-Host "Approved." -ForegroundColor Green
        $result | ConvertTo-Json | Write-Host
    }

    "deny" {
        $approvalId = $Payload
        $result = PostJson "deny/$approvalId" "{}"
        Write-Host "Denied." -ForegroundColor Red
        $result | ConvertTo-Json | Write-Host
    }

    "approvals" {
        $result = GetJson "approvals"
        if ($result) {
            $result | ConvertTo-Json -Depth 3 | Write-Host
        } else {
            Write-Host "No pending approvals." -ForegroundColor Gray
        }
    }

    # ===== REVENUE AVENUES =====
    "avenues" {
        $result = GetJson "avenues"
        $result | ConvertTo-Json -Depth 3 | Write-Host
    }

    "avenue" {
        $avenueId = $Payload
        $result = GetJson "avenue/$avenueId"
        $result | ConvertTo-Json | Write-Host
    }

    "pause" {
        $avenueId = $Payload
        $result = PostJson "avenue/$avenueId/pause" "{}"
        Write-Host "Avenue paused (detrimental)." -ForegroundColor Red
        $result | ConvertTo-Json | Write-Host
    }

    "resume" {
        $avenueId = $Payload
        $result = PostJson "avenue/$avenueId/resume" "{}"
        Write-Host "Avenue resumed. Back to work." -ForegroundColor Green
        $result | ConvertTo-Json | Write-Host
    }

    # ===== HOURLY CYCLE =====
    "cycle" {
        $result = GetJson "cycle"
        $result | ConvertTo-Json | Write-Host
    }

    "cycle-on" {
        $result = PostJson "cycle-on" "{}"
        Write-Host "Hourly revenue cycle ON. Maximum output." -ForegroundColor Green
    }

    "cycle-off" {
        $result = PostJson "cycle-off" "{}"
        Write-Host "Hourly revenue cycle OFF." -ForegroundColor Yellow
    }

    "dashboard" {
        Start-Process "http://localhost:8000/dashboard"
        Write-Host "Dashboard opened in browser." -ForegroundColor Cyan
    }

    # ===== OPPORTUNITY SCANNING =====
    "opportunity" {
        # reli opportunity services "Offer logo design packages"
        $parts = $Payload -split " ", 2
        $type = $parts[0]
        $idea = $parts[1]
        if (-not $type -or -not $idea) {
            Write-Host "Usage: reli opportunity <type> <idea>" -ForegroundColor Yellow
            Write-Host "Types: services | design | partnership | market" -ForegroundColor Gray
            return
        }
        $body = @{ type = $type; idea = $idea } | ConvertTo-Json
        $result = PostJson "opportunity" $body
        Write-Host "Opportunity surfaced." -ForegroundColor Cyan
        $result | ConvertTo-Json | Write-Host
    }

    "opportunities" {
        $result = GetJson "opportunities"
        if ($result) {
            $result | ConvertTo-Json -Depth 3 | Write-Host
        } else {
            Write-Host "No opportunities logged." -ForegroundColor Gray
        }
    }

    default {
        Write-Host "===== RELI - RELENTLESS BILLIONAIRE =====" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Tasks:" -ForegroundColor White
        Write-Host '  task [description]       Submit a new task' -ForegroundColor Gray
        Write-Host '  status [task_id]         Check task status' -ForegroundColor Gray
        Write-Host '  tasks                    List all tasks' -ForegroundColor Gray
        Write-Host '  dashboard                Open mobile dashboard in browser' -ForegroundColor Gray
        Write-Host ""
        Write-Host "Lead Generation:" -ForegroundColor White
        Write-Host '  leads [market] [criteria]  Generate leads for target market' -ForegroundColor Gray
        Write-Host '  leads-saved              List saved lead files' -ForegroundColor Gray
        Write-Host '  leads-export [filename]  Export leads to JSON/CSV' -ForegroundColor Gray
        Write-Host '  leads-score [criteria]   Score leads with criteria' -ForegroundColor Gray
        Write-Host ""
        Write-Host "Mode:" -ForegroundColor White
        Write-Host '  silent-on                At work / church' -ForegroundColor Gray
        Write-Host '  silent-off               Hustle mode' -ForegroundColor Gray
        Write-Host '  config                   View agent config' -ForegroundColor Gray
        Write-Host ""
        Write-Host "Revenue Avenues:" -ForegroundColor White
        Write-Host '  avenues                  List all revenue avenues' -ForegroundColor Gray
        Write-Host '  avenue [id]              Check specific avenue' -ForegroundColor Gray
        Write-Host '  pause [id]               Pause avenue (detrimental only)' -ForegroundColor Gray
        Write-Host '  resume [id]              Resume paused avenue' -ForegroundColor Gray
        Write-Host ""
        Write-Host "Hourly Cycle:" -ForegroundColor White
        Write-Host '  cycle                    View cycle status' -ForegroundColor Gray
        Write-Host '  cycle-on                 Enable hourly revenue cycle' -ForegroundColor Gray
        Write-Host '  cycle-off                Disable hourly revenue cycle' -ForegroundColor Gray
        Write-Host ""
        Write-Host "Financial:" -ForegroundColor White
        Write-Host '  spend [amount] [desc]    Request spend (needs approval)' -ForegroundColor Gray
        Write-Host '  approve [id]             Approve a spend' -ForegroundColor Gray
        Write-Host '  deny [id]                Deny a spend' -ForegroundColor Gray
        Write-Host '  approvals                List pending approvals' -ForegroundColor Gray
        Write-Host ""
        Write-Host "Opportunities:" -ForegroundColor White
        Write-Host '  opportunity [type] [idea]  Surface an idea' -ForegroundColor Gray
        Write-Host '  opportunities              View all surfaced ideas' -ForegroundColor Gray
        Write-Host '  Types: services | design | partnership | market' -ForegroundColor DarkGray
        Write-Host ""
        Write-Host "Safeguards:" -ForegroundColor DarkGray
        Write-Host '  reinvest_only_from_profit = true (always)' -ForegroundColor DarkGray
        Write-Host '  spend greater than 0 = requires YOUR approval' -ForegroundColor DarkGray
        Write-Host '  anti-hallucination validation on all outputs' -ForegroundColor DarkGray
        Write-Host '  no financial moves without human approval' -ForegroundColor DarkGray
    }
}
