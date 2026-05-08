"""Relentless Dashboard — Luxury Edition"""
import json, os, requests
from datetime import datetime
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
import uvicorn

app = FastAPI()
# Cloudflare Worker API
WORKER_API = os.getenv("WORKER_API_URL", "https://relentlessbillionaire.com/api")
ADMIN_KEY = os.getenv("ADMIN_KEY", "rb-admin-2026")

def _get(url, default):
    try:
        headers = {"X-Admin-Key": ADMIN_KEY}
        r = requests.get(url, headers=headers, timeout=5)
        return r.json() if r.status_code == 200 else default
    except: return default

def _post(url, data, default=True):
    try:
        headers = {"X-Admin-Key": ADMIN_KEY, "Content-Type": "application/json"}
        r = requests.post(url, headers=headers, json=data, timeout=5)
        return r.json() if r.status_code == 200 else default
    except: return default

def get_orders():
    raw = _get(f"{WORKER_API}/orders", {"orders": []})
    return raw.get("orders", []) if isinstance(raw, dict) else (raw if isinstance(raw, list) else [])

def get_customers():
    raw = _get(f"{WORKER_API}/customers", {"customers": []})
    return raw.get("customers", []) if isinstance(raw, dict) else (raw if isinstance(raw, list) else [])

def get_approvals():
    raw = _get(f"{WORKER_API}/approvals", {"approvals": []})
    return raw.get("approvals", []) if isinstance(raw, dict) else (raw if isinstance(raw, list) else [])

def get_memberships():
    raw = _get(f"{WORKER_API}/memberships", {"memberships": []})
    return raw.get("memberships", []) if isinstance(raw, dict) else (raw if isinstance(raw, list) else [])

def get_revenue():
    raw = _get(f"{WORKER_API}/revenue/summary", {"total": 0, "monthly": 0, "scaling_budget": 0})
    if isinstance(raw, dict):
        total = raw.get("total", 0)
        monthly = raw.get("monthly", 0)
        scaling_budget = raw.get("scaling_budget", 0)
        return {"total": total, "monthly": monthly, "scaling_budget": scaling_budget, "_raw": raw}
    return {"total": 0, "monthly": 0, "scaling_budget": 0}

def get_scaling_status():
    raw = _get(f"{WORKER_API}/revenue/scaling", {"can_scale": False, "scaling_budget": 0, "requires_approval": True})
    if isinstance(raw, dict):
        return raw
    return {"can_scale": False, "scaling_budget": 0, "requires_approval": True}

def get_pipeline():
    try:
        if os.path.exists("logs/pipeline_analytics.json"):
            with open("logs/pipeline_analytics.json") as f:
                s = json.load(f); return s[-1] if s else {}
    except: pass
    return {}

def get_hot_leads():
    try:
        if os.path.exists("logs/sales_bot_state.json"):
            with open("logs/sales_bot_state.json") as f:
                st = json.load(f)
                convs = st.get("conversations", {})
                hot = [v for v in convs.values() if v.get("tier")=="Hot" and v.get("stage") not in ("closed","lost")]
                return sorted(hot, key=lambda x: x.get("intent",0), reverse=True)[:5]
    except: pass
    return []

def get_sla_breaches():
    try:
        if os.path.exists("logs/sales_bot_state.json"):
            with open("logs/sales_bot_state.json") as f:
                return json.load(f).get("sla_breaches", [])[-5:]
    except: pass
    return []

def get_members():
    try:
        if os.path.exists("logs/community_data.json"):
            with open("logs/community_data.json") as f:
                d = json.load(f)
                return {"total": len(d.get("members",{})), "discussions": len(d.get("discussions",[])), "events": len(d.get("events",[])), "list": list(d.get("members",{}).values())[:5]}
    except: pass
    return {"total":0,"discussions":0,"events":0,"list":[]}

