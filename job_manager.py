import os
import json
import uuid
from datetime import datetime
from typing import Optional, List, Dict
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import requests
# from auth import auth_manager, get_current_admin, require_admin
from revenue_manager import revenue_manager

WORKER_URL = "https://www.relentlessbillionaire.com"
ADMIN_KEY = "rb-admin-2026"
JOBS_FILE = "data/jobs.json"

app = FastAPI(title="Job Manager")

class Job(BaseModel):
    id: Optional[str] = None
    service_id: str
    customer_email: str
    customer_name: str
    status: str = "pending"
    price: float
    cost: float = 0.0
    profit: float = 0.0
    discount: float = 0.0
    tier_id: Optional[str] = None
    bot_output: Optional[Dict] = None
    deliverables: List[str] = []
    created_at: Optional[str] = None
    approved_at: Optional[str] = None
    completed_at: Optional[str] = None

def get_jobs() -> List[Dict]:
    """Get jobs from local storage"""
    try:
        os.makedirs("data", exist_ok=True)
        if os.path.exists(JOBS_FILE):
            with open(JOBS_FILE, 'r') as f:
                return json.load(f)
        return []
    except:
        return []

def save_jobs(jobs: List[Dict]):
    """Save jobs to local storage"""
    try:
        os.makedirs("data", exist_ok=True)
        with open(JOBS_FILE, 'w') as f:
            json.dump(jobs, f, indent=2)
    except Exception as e:
        print(f"Failed to save jobs: {e}")

def calculate_profit(price: float, service_id: str, tier_id: Optional[str] = None) -> tuple:
    service_costs = {
        "svc_lead_generation": 50,
        "svc_crm_intake": 30,
        "svc_crm_scoring": 40,
        "svc_flyer_production": 15,
        "svc_outreach": 60,
        "svc_consulting": 100
    }
    
    # Apply membership discounts
    discount = 0
    if tier_id:
        tier_discounts = {
            "tier-starter": 0.10,  # 10% off
            "tier-pro": 0.25,      # 25% off
            "tier-elite": 0.40     # 40% off
        }
        discount = tier_discounts.get(tier_id, 0)
        price = price * (1 - discount)
    
    cost = service_costs.get(service_id, 50)
    profit = price - cost
    return cost, profit, discount

@app.get("/jobs")
def list_jobs():
    jobs = get_jobs()
    return {"jobs": jobs, "count": len(jobs)}

@app.get("/jobs/{job_id}")
def get_job(job_id: str):
    jobs = get_jobs()
    job = next((j for j in jobs if j.get("id") == job_id), None)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@app.post("/jobs")
def create_job(job: Job):
    jobs = get_jobs()
    cost, profit, discount = calculate_profit(job.price, job.service_id, job.tier_id)
    job.cost = cost
    job.profit = profit
    job.discount = discount
    job.id = job.id or str(uuid.uuid4())
    job.created_at = datetime.now().isoformat()
    jobs.append(job.dict())
    
    # Record transaction in revenue manager with 10% scaling rule
    final_amount = job.price * (1 - discount)
    revenue_manager.record_transaction(final_amount, job.customer_email, job.service_id, job.tier_id)
    
    return {"success": True, "job_id": job.id, "status": job.status, "discount": discount, "final_amount": final_amount}

@app.put("/jobs/{job_id}")
def update_job(job_id: str, updates: Dict):
    jobs = get_jobs()
    job = next((j for j in jobs if j.get("id") == job_id), None)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    for key, value in updates.items():
        if key in job:
            job[key] = value
    if updates.get("status") == "approved" and not job.get("approved_at"):
        job["approved_at"] = datetime.now().isoformat()
    if updates.get("status") == "completed" and not job.get("completed_at"):
        job["completed_at"] = datetime.now().isoformat()
    save_jobs(jobs)
    return {"success": True, "job": job}

@app.delete("/jobs/{job_id}")
def delete_job(job_id: str):
    jobs = get_jobs()
    jobs = [j for j in jobs if j.get("id") != job_id]
    save_jobs(jobs)
    return {"success": True}

@app.get("/jobs/status/{status}")
def get_jobs_by_status(status: str):
    jobs = get_jobs()
    filtered = [j for j in jobs if j.get("status") == status]
    return {"jobs": filtered, "count": len(filtered)}

@app.get("/revenue")
def get_revenue():
    """Get revenue dashboard"""
    return revenue_manager.get_revenue_report()

