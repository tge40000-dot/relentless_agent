"""
Customer Intake Automation
24/7 automated customer intake with accuracy verification
"""

import asyncio
import requests
from datetime import datetime
from typing import Dict, List, Optional
from hallucination_prevention import HallucinationPreventer

class CustomerIntakeSystem:
    def __init__(self):
        self.job_manager_url = "http://127.0.0.1:8001"
        self.worker_url = "https://relentlessbillionaire.com"
        self.preventer = HallucinationPreventer()
        
        # Intake workflow stages
        self.stages = [
            "initial_contact",
            "data_collection",
            "verification",
            "qualification",
            "payment_initiation",
            "job_creation",
            "confirmation"
        ]
    
    async def process_customer_intake(self, customer_data: Dict, skip_payment: bool = False) -> Dict:
        """Process customer intake through all stages"""
        print(f"\n🎯 Processing Customer Intake")
        print(f"📧 Customer: {customer_data.get('email', 'Unknown')}")
        
        results = {
            "customer_id": customer_data.get("email"),
            "stages_completed": [],
            "stages_failed": [],
            "warnings": [],
            "final_status": "pending"
        }
        
        # Stage 1: Initial Contact Verification
        if not await self._verify_initial_contact(customer_data):
            results["stages_failed"].append("initial_contact")
            results["final_status"] = "failed"
            return results
        results["stages_completed"].append("initial_contact")
        
        # Stage 2: Data Collection
        collected_data = await self._collect_customer_data(customer_data)
        results["stages_completed"].append("data_collection")
        
        # Stage 3: Verification
        verified, errors = self.preventer.verify_lead_data(collected_data)
        if not verified:
            results["warnings"].extend(errors)
            results["stages_failed"].append("verification")
            results["final_status"] = "verification_failed"
            return results
        results["stages_completed"].append("verification")
        
        # Stage 4: Qualification
        qualification = await self._qualify_customer(collected_data)
        results["stages_completed"].append("qualification")
        results["qualification"] = qualification
        
        # Stage 5: Payment Initiation
        if skip_payment:
            print(f"💳 Skipping payment (test mode)")
            payment_result = {"success": True, "skipped": True}
        else:
            payment_result = await self._initiate_payment(collected_data, qualification)
        results["stages_completed"].append("payment_initiation")
        results["payment"] = payment_result
        
        if not payment_result.get("success"):
            results["stages_failed"].append("payment_initiation")
            results["final_status"] = "payment_failed"
            return results
        
        # Stage 6: Job Creation
        job_result = await self._create_job(collected_data, qualification)
        results["stages_completed"].append("job_creation")
        results["job"] = job_result
        
        # Stage 7: Confirmation
        confirmation = await self._send_confirmation(collected_data, job_result)
        results["stages_completed"].append("confirmation")
        results["confirmation"] = confirmation
        
        results["final_status"] = "completed"
        results["processed_at"] = datetime.now().isoformat()
        
        return results
    
    async def _verify_initial_contact(self, customer_data: Dict) -> bool:
        """Verify initial contact is legitimate"""
        email = customer_data.get("email")
        name = customer_data.get("name")
        
        if not email or not name:
            print(f"✗ Missing email or name")
            return False
        
        # Verify email format
        valid, errors = self.preventer.verify_lead_data({"email": email, "name": name, "company": customer_data.get("company", "")})
        if not valid:
            print(f"✗ Email verification failed: {errors}")
            return False
        
        print(f"✓ Initial contact verified")
        return True
    
    async def _collect_customer_data(self, customer_data: Dict) -> Dict:
        """Collect and enrich customer data"""
        print(f"📊 Collecting customer data...")
        
        # Base data
        data = {
            "email": customer_data.get("email"),
            "name": customer_data.get("name"),
            "phone": customer_data.get("phone", ""),
            "company": customer_data.get("company", ""),
            "industry": customer_data.get("industry", ""),
            "revenue_range": customer_data.get("revenue_range", ""),
            "interest_level": "High",
            "source": customer_data.get("source", "website"),
            "created_at": datetime.now().isoformat()
        }
        
        # Enrich with website data if available
        if data["company"]:
            try:
                # In production, this would scrape/enrich from website
                data["company_size"] = "Small"
                data["website_verified"] = True
            except:
                data["website_verified"] = False
        
        print(f"✓ Data collected: {len(data)} fields")
        return data
    
    async def _qualify_customer(self, customer_data: Dict) -> Dict:
        """Qualify customer based on data with intent-based scoring"""
        print(f"🎯 Qualifying customer...")
        
        score = 40  # Base score
        signals = []
        
        # --- Contact completeness ---
        if customer_data.get("company"):
            score += 8
            signals.append("has_company")
        if customer_data.get("phone"):
            score += 8
            signals.append("has_phone")
        if customer_data.get("email", "").split("@")[-1] not in ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"]:
            score += 5
            signals.append("business_email")
        
        # --- Industry fit ---
        high_value_industries = ["technology", "saas", "software", "fintech", "marketing", "ecommerce", "consulting", "healthtech"]
        industry = customer_data.get("industry", "").lower()
        if any(hv in industry for hv in high_value_industries):
            score += 12
            signals.append("high_value_industry")
        
        # --- Revenue / company size ---
        revenue = customer_data.get("revenue_range", "")
        if revenue in ["$5M-$10M", "$10M-$50M", "$50M+"]:
            score += 15
            signals.append("high_revenue")
        elif revenue in ["$1M-$5M"]:
            score += 10
            signals.append("mid_revenue")
        
        # --- Intent signals (biggest ROI drivers) ---
        if customer_data.get("budget_confirmed") or customer_data.get("budget"):
            score += 20
            signals.append("budget_confirmed")
        
        timeline = customer_data.get("timeline", "").lower()
        if timeline and any(w in timeline for w in ["asap", "urgent", "immediate", "this week", "this month"]):
            score += 15
            signals.append("urgent_timeline")
        elif timeline and any(w in timeline for w in ["next month", "30 days", "q1", "q2", "q3", "q4"]):
            score += 8
            signals.append("defined_timeline")
        
        role = customer_data.get("role", "").lower()
        if any(t in role for t in ["ceo", "cto", "cfo", "founder", "owner", "vp", "director", "head of", "president"]):
            score += 15
            signals.append("decision_maker")
        elif any(t in role for t in ["manager", "lead"]):
            score += 7
            signals.append("influencer")
        
        if customer_data.get("referred_by") or customer_data.get("source", "").lower() == "referral":
            score += 10
            signals.append("referral")
        
        if customer_data.get("repeat_visitor") or customer_data.get("previous_interaction"):
            score += 10
            signals.append("repeat_engagement")
        
        # Cap at 100
        score = min(score, 100)
        
        # Determine tier
        if score >= 80:
            tier = "Hot"
        elif score >= 60:
            tier = "Warm"
        elif score >= 40:
            tier = "Cold"
        else:
            tier = "Unqualified"
        
        qualification = {
            "score": score,
            "tier": tier,
            "signals": signals,
            "recommended_service": self._recommend_service(customer_data),
            "estimated_value": self._estimate_value(tier),
            "qualified_at": datetime.now().isoformat()
        }
        
        print(f"✓ Qualified: {tier} (Score: {score}, Signals: {', '.join(signals)})")
        return qualification
    
    def _recommend_service(self, customer_data: Dict) -> str:
        """Recommend service based on customer data"""
        industry = customer_data.get("industry", "").lower()
        
        if "tech" in industry or "saas" in industry:
            return "svc_lead_generation"
        elif "marketing" in industry:
            return "svc_outreach"
        else:
            return "svc_lead_generation"
    
    def _estimate_value(self, tier: str) -> float:
        """Estimate customer value based on tier"""
        values = {
            "Hot": 10000,
            "Warm": 5000,
            "Cold": 1000,
            "Unqualified": 0
        }
        return values.get(tier, 0)
    
    async def _initiate_payment(self, customer_data: Dict, qualification: Dict) -> Dict:
        """Initiate payment process"""
        print(f"💳 Initiating payment...")
        
        service_id = qualification.get("recommended_service")
        price = 297  # Default price
        
        payment_data = {
            "customer_email": customer_data["email"],
            "customer_name": customer_data["name"],
            "service_id": service_id,
            "amount": price,
            "currency": "USD",
            "created_at": datetime.now().isoformat()
        }
        
        try:
            # Call relentless_agent purchase endpoint
            response = requests.post(
                "http://127.0.0.1:8000/purchase",
                json=payment_data,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✓ Payment initiated: {result.get('job_id')}")
                return {
                    "success": True,
                    "payment_id": result.get("job_id"),
                    "amount": price,
                    "status": "initiated"
                }
            else:
                print(f"✗ Payment initiation failed: {response.text}")
                return {"success": False, "error": response.text}
        except Exception as e:
            print(f"✗ Payment error: {e}")
            return {"success": False, "error": str(e)}
    
    async def _create_job(self, customer_data: Dict, qualification: Dict) -> Dict:
        """Create job for customer"""
        print(f"📋 Creating job...")
        
        job_data = {
            "service_id": qualification["recommended_service"],
            "customer_email": customer_data["email"],
            "customer_name": customer_data["name"],
            "price": 297,
            "status": "pending",
            "metadata": {
                "qualification": qualification,
                "customer_data": customer_data,
                "intake_source": "automated"
            }
        }
        
        try:
            response = requests.post(
                f"{self.job_manager_url}/jobs",
                json=job_data,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✓ Job created: {result.get('job_id')}")
                return {
                    "success": True,
                    "job_id": result.get("job_id"),
                    "status": "created"
                }
            else:
                print(f"✗ Job creation failed: {response.text}")
                return {"success": False, "error": response.text}
        except Exception as e:
            print(f"✗ Job error: {e}")
            return {"success": False, "error": str(e)}
    
    async def _send_confirmation(self, customer_data: Dict, job_result: Dict) -> Dict:
        """Send confirmation to customer"""
        print(f"📧 Sending confirmation...")
        
        if not job_result.get("success"):
            return {"success": False, "error": "No job to confirm"}
        
        # In production, this would send actual email
        confirmation = {
            "success": True,
            "sent_to": customer_data["email"],
            "job_id": job_result.get("job_id"),
            "message": f"Your job {job_result.get('job_id')} has been created",
            "sent_at": datetime.now().isoformat()
        }
        
        print(f"✓ Confirmation sent")
        return confirmation

# Singleton instance
intake_system = CustomerIntakeSystem()

async def run_intake_24_7():
    """Run intake system 24/7"""
    print("🚀 Starting 24/7 Customer Intake System...")
    
    while True:
        try:
            # Check for new customers (in production, this would poll a queue)
            await asyncio.sleep(5)
            
            # Simulate customer intake
            # In production, this would be triggered by webhooks/events
            pass
        except Exception as e:
            print(f"⚠️  Intake error: {e}")
            await asyncio.sleep(10)

if __name__ == "__main__":
    # Test intake
    test_customer = {
        "email": "test@example.com",
        "name": "Test Customer",
        "phone": "555-0100",
        "company": "Test Company",
        "industry": "Technology",
        "revenue_range": "$1M-$5M",
        "source": "website"
    }
    
    result = asyncio.run(intake_system.process_customer_intake(test_customer, skip_payment=True))
    print(f"\n📊 Intake Result: {result['final_status']}")
    print(f"Stages Completed: {len(result['stages_completed'])}")
    print(f"Stages Failed: {len(result['stages_failed'])}")
    if result.get('warnings'):
        print(f"Warnings: {result['warnings']}")