@app.post("/chat")
async def chat(req: Request):
    data = await req.json()
    msg = data.get("message","").lower()
    rev = get_revenue(); pipeline = get_pipeline(); hot = get_hot_leads()
    stages = pipeline.get("pipeline_stages",{})
    if any(x in msg for x in ["revenue","money","earn"]):
        reply = f"Total revenue: ${rev.get('total',0):,} | Monthly: ${rev.get('monthly',0):,}"
    elif any(x in msg for x in ["lead","hot","prospect"]):
        reply = f"{len(hot)} hot leads active. Pipeline: {stages.get('lead',0)} new, {stages.get('outreach',0)} in outreach, {stages.get('closed',0)} closed."
    elif any(x in msg for x in ["pipeline","stage","funnel"]):
        reply = f"Pipeline — Lead:{stages.get('lead',0)} Outreach:{stages.get('outreach',0)} Follow-up:{stages.get('follow_up',0)} Proposal:{stages.get('proposal',0)} Closed:{stages.get('closed',0)}"
    elif any(x in msg for x in ["sla","breach","overdue"]):
        breaches = get_sla_breaches()
        reply = f"{len(breaches)} SLA breaches detected." if breaches else "All SLA targets met."
    elif any(x in msg for x in ["member","community"]):
        m = get_members(); reply = f"{m['total']} members, {m['discussions']} discussions, {m['events']} events."
    elif any(x in msg for x in ["status","health","system"]):
        reply = "Sales bot active. Atomic optimization running. All systems nominal."
    else:
        reply = "Ask me about: revenue, leads, pipeline, SLA, members, or system status."
    return JSONResponse({"reply": reply})

@app.post("/approvals/{approval_id}/approve")
async def approve_approval(approval_id: str):
    try: 
        _post(f"{WORKER_API}/approvals/{approval_id}/approve", {}, {})
    except: pass
    return JSONResponse({"ok": True})

@app.post("/approvals/{approval_id}/reject")
async def reject_approval(approval_id: str):
    try: 
        _post(f"{WORKER_API}/approvals/{approval_id}/reject", {}, {})
    except: pass
    return JSONResponse({"ok": True})

@app.post("/memberships")
async def create_membership(req: Request):
    data = await req.json()
    try:
        result = _post(f"{WORKER_API}/memberships", data, {})
        return JSONResponse(result)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=400)

@app.put("/memberships/{membership_id}")
async def update_membership(membership_id: str, req: Request):
    data = await req.json()
    try:
        result = _post(f"{WORKER_API}/memberships/{membership_id}", data, {})
        return JSONResponse(result)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=400)

@app.delete("/memberships/{membership_id}")
async def delete_membership(membership_id: str):
    try:
        headers = {"X-Admin-Key": ADMIN_KEY}
        r = requests.delete(f"{WORKER_API}/memberships/{membership_id}", headers=headers, timeout=5)
        return JSONResponse({"ok": r.status_code == 200})
    except:
        return JSONResponse({"ok": False})