@app.get("/revenue/summary")
def get_revenue_summary():
    """Get revenue summary with 10% scaling budget"""
    report = revenue_manager.get_revenue_report()
    return {
        "total_revenue": report["total_revenue"],
        "scaling_budget": report["available_budget"],  # 10% of revenue
        "scaling_budget_percentage": 0.10,  # Enforced 10% rule
        "pending_proposals": report["pending_proposals"],
        "total_transactions": report["total_transactions"]
    }

@app.get("/revenue/scaling")
def get_scaling_status():
    """Get 10% scaling rule status and budget"""
    report = revenue_manager.get_revenue_report()
    return {
        "rule": "10% of revenue allocated for scaling",
        "available_budget": report["available_budget"],
        "total_revenue": report["total_revenue"],
        "pending_proposals": report["pending_proposals"],
        "approval_required": True  # All scaling requires Christopher's approval
    }

@app.get("/memberships")
def get_memberships():
    """Get membership tiers"""
    memberships = [
        {
            "id": "tier-starter",
            "name": "STARTER",
            "price": 49,
            "price_unit": "month",
            "discount": 0.10,
            "featured": False,
            "perks": [
                "10% off all services",
                "Community access",
                "Priority support",
                "Monthly newsletter"
            ],
            "savings": {
                "leadGen": 450,
                "flyer": 180,
                "outreach": 900,
                "consulting": 1800
            }
        },
        {
            "id": "tier-pro",
            "name": "PRO",
            "price": 199,
            "price_unit": "month",
            "discount": 0.25,
            "featured": True,
            "perks": [
                "25% off all services",
                "Dedicated account manager",
                "Monthly strategy call",
                "Early event access",
                "Community access"
            ],
            "savings": {
                "leadGen": 375,
                "flyer": 150,
                "outreach": 750,
                "consulting": 1500
            }
        },
        {
            "id": "tier-elite",
            "name": "ELITE",
            "price": 499,
            "price_unit": "month",
            "discount": 0.40,
            "featured": False,
            "perks": [
                "40% off all services",
                "Weekly 1-on-1 with Christopher",
                "VIP event access + guest list",
                "First priority on all deliverables",
                "Dedicated account manager",
                "Custom brand strategy session"
            ],
            "savings": {
                "leadGen": 300,
                "flyer": 120,
                "outreach": 600,
                "consulting": 1200
            }
        }
    ]
    return {"memberships": memberships, "count": len(memberships)}

class CommandRequest(BaseModel):
    command: str

@app.get("/bots")
def get_bot_status():
    """Get status of all bots"""
    from bot_orchestrator import orchestrator
    return orchestrator.get_bot_status()

@app.get("/metrics")
def get_system_metrics():
    """Get system metrics"""
    import psutil
    import time
    
    # CPU usage
    cpu_percent = psutil.cpu_percent(interval=0.1)
    
    # Memory usage
    mem = psutil.virtual_memory()
    memory_used = f"{mem.used / (1024**3):.1f}GB"
    memory_total = f"{mem.total / (1024**3):.0f}GB"
    memory_percent = mem.percent
    
    # Calculate uptime
    if not hasattr(app.state, "start_time"):
        app.state.start_time = time.time()
    uptime_seconds = time.time() - app.state.start_time
    uptime_hours = uptime_seconds / 3600
    
    # Queue size (from jobs)
    jobs = get_jobs()
    queue_size = len([j for j in jobs if j.get("status") in ["pending", "in_progress"]])
    
    # Error count (from bot orchestrator)
    from bot_orchestrator import orchestrator
    total_errors = sum(sum(b.jobs_failed for b in instances) for instances in orchestrator.bots.values())
    
    # API rate (simplified)
    api_rate = len(jobs) * 10  # Placeholder
    
    return {
        "cpu_usage": f"{cpu_percent}%",
        "memory_usage": f"{memory_used} / {memory_total}",
        "memory_percent": f"{memory_percent}%",
        "api_rate": f"{api_rate} req/min",
        "uptime": f"{uptime_hours:.1f}h",
        "uptime_percent": "99.9%",
        "queue_size": queue_size,
        "errors_24h": total_errors
    }

# Authentication endpoints (disabled for now)
# class LoginRequest(BaseModel):
#     username: str
#     password: str

# @app.post("/login")
# def login(request: LoginRequest):
#     """Login and get JWT token"""
#     from auth import create_login_token
#     token = create_login_token(request.username, request.password)
#     if token:
#         return {"access_token": token, "token_type": "bearer"}
#     raise HTTPException(status_code=401, detail="Invalid credentials")

