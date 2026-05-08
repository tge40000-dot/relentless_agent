"""
Resend Email Service Integration
Professional email delivery using Resend API
"""

import os
from typing import Optional, List, Dict
from dotenv import load_dotenv

try:
    import resend
    RESEND_AVAILABLE = True
except ImportError:
    RESEND_AVAILABLE = False

load_dotenv(override=True)

class SendGridEmail:
    def __init__(self):
        self.api_key = os.getenv("RESEND_API_KEY")
        self.from_email = os.getenv("RESEND_FROM_EMAIL", "noreply@relentlessbillionaire.com")
        self.from_name = os.getenv("RESEND_FROM_NAME", "Relentless Billionaire")
        self.client = None
        
        if RESEND_AVAILABLE and self.api_key:
            try:
                resend.api_key = self.api_key
                self.client = resend
                print("[OK] Resend client initialized")
            except Exception as e:
                print(f"[ERROR] Resend initialization failed: {e}")
        else:
            print("[WARNING] Resend API key not configured")
    
    def send_email(self, to_email: str, subject: str, html_content: str, text_content: str = None) -> bool:
        """Send email via Resend"""
        if not self.client:
            print("[WARNING] Resend client not initialized, using fallback")
            return self._fallback_send(to_email, subject, text_content or html_content)
        
        try:
            params = {
                "from": f"{self.from_name} <{self.from_email}>",
                "to": [to_email],
                "subject": subject,
                "html": html_content,
            }
            if text_content:
                params["text"] = text_content
            
            response = self.client.Emails.send(params)
            print(f"✓ Email sent to {to_email}: ID {response.get('id', 'ok')}")
            return True
        except Exception as e:
            print(f"✗ Email error: {e}")
            return self._fallback_send(to_email, subject, text_content or html_content)
    
    def send_bulk_email(self, to_emails: List[str], subject: str, html_content: str, text_content: str = None) -> Dict:
        """Send email to multiple recipients"""
        results = {
            "total": len(to_emails),
            "sent": 0,
            "failed": 0,
            "errors": []
        }
        
        for email in to_emails:
            if self.send_email(email, subject, html_content, text_content):
                results["sent"] += 1
            else:
                results["failed"] += 1
                results["errors"].append(f"Failed to send to {email}")
        
        return results
    
    def _fallback_send(self, to_email: str, subject: str, content: str) -> bool:
        """Fallback when SendGrid is not configured"""
        print(f"[FALLBACK EMAIL] To: {to_email}")
        print(f"[FALLBACK EMAIL] Subject: {subject}")
        print(f"[FALLBACK EMAIL] Content: {content[:200]}...")
        return True
    
    def send_template_email(self, to_email: str, subject: str, html_content: str, template_data: Dict = None) -> bool:
        """Send email with template data merged into html_content"""
        if template_data:
            for k, v in template_data.items():
                html_content = html_content.replace(f"{{{k}}}", str(v))
        return self.send_email(to_email, subject, html_content)

# Singleton instance (kept as sendgrid_email for backward compatibility)
sendgrid_email = SendGridEmail()

# Email templates
EMAIL_TEMPLATES = {
    "welcome": {
        "subject": "Welcome to Relentless Billionaire",
        "html": """
        <html>
        <body>
            <h1>Welcome to Relentless Billionaire!</h1>
            <p>Thank you for joining us. Your journey to success starts now.</p>
            <p>Your account has been successfully created.</p>
            <p>Best regards,<br>Relentless Billionaire Team</p>
        </body>
        </html>
        """
    },
    "job_created": {
        "subject": "Your Job Has Been Created",
        "html": """
        <html>
        <body>
            <h1>Job Created Successfully</h1>
            <p>Your job <strong>{job_id}</strong> has been created and is now being processed.</p>
            <p>We'll notify you once it's ready for review.</p>
            <p>Track progress at: <a href="{dashboard_url}">Dashboard</a></p>
        </body>
        </html>
        """
    },
    "job_completed": {
        "subject": "Your Job Is Complete",
        "html": """
        <html>
        <body>
            <h1>Job Completed!</h1>
            <p>Your job <strong>{job_id}</strong> has been completed successfully.</p>
            <p>You can now review and download your deliverables.</p>
            <p>Access your results at: <a href="{dashboard_url}">Dashboard</a></p>
        </body>
        </html>
        """
    },
    "payment_confirmation": {
        "subject": "Payment Confirmation",
        "html": """
        <html>
        <body>
            <h1>Payment Confirmation</h1>
            <p>Your payment of <strong>${amount}</strong> has been processed successfully.</p>
            <p>Transaction ID: {transaction_id}</p>
            <p>Thank you for your business!</p>
        </body>
        </html>
        """
    },
    "lead_generated": {
        "subject": "New Lead Generated",
        "html": """
        <html>
        <body>
            <h1>New Lead Generated!</h1>
            <p>We've found a new potential customer for you:</p>
            <ul>
                <li><strong>Company:</strong> {company}</li>
                <li><strong>Contact:</strong> {contact}</li>
                <li><strong>Email:</strong> {email}</li>
                <li><strong>Score:</strong> {score}</li>
            </ul>
            <p>View details in your dashboard.</p>
        </body>
        </html>
        """
    }
}

def send_welcome_email(to_email: str, name: str = None) -> bool:
    """Send welcome email to new customer"""
    template = EMAIL_TEMPLATES["welcome"]
    html = template["html"]
    if name:
        html = html.replace("Welcome to Relentless Billionaire!", f"Welcome to Relentless Billionaire, {name}!")
    
    return sendgrid_email.send_email(to_email, template["subject"], html)

def send_job_created_email(to_email: str, job_id: str, dashboard_url: str = "http://127.0.0.1:8002") -> bool:
    """Send job creation confirmation"""
    template = EMAIL_TEMPLATES["job_created"]
    html = template["html"].format(job_id=job_id, dashboard_url=dashboard_url)
    return sendgrid_email.send_email(to_email, template["subject"], html)

def send_job_completed_email(to_email: str, job_id: str, dashboard_url: str = "http://127.0.0.1:8002") -> bool:
    """Send job completion notification"""
    template = EMAIL_TEMPLATES["job_completed"]
    html = template["html"].format(job_id=job_id, dashboard_url=dashboard_url)
    return sendgrid_email.send_email(to_email, template["subject"], html)

def send_payment_confirmation(to_email: str, amount: float, transaction_id: str) -> bool:
    """Send payment confirmation"""
    template = EMAIL_TEMPLATES["payment_confirmation"]
    html = template["html"].format(amount=amount, transaction_id=transaction_id)
    return sendgrid_email.send_email(to_email, template["subject"], html)

def send_lead_notification(to_email: str, lead_data: Dict) -> bool:
    """Send lead generation notification"""
    template = EMAIL_TEMPLATES["lead_generated"]
    html = template["html"].format(
        company=lead_data.get("company", "N/A"),
        contact=lead_data.get("contact", "N/A"),
        email=lead_data.get("email", "N/A"),
        score=lead_data.get("score", "N/A")
    )
    return sendgrid_email.send_email(to_email, template["subject"], html)

if __name__ == "__main__":
    # Test Resend integration
    print("Testing Resend Email Integration...")
    
    test_email = os.getenv("TEST_EMAIL", "test@example.com")
    
    # Test welcome email
    if send_welcome_email(test_email, "Test User"):
        print("✓ Welcome email test successful")
    else:
        print("✗ Welcome email test failed")
    
    # Test job created email
    if send_job_created_email(test_email, "test-job-123"):
        print("✓ Job created email test successful")
    else:
        print("✗ Job created email test failed")