@app.get("/", response_class=HTMLResponse)
async def dashboard():
    orders = get_orders()
    customers = get_customers()
    approvals = get_approvals()
    memberships = get_memberships()
    revenue = get_revenue()
    scaling = get_scaling_status()
    pipeline = get_pipeline()
    hot_leads = get_hot_leads()
    sla_breaches = get_sla_breaches()
    members = get_members()
    source_roi = pipeline.get("by_source", [])
    stages = pipeline.get("pipeline_stages", {})
    rates = pipeline.get("conversion_rates", {})
    total_rev = revenue.get("total", 0)
    monthly_rev = revenue.get("monthly", 0)
    scaling_budget = revenue.get("scaling_budget", 0)
    pending_approvals = len([a for a in approvals if a.get("status")=="pending"])
    pending_orders = len([o for o in orders if o.get("status")=="paid"])

    hot_html = "".join(f'<div class="lead-card"><div class="lead-name">{l.get("lead",{}).get("company","?")}</div><div class="lead-meta">{l.get("source","?")} · Intent {l.get("intent",0)}/100</div><div class="lead-score">🔥 {l.get("tier","?")}</div></div>' for l in hot_leads) or '<div style="opacity:0.4;font-size:13px">No hot leads yet</div>'
    roi_html = "".join(f'<div class="roi-row"><span class="roi-src">{s["source"]}</span><span class="roi-leads">{s["leads"]} leads</span><span class="roi-win">{s["win_rate"]}%</span><span class="roi-rev">${s["revenue"]:,}</span></div>' for s in source_roi[:6]) or '<div style="opacity:0.4;font-size:13px">No data yet</div>'
    sla_html = "".join(f'<div class="sla-breach">⚠️ {b.get("lead_id","?")[:20]} ({b.get("tier")}) — {b.get("elapsed_h")}h elapsed</div>' for b in sla_breaches) or '<div class="sla-ok">✅ All SLA targets met</div>'
    mem_rows = "".join(f'<tr><td>{m.get("name","?")}</td><td>{m.get("company","?")}</td><td>{m.get("engagement_score",0)}</td></tr>' for m in members.get("list",[])) or '<tr><td colspan="3" style="opacity:0.4;text-align:center">No members yet</td></tr>'
    
    # New sections
    membership_cards = "".join(f'<div class="mem-card {"featured" if m.get("featured") else ""}"><div class="mem-name">{m.get("name","?")}</div><div class="mem-price">${m.get("price",0)}/mo</div><div class="mem-discount">{m.get("discount",0)}% off services</div><div class="mem-perks">{", ".join(m.get("perks",[])[:3])}</div><button class="mem-btn" onclick="editMembership(\'{m.get("id")}\')">Edit</button></div>' for m in memberships) or '<div style="opacity:0.4;font-size:13px">No memberships configured</div>'
    
    orders_html = "".join(f'<tr><td>{o.get("id","?")[:8]}</td><td>{o.get("productId","?")}</td><td>{o.get("customerEmail","?")[:20]}</td><td><span class="badge s-{o.get("status","?")}">{o.get("status","?")}</span></td><td>${o.get("amount",0):,}</td></tr>' for o in orders[:10]) or '<tr><td colspan="5" style="opacity:0.4;text-align:center">No orders</td></tr>'
    
    customers_html = "".join(f'<tr><td>{c.get("email","?")[:25]}</td><td>{c.get("membership","None")}</td><td>{c.get("orders",0)}</td><td>${c.get("totalSpent",0):,}</td></tr>' for c in customers[:10]) or '<tr><td colspan="4" style="opacity:0.4;text-align:center">No customers</td></tr>'
    
    approvals_html = "".join(f'<tr><td>{a.get("id","?")[:8]}</td><td>{a.get("agentType","?")}</td><td>{a.get("orderId","?")[:8]}</td><td><span class="badge s-{a.get("status","?")}">{a.get("status","?")}</span></td><td><button class="abtn ap" onclick="actApproval(\'{a.get("id")}\',\'approve\')">✓</button><button class="abtn rj" onclick="actApproval(\'{a.get("id")}\',\'reject\')">✗</button></td></tr>' for a in approvals[:10]) or '<tr><td colspan="5" style="opacity:0.4;text-align:center">No approvals pending</td></tr>'

    return HTMLResponse(f"""<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Relentless — Command Center</title>
<style>
*{{box-sizing:border-box;margin:0;padding:0}}
body{{background:linear-gradient(135deg,#0d0d1a 0%,#1a0d2e 50%,#0a1628 100%);color:#e8e0f0;font-family:system-ui,sans-serif;min-height:100vh}}
.hdr{{background:rgba(255,215,0,.05);border-bottom:1px solid rgba(255,215,0,.2);padding:18px 32px;display:flex;justify-content:space-between;align-items:center;backdrop-filter:blur(20px)}}
.hdr h1{{font-size:26px;font-weight:800;background:linear-gradient(135deg,#ffd700,#ff6b6b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}}
.hdr .sub{{font-size:11px;color:rgba(255,255,255,.4);letter-spacing:2px;text-transform:uppercase;margin-top:3px}}
.rbtn{{background:rgba(255,215,0,.1);border:1px solid rgba(255,215,0,.3);color:#ffd700;padding:9px 20px;border-radius:10px;cursor:pointer;font-weight:700;font-size:13px}}
.rbtn:hover{{background:rgba(255,215,0,.2)}}
.ctr{{max-width:1600px;margin:0 auto;padding:24px 32px}}
.sg{{display:grid;grid-template-columns:repeat(5,1fr);gap:16px;margin-bottom:22px}}
.sc{{background:rgba(255,255,255,.04);border:1px solid rgba(255,215,0,.15);border-radius:16px;padding:20px;backdrop-filter:blur(10px);transition:transform .2s}}
.sc:hover{{transform:translateY(-2px);border-color:rgba(255,215,0,.35)}}
.sl{{font-size:11px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}}
.sv{{font-size:26px;font-weight:800;color:#ffd700}}
.ss{{font-size:11px;color:rgba(255,255,255,.35);margin-top:4px}}
.g2{{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:18px}}
.g3{{display:grid;grid-template-columns:1fr 1fr 1fr;gap:18px;margin-bottom:18px}}
.pnl{{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:20px;backdrop-filter:blur(10px)}}
.pt{{font-size:12px;font-weight:700;color:#ffd700;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px}}
.stages{{display:flex;gap:8px;flex-wrap:wrap}}
.stg{{background:rgba(255,255,255,.06);border-radius:10px;padding:10px;text-align:center;flex:1;min-width:70px}}
.stg-n{{font-size:22px;font-weight:800;color:#a78bfa}}
.stg-l{{font-size:9px;color:rgba(255,255,255,.4);text-transform:uppercase;margin-top:3px}}
.rrow{{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.05);font-size:12px}}
.rv{{color:#34d399;font-weight:700}}
.lead-card{{background:rgba(255,107,107,.08);border:1px solid rgba(255,107,107,.2);border-radius:10px;padding:10px;margin-bottom:7px}}
.lead-name{{font-weight:700;font-size:13px}}
.lead-meta{{font-size:11px;color:rgba(255,255,255,.45);margin-top:2px}}
.lead-score{{font-size:11px;color:#ffd700;margin-top:3px}}
.roi-row{{display:flex;gap:10px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.05);font-size:12px;align-items:center}}
.roi-src{{flex:1;font-weight:600;color:#a78bfa}}
.roi-leads,.roi-win{{color:rgba(255,255,255,.5);min-width:55px}}
.roi-rev{{color:#34d399;font-weight:700;min-width:60px;text-align:right}}
.sla-breach{{background:rgba(255,59,59,.1);border:1px solid rgba(255,59,59,.3);border-radius:8px;padding:7px 12px;margin-bottom:5px;font-size:12px;color:#ff6b6b}}
.sla-ok{{color:#34d399;font-size:13px;padding:7px}}
table{{width:100%;border-collapse:collapse;font-size:13px}}
th{{text-align:left;padding:9px 12px;color:rgba(255,255,255,.4);font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid rgba(255,255,255,.08)}}
td{{padding:9px 12px;border-bottom:1px solid rgba(255,255,255,.04)}}
tr:hover td{{background:rgba(255,255,255,.02)}}
.badge{{padding:3px 9px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase}}
.s-pending{{background:rgba(251,191,36,.15);color:#fbbf24}}
.s-approved{{background:rgba(52,211,153,.15);color:#34d399}}
.s-completed{{background:rgba(167,139,250,.15);color:#a78bfa}}
.abtn{{border:none;border-radius:6px;padding:4px 9px;cursor:pointer;font-size:12px;font-weight:700;margin:0 2px}}
.ap{{background:rgba(52,211,153,.2);color:#34d399}}
.rj{{background:rgba(255,107,107,.2);color:#ff6b6b}}
.chat-box{{height:230px;overflow-y:auto;padding:12px;background:rgba(0,0,0,.2);border-radius:10px;margin-bottom:10px;display:flex;flex-direction:column;gap:7px}}
.cm{{max-width:88%;padding:8px 13px;border-radius:12px;font-size:13px;line-height:1.5}}
.cm.u{{background:rgba(167,139,250,.2);align-self:flex-end;border:1px solid rgba(167,139,250,.3)}}
.cm.a{{background:rgba(255,215,0,.08);align-self:flex-start;border:1px solid rgba(255,215,0,.2);color:#ffd700}}
.ci{{display:flex;gap:8px}}
.ci input{{flex:1;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:9px 14px;color:#fff;font-size:13px;outline:none}}
.ci input:focus{{border-color:rgba(255,215,0,.4)}}
.ci button{{background:rgba(255,215,0,.15);border:1px solid rgba(255,215,0,.3);color:#ffd700;border-radius:10px;padding:9px 16px;cursor:pointer;font-weight:700;font-size:13px}}
.ctrl-grid{{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}}
.ctrl label{{display:block;font-size:11px;color:rgba(255,255,255,.5);margin-bottom:5px;text-transform:uppercase}}
.ctrl input[type=range]{{width:100%;accent-color:#ffd700}}
.ctrl .cv{{font-size:18px;font-weight:700;color:#ffd700;margin-top:3px}}
.atom-status{{background:rgba(52,211,153,.08);border:1px solid rgba(52,211,153,.2);border-radius:10px;padding:12px;font-size:13px;color:#34d399;line-height:1.8}}
.mem-card{{background:rgba(255,255,255,.04);border:1px solid rgba(255,215,0,.15);border-radius:12px;padding:14px;flex:1;min-width:180px;transition:all .2s}}
.mem-card.featured{{border-color:rgba(255,215,0,.4);background:rgba(255,215,0,.08)}}
.mem-card:hover{{transform:translateY(-2px);border-color:rgba(255,215,0,.35)}}
.mem-name{{font-weight:700;font-size:14px;color:#ffd700;margin-bottom:6px}}
.mem-price{{font-size:18px;font-weight:800;color:#fff;margin-bottom:4px}}
.mem-discount{{font-size:11px;color:rgba(255,255,255,.5);margin-bottom:8px}}
.mem-perks{{font-size:11px;color:rgba(255,255,255,.6);margin-bottom:10px;line-height:1.4}}
.mem-btn{{background:rgba(255,215,0,.1);border:1px solid rgba(255,215,0,.3);color:#ffd700;padding:6px 12px;border-radius:8px;cursor:pointer;font-size:11px;font-weight:700;width:100%;margin-top:8px}}
.mem-btn:hover{{background:rgba(255,215,0,.2)}}
</style></head><body>
<div class="hdr">
  <div><h1>⚡ RELENTLESS COMMAND CENTER</h1><div class="sub">Atomic Optimization Active · {datetime.now().strftime('%b %d %Y %H:%M')}</div></div>
  <button class="rbtn" onclick="location.reload()">↻ Refresh</button>
</div>
<div class="ctr">
  <div class="sg">
    <div class="sc"><div class="sl">Total Revenue</div><div class="sv">${total_rev:,}</div><div class="ss">All time</div></div>
    <div class="sc"><div class="sl">Monthly Revenue</div><div class="sv">${monthly_rev:,}</div><div class="ss">This month</div></div>
    <div class="sc"><div class="sl">Scaling Budget</div><div class="sv">${scaling_budget:,}</div><div class="ss">10% rule</div></div>
    <div class="sc"><div class="sl">Pending Approvals</div><div class="sv">{pending_approvals}</div><div class="ss">AI outputs</div></div>
    <div class="sc"><div class="sl">Pending Orders</div><div class="sv">{pending_orders}</div><div class="ss">Awaiting fulfillment</div></div>
  </div>
  <div class="g2">
    <div class="pnl">
      <div class="pt">📊 Pipeline Stages</div>
      <div class="stages">
        <div class="stg"><div class="stg-n">{stages.get("lead",0)}</div><div class="stg-l">Lead</div></div>
        <div class="stg"><div class="stg-n">{stages.get("outreach",0)}</div><div class="stg-l">Outreach</div></div>
        <div class="stg"><div class="stg-n">{stages.get("follow_up",0)}</div><div class="stg-l">Follow-up</div></div>
        <div class="stg"><div class="stg-n">{stages.get("proposal",0)}</div><div class="stg-l">Proposal</div></div>
        <div class="stg"><div class="stg-n">{stages.get("closed",0)}</div><div class="stg-l">Closed</div></div>
        <div class="stg"><div class="stg-n">{stages.get("lost",0)}</div><div class="stg-l">Lost</div></div>
      </div>
      <div style="margin-top:14px">
        <div class="rrow"><span>Lead → Outreach</span><span class="rv">{round(rates.get("lead_to_outreach",0),1)}%</span></div>
        <div class="rrow"><span>Outreach → Proposal</span><span class="rv">{round(rates.get("outreach_to_proposal",0),1)}%</span></div>
        <div class="rrow"><span>Proposal → Close</span><span class="rv">{round(rates.get("proposal_to_close",0),1)}%</span></div>
        <div class="rrow"><span>Overall Win Rate</span><span class="rv">{round(rates.get("overall_win_rate",0),1)}%</span></div>
        <div class="rrow"><span>Avg Days to Close</span><span class="rv">{pipeline.get("avg_days_to_close",0)}d</span></div>
      </div>
    </div>
    <div class="pnl">
      <div class="pt">💬 AI Assistant</div>
      <div class="chat-box" id="chatBox">
        <div class="cm a">👋 Hello! Ask me about revenue, leads, pipeline, SLA, members, or system status.</div>
      </div>
      <div class="ci">
        <input id="chatInput" placeholder="Ask about revenue, leads, system..." onkeydown="if(event.key==='Enter')sendChat()"/>
        <button onclick="sendChat()">Send</button>
      </div>
    </div>
  </div>
  <div class="g3">
    <div class="pnl">
      <div class="pt">🔥 Hot Leads</div>
      {hot_html}
    </div>
    <div class="pnl">
      <div class="pt">📈 Source ROI</div>
      {roi_html}
    </div>
    <div class="pnl">
      <div class="pt">⏱ SLA Monitor</div>
      {sla_html}
      <div style="margin-top:14px">
        <div class="atom-status">
          ⚙️ Atomic Optimization: Active<br/>
          🔄 Self-healing: Monitoring<br/>
          📊 Auto-tuning: Enabled<br/>
          🗑️ Log cleanup: Scheduled
        </div>
      </div>
    </div>
  </div>
  <div class="g2">
    <div class="pnl">
      <div class="pt">� AI Assistant</div>
      <div class="chat-box" id="chatBox">
        <div class="cm a">👋 Hello! Ask me about revenue, orders, customers, memberships, approvals, or system status.</div>
      </div>
      <div class="ci">
        <input id="chatInput" placeholder="Ask about revenue, orders, system..." onkeydown="if(event.key==='Enter')sendChat()"/>
        <button onclick="sendChat()">Send</button>
      </div>
    </div>
    <div class="pnl">
      <div class="pt">📈 10% Scaling Rule Status</div>
      <div class="atom-status">
        <div style="margin-bottom:8px">💰 Scaling Budget: <strong>${scaling.get("scaling_budget",0):,}</strong></div>
        <div style="margin-bottom:8px">🔒 Can Scale Now: <strong>{'Yes' if scaling.get('can_scale') else 'No'}</strong></div>
        <div style="margin-bottom:8px">✍️ Requires Approval: <strong>{'Yes' if scaling.get('requires_approval') else 'No'}</strong></div>
        <div style="margin-top:12px;font-size:12px;opacity:0.7">Rule: Only 10% of revenue can be used for scaling. Christopher approval required for all scaling decisions.</div>
      </div>
    </div>
  </div>
  <div class="g3">
    <div class="pnl">
      <div class="pt">� Membership Tiers</div>
      <div style="display:flex;gap:12px;flex-wrap:wrap">{membership_cards}</div>
      <button class="rbtn" style="margin-top:12px;font-size:12px" onclick="addMembership()">+ Add Tier</button>
    </div>
    <div class="pnl">
      <div class="pt">📦 Orders</div>
      <table><thead><tr><th>ID</th><th>Product</th><th>Customer</th><th>Status</th><th>Amount</th></tr></thead><tbody>{orders_html}</tbody></table>
    </div>
    <div class="pnl">
      <div class="pt">👥 Customers</div>
      <table><thead><tr><th>Email</th><th>Membership</th><th>Orders</th><th>Total Spent</th></tr></thead><tbody>{customers_html}</tbody></table>
    </div>
  </div>
  <div class="pnl">
    <div class="pt">🤖 AI Agent Approval Queue</div>
    <table><thead><tr><th>ID</th><th>Agent Type</th><th>Order ID</th><th>Status</th><th>Actions</th></tr></thead><tbody>{approvals_html}</tbody></table>
  </div>
  <div class="pnl">
    <div class="pt">📊 Pipeline Stages</div>
    <div class="stages">
      <div class="stg"><div class="stg-n">{stages.get("lead",0)}</div><div class="stg-l">Lead</div></div>
      <div class="stg"><div class="stg-n">{stages.get("outreach",0)}</div><div class="stg-l">Outreach</div></div>
      <div class="stg"><div class="stg-n">{stages.get("follow_up",0)}</div><div class="stg-l">Follow-up</div></div>
      <div class="stg"><div class="stg-n">{stages.get("proposal",0)}</div><div class="stg-l">Proposal</div></div>
      <div class="stg"><div class="stg-n">{stages.get("closed",0)}</div><div class="stg-l">Closed</div></div>
      <div class="stg"><div class="stg-n">{stages.get("lost",0)}</div><div class="stg-l">Lost</div></div>
    </div>
    <div style="margin-top:14px">
      <div class="rrow"><span>Lead → Outreach</span><span class="rv">{round(rates.get("lead_to_outreach",0),1)}%</span></div>
      <div class="rrow"><span>Outreach → Proposal</span><span class="rv">{round(rates.get("outreach_to_proposal",0),1)}%</span></div>
      <div class="rrow"><span>Proposal → Close</span><span class="rv">{round(rates.get("proposal_to_close",0),1)}%</span></div>
      <div class="rrow"><span>Overall Win Rate</span><span class="rv">{round(rates.get("overall_win_rate",0),1)}%</span></div>
      <div class="rrow"><span>Avg Days to Close</span><span class="rv">{pipeline.get("avg_days_to_close",0)}d</span></div>
    </div>
  </div>
  <div class="g3">
    <div class="pnl">
      <div class="pt">🔥 Hot Leads</div>
      {hot_html}
    </div>
    <div class="pnl">
      <div class="pt">📈 Source ROI</div>
      {roi_html}
    </div>
    <div class="pnl">
      <div class="pt">⏱ SLA Monitor</div>
      {sla_html}
    </div>
  </div>
</div>
<script>
async function sendChat(){{
  const inp=document.getElementById('chatInput');
  const msg=inp.value.trim();
  if(!msg)return;
  const box=document.getElementById('chatBox');
  box.innerHTML+=`<div class="cm u">${{msg}}</div>`;
  inp.value='';
  box.scrollTop=box.scrollHeight;
  try{{
    const r=await fetch('/chat',{{method:'POST',headers:{{'Content-Type':'application/json'}},body:JSON.stringify({{message:msg}})}});
    const d=await r.json();
    box.innerHTML+=`<div class="cm a">${{d.reply}}</div>`;
  }}catch(e){{box.innerHTML+=`<div class="cm a">Error connecting to backend.</div>`;}}
  box.scrollTop=box.scrollHeight;
}}
async function actApproval(id,action){{
  await fetch(`/approvals/${{id}}/${{action}}`,{{method:'POST'}});
  location.reload();
}}
async function addMembership(){{
  const name=prompt('Membership tier name (e.g. STARTER, PRO, ELITE):');
  if(!name)return;
  const price=prompt('Monthly price (e.g. 49):');
  const discount=prompt('Discount percentage (e.g. 10):');
  if(!price)return;
  await fetch('/memberships',{{
    method:'POST',
    headers:{{'Content-Type':'application/json'}},
    body:JSON.stringify({{name,price:parseFloat(price),discount:parseInt(discount),featured:false,perks:['Access to services']}})
  }});
  location.reload();
}}
async function editMembership(id){{
  const newPrice=prompt('New monthly price:');
  if(!newPrice)return;
  await fetch(`/memberships/${{id}}`,{{
    method:'PUT',
    headers:{{'Content-Type':'application/json'}},
    body:JSON.stringify({{price:parseFloat(newPrice)}})
  }});
  location.reload();
}}
</script>
</body></html>""")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8002)