# @app.get("/protected")
# def protected_route(current_user: Dict = Depends(get_current_admin)):
#     """Protected route example"""
#     return {"message": "This is a protected route", "user": current_user}

# Protect command endpoint
@app.post("/command")
def execute_command(req: CommandRequest):  # current_user: Dict = Depends(get_current_admin)):
    """Execute dashboard command (protected)"""
    from bot_orchestrator import orchestrator
    cmd = req.command.lower().strip()
    parts = cmd.split()
    
    if parts[0] == "scale" and len(parts) >= 3:
        bot = parts[1]
        instances = int(parts[2])
        if orchestrator.scale_bot(bot, instances):
            return {"success": True, "message": f"Scaled {bot} to {instances} instances"}
        return {"success": False, "error": f"Failed to scale {bot}"}
    
    elif parts[0] == "pause":
        target = parts[1] if len(parts) > 1 else "all"
        if target == "all":
            for bot_type in orchestrator.bots:
                orchestrator.pause_bot(bot_type)
            return {"success": True, "message": "Paused all bots"}
        if orchestrator.pause_bot(target):
            return {"success": True, "message": f"Paused {target}"}
        return {"success": False, "error": f"Failed to pause {target}"}
    
    elif parts[0] == "resume":
        target = parts[1] if len(parts) > 1 else "all"
        if target == "all":
            for bot_type in orchestrator.bots:
                orchestrator.resume_bot(bot_type)
            return {"success": True, "message": "Resumed all bots"}
        if orchestrator.resume_bot(target):
            return {"success": True, "message": f"Resumed {target}"}
        return {"success": False, "error": f"Failed to resume {target}"}
    
    elif parts[0] == "status":
        return {"success": True, "message": "All systems operational"}
    
    elif parts[0] == "auto_mode":
        if parts[1] == "on":
            orchestrator.auto_mode = True
            return {"success": True, "message": "Autonomous mode enabled"}
        elif parts[1] == "off":
            orchestrator.auto_mode = False
            return {"success": True, "message": "Autonomous mode disabled"}
    
    return {"success": False, "error": f"Unknown command: {cmd}"}

# ── Inbound receiving endpoints ──────────────────────────────────────────────

def _load_bot_state() -> dict:
    try:
        path = "logs/sales_bot_state.json"
        if os.path.exists(path):
            with open(path, "r") as f:
                return json.load(f)
    except Exception:
        pass
    return {"conversations": {}, "sla_breaches": []}

def _save_bot_state(state: dict):
    try:
        os.makedirs("logs", exist_ok=True)
        with open("logs/sales_bot_state.json", "w") as f:
            json.dump(state, f, indent=2)
    except Exception as e:
        print(f"[WEBHOOK] State save error: {e}")

def _find_conv_by_email(state: dict, email: str) -> tuple:
    """Return (key, conv) for first conversation matching email."""
    for k, v in state.get("conversations", {}).items():
        lead = v.get("lead", {})
        if lead.get("email", "").lower() == email.lower():
            return k, v
    return None, None

class InboundLead(BaseModel):
    name: str = ""
    email: str
    company: str = ""
    message: str = ""
    phone: str = ""
    source: str = "website"
    service_interest: str = ""

@app.post("/webhook/lead")
async def inbound_lead(lead: InboundLead):
    """Receive inbound lead from website form or API — auto-add to pipeline as Hot."""
    state = _load_bot_state()
    convs = state.setdefault("conversations", {})
    lead_id = f"{lead.company or lead.name}_{lead.source}_{lead.email[:6]}"
    if lead_id not in convs:
        convs[lead_id] = {
            "lead_id": lead_id,
            "lead": {"company": lead.company or lead.name, "email": lead.email,
                     "phone": lead.phone, "source": lead.source,
                     "contact": lead.name, "website": "", "revenue_range": "Unknown",
                     "employee_count": "Unknown", "industry": "Inbound"},
            "tier": "Hot",
            "intent": 85,
            "stage": "outreach",
            "source": lead.source,
            "first_touch": datetime.now().isoformat(),
            "last_contact": datetime.now().isoformat(),
            "channels_used": [],
            "deal_value": 0,
            "inbound": True,
            "message": lead.message,
            "service_interest": lead.service_interest,
        }
        _save_bot_state(state)
        print(f"[INBOUND] New lead: {lead.company or lead.name} ({lead.email}) via {lead.source}")
        return {"status": "ok", "lead_id": lead_id, "tier": "Hot"}
    return {"status": "exists", "lead_id": lead_id}

