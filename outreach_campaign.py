"""
Direct Outreach Campaign - Send emails to generated leads via Worker API
"""
import json
import os
import httpx
from datetime import datetime

# Load leads
with open("leads_20260416_111956.json", "r") as f:
    leads = json.load(f)

# Worker API
WORKER_API = "https://relentlessbillionaire.com/api/notifications/send"
ADMIN_KEY = "MomandDad197054"

# Payment links
PAYMENT_LINKS = {
    "lead_gen": "https://buy.stripe.com/28E3cu9bveDQcn34Df6oo02",
    "flyer": "https://buy.stripe.com/cNi28q9bv9jwbiZ0mZ6oo03",
    "outreach": "https://buy.stripe.com/28E14mcnHfHUaeVedP6oo04",
    "consulting": "https://buy.stripe.com/5kQaEW0EZ9jw86Nb1D6oo05"
}

# Email template
EMAIL_HTML = """
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 40px; border-radius: 8px;">
<h1 style="color: #D4AF37; margin-bottom: 8px;">RELENTLESS BILLIONAIRE</h1>
<h2 style="margin-top: 0;">AI-Powered Growth for {company}</h2>
<p>Hi {contact},</p>
<p>I'm reaching out to {company} because we're helping businesses like yours scale with AI-powered automation, marketing, and business consulting.</p>
<p><strong>Our services:</strong></p>
<ul>
<li>AI Lead Generation - $500 (50-100 qualified leads)</li>
<li>Custom Event Flyer Design - $200</li>
<li>Targeted Outreach Campaign - $1,000</li>
<li>1-on-1 Business Consulting - $2,000</li>
</ul>
<p><strong>Membership tiers for ongoing support:</strong></p>
<ul>
<li>STARTER ($49/mo) - 10% off all services</li>
<li>PRO ($199/mo) - 25% off all services</li>
<li>ELITE ($499/mo) - 40% off all services</li>
</ul>
<p><strong>Payment links:</strong></p>
<ul>
<li><a href="{lead_gen}" style="color: #D4AF37;">Lead Generation</a></li>
<li><a href="{flyer}" style="color: #D4AF37;">Flyer Design</a></li>
<li><a href="{outreach}" style="color: #D4AF37;">Outreach Campaign</a></li>
<li><a href="{consulting}" style="color: #D4AF37;">Consulting</a></li>
</ul>
<p>Would you be interested in a quick call to discuss how we can help {company} grow?</p>
<p style="color: #D4AF37; font-weight: bold; margin-top: 32px;">— Christopher<br>Relentless Billionaire<br><a href="https://relentlessbillionaire.com" style="color: #D4AF37;">https://relentlessbillionaire.com</a></p>
</div>
"""

async def send_email(to_email, subject, html):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            WORKER_API,
            headers={
                "X-Admin-Key": ADMIN_KEY,
                "Content-Type": "application/json"
            },
            json={
                "to": to_email,
                "subject": subject,
                "html": html
            }
        )
        return response.json()

async def main():
    print(f"Starting outreach to {len(leads)} leads...")
    
    # Deduplicate leads by email
    unique_leads = {}
    for lead in leads:
        if lead.get("email") and "@" in lead["email"]:
            if lead["email"] not in unique_leads:
                unique_leads[lead["email"]] = lead
    
    print(f"Unique leads with valid emails: {len(unique_leads)}")
    
    # Send emails (limit to first 10 for testing)
    sent = 0
    for email, lead in list(unique_leads.items())[:10]:
        company = lead.get("company", "your company")
        contact = lead.get("contact", "Owner")
        
        subject = f"AI-Powered Growth for {company}"
        html = EMAIL_HTML.format(
            company=company,
            contact=contact,
            lead_gen=PAYMENT_LINKS["lead_gen"],
            flyer=PAYMENT_LINKS["flyer"],
            outreach=PAYMENT_LINKS["outreach"],
            consulting=PAYMENT_LINKS["consulting"]
        )
        
        try:
            result = await send_email(email, subject, html)
            if result.get("success"):
                print(f"✓ Sent to {email} ({company})")
                sent += 1
            else:
                print(f"✗ Failed to send to {email}: {result}")
        except Exception as e:
            print(f"✗ Error sending to {email}: {e}")
    
    print(f"\nOutreach complete: {sent} emails sent")

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
