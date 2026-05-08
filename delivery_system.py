import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, List
import requests

WORKER_URL = "https://relentlessbillionaire.com"
ADMIN_KEY = "rb-admin-2026"

class DeliverySystem:
    def __init__(self):
        self.worker_url = WORKER_URL
        self.admin_key = ADMIN_KEY
    
    def get_job(self, job_id: str) -> Dict:
        """Get job details"""
        try:
            response = requests.get(
                f"{self.worker_url}/api/content/jobs",
                headers={"X-Admin-Key": self.admin_key},
                timeout=10
            )
            if response.status_code == 200:
                jobs = response.json()
                return next((j for j in jobs if j.get("id") == job_id), None)
            return None
        except:
            return None
    
    def send_delivery_email(self, job: Dict, smtp_config: Dict):
        """Send delivery email to customer"""
        customer_email = job.get("customer_email")
        customer_name = job.get("customer_name")
        service_id = job.get("service_id")
        deliverables = job.get("deliverables", [])
        bot_output = job.get("bot_output", {})
        
        if not customer_email:
            print("No customer email found")
            return False
        
        # Create email
        msg = MIMEMultipart()
        msg["From"] = smtp_config["email"]
        msg["To"] = customer_email
        msg["Subject"] = f"Your Order is Ready - {service_id}"
        
        body = f"""
Hi {customer_name},

Your order has been completed and is ready for delivery!

Service: {service_id}
Order ID: {job.get('id')}

Deliverables:
{chr(10).join(f'- {d}' for d in deliverables) if deliverables else 'See attached files'}

If you have any questions, please reply to this email.

Best regards,
Relentless Billionaire Team
"""
        
        msg.attach(MIMEText(body, "plain"))
        
        try:
            with smtplib.SMTP(smtp_config["server"], smtp_config["port"]) as server:
                server.starttls()
                server.login(smtp_config["email"], smtp_config["password"])
                server.sendmail(smtp_config["email"], [customer_email], msg.as_string())
            print(f"Delivery email sent to {customer_email}")
            return True
        except Exception as e:
            print(f"Failed to send delivery email: {e}")
            return False
    
    def mark_delivered(self, job_id: str):
        """Mark job as delivered"""
        try:
            jobs_response = requests.get(
                f"{self.worker_url}/api/content/jobs",
                headers={"X-Admin-Key": self.admin_key},
                timeout=10
            )
            if jobs_response.status_code == 200:
                jobs = jobs_response.json()
                for job in jobs:
                    if job.get("id") == job_id:
                        job["status"] = "delivered"
                        job["delivered_at"] = datetime.now().isoformat()
                        requests.post(
                            f"{self.worker_url}/api/content/jobs",
                            json=jobs,
                            headers={"X-Admin-Key": self.admin_key},
                            timeout=30
                        )
                        return True
        except Exception as e:
            print(f"Failed to mark job as delivered: {e}")
        return False
    
    def deliver_job(self, job_id: str, smtp_config: Dict):
        """Complete delivery workflow"""
        job = self.get_job(job_id)
        if not job:
            print("Job not found")
            return False
        
        if job.get("status") != "approved":
            print("Job must be approved before delivery")
            return False
        
        # Send delivery email
        if self.send_delivery_email(job, smtp_config):
            # Mark as delivered
            self.mark_delivered(job_id)
            return True
        
        return False

delivery = DeliverySystem()