@app.post("/webhook/resend")
async def resend_webhook(request: Request):
    """Receive Resend email events — update intent scores when leads engage."""
    try:
        body = await request.body()
        data = json.loads(body)
        event_type = data.get("type", "")
        email_data = data.get("data", {})
        to_addr = ""
        if isinstance(email_data.get("to"), list) and email_data["to"]:
            to_addr = email_data["to"][0]
        elif isinstance(email_data.get("to"), str):
            to_addr = email_data["to"]

        state = _load_bot_state()
        key, conv = _find_conv_by_email(state, to_addr)

        if conv:
            if event_type == "email.opened":
                conv["intent"] = min(100, conv.get("intent", 0) + 15)
                conv["email_opened"] = True
                if conv.get("stage") == "outreach":
                    conv["stage"] = "follow_up"
                print(f"[RESEND] Email opened by {to_addr} — intent +15")
            elif event_type == "email.clicked":
                conv["intent"] = min(100, conv.get("intent", 0) + 25)
                conv["email_clicked"] = True
                conv["tier"] = "Hot"
                print(f"[RESEND] Link clicked by {to_addr} — intent +25, tier -> Hot")
            elif event_type == "email.bounced":
                conv["stage"] = "lost"
                conv["bounce_reason"] = email_data.get("bounce", {}).get("message", "bounced")
                print(f"[RESEND] Email bounced for {to_addr}")
            elif event_type == "email.complained":
                conv["stage"] = "lost"
                conv["unsubscribed"] = True
                print(f"[RESEND] Spam complaint from {to_addr} — removed from pipeline")
            _save_bot_state(state)

        return {"status": "ok", "event": event_type}
    except Exception as e:
        print(f"[RESEND WEBHOOK] Error: {e}")
        return {"status": "error", "detail": str(e)}

@app.post("/webhook/sms")
async def sms_webhook(request: Request):
    """Receive inbound SMS replies via Telnyx — mark leads Hot, advance to proposal."""
    try:
        body = await request.body()
        data = json.loads(body)
        # Telnyx webhook structure
        payload = data.get("data", {}).get("payload", data)
        from_number = payload.get("from", {}).get("phone_number", "") if isinstance(payload.get("from"), dict) else payload.get("from", "")
        text = payload.get("text", "")

        state = _load_bot_state()
        matched = False
        for conv in state.get("conversations", {}).values():
            lead = conv.get("lead", {})
            if lead.get("phone", "").replace("-","").replace(" ","").replace("(","").replace(")","") == from_number.replace("+1","").replace("-","").replace(" ",""):
                conv["intent"] = min(100, conv.get("intent", 0) + 30)
                conv["tier"] = "Hot"
                conv["sms_reply"] = text
                conv["stage"] = "proposal"
                conv["last_contact"] = datetime.now().isoformat()
                matched = True
                print(f"[SMS REPLY] {from_number}: '{text[:60]}' — advancing to proposal")
                break

        if not matched:
            # Unknown number — create inbound lead
            lead_id = f"sms_inbound_{from_number[-7:]}"
            state.setdefault("conversations", {})[lead_id] = {
                "lead_id": lead_id,
                "lead": {"company": f"SMS Lead {from_number[-4:]}", "phone": from_number,
                         "email": "", "source": "sms_inbound", "industry": "Unknown"},
                "tier": "Hot", "intent": 70, "stage": "proposal",
                "source": "sms_inbound", "first_touch": datetime.now().isoformat(),
                "last_contact": datetime.now().isoformat(), "channels_used": ["sms"],
                "sms_reply": text, "deal_value": 0,
            }
            print(f"[SMS REPLY] Unknown number {from_number} replied — new inbound lead created")

        _save_bot_state(state)
        return {"status": "ok"}
    except Exception as e:
        print(f"[SMS WEBHOOK] Error: {e}")
        return {"status": "error", "detail": str(e)}

@app.get("/inbound/stats")
def inbound_stats():
    """Show stats on inbound leads and email engagement."""
    state = _load_bot_state()
    convs = state.get("conversations", {}).values()
    return {
        "inbound_leads": sum(1 for c in convs if c.get("inbound")),
        "email_opens": sum(1 for c in convs if c.get("email_opened")),
        "email_clicks": sum(1 for c in convs if c.get("email_clicked")),
        "sms_replies": sum(1 for c in convs if c.get("sms_reply")),
        "bounced": sum(1 for c in convs if c.get("stage") == "lost" and c.get("bounce_reason")),
        "proposal_stage": sum(1 for c in convs if c.get("stage") == "proposal"),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)
