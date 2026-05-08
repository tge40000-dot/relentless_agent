"""
Hallucination Prevention System
Prevents AI from generating false or inaccurate information
"""

import re
from typing import Dict, List, Optional, Tuple
from datetime import datetime

class HallucinationPreventer:
    def __init__(self):
        # Known facts and constraints
        self.known_services = {
            "svc_lead_generation": "AI-powered lead generation",
            "svc_crm_intake": "Automated CRM data entry",
            "svc_crm_scoring": "Lead scoring and qualification",
            "svc_flyer_production": "Marketing flyer creation",
            "svc_outreach": "Automated outreach campaigns"
        }
        
        self.known_prices = {
            "svc_lead_generation": 297,
            "svc_crm_intake": 197,
            "svc_crm_scoring": 247,
            "svc_flyer_production": 147,
            "svc_outreach": 347
        }
        
        # Valid status transitions
        self.valid_transitions = {
            "pending": ["in_progress"],
            "in_progress": ["awaiting_approval", "failed"],
            "awaiting_approval": ["approved", "rejected"],
            "approved": ["completed", "delivered"],
            "rejected": ["pending"],
            "failed": ["pending"],
            "delivered": ["completed"]
        }
        
        # Fact verification patterns
        self.email_pattern = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
        self.phone_pattern = re.compile(r'^\+?[\d\s\-\(\)]{7,}$')
        self.price_pattern = re.compile(r'^\d+(\.\d{1,2})?$')
    
    def verify_lead_data(self, lead: Dict) -> Tuple[bool, List[str]]:
        """Verify lead data for accuracy"""
        errors = []
        
        # Verify email
        if "email" in lead:
            if not self.email_pattern.match(lead["email"]):
                errors.append(f"Invalid email: {lead['email']}")
        
        # Verify phone
        if "phone" in lead:
            if not self.phone_pattern.match(lead["phone"]):
                errors.append(f"Invalid phone: {lead['phone']}")
        
        # Verify score range
        if "score" in lead:
            if not (0 <= lead["score"] <= 100):
                errors.append(f"Invalid score: {lead['score']} (must be 0-100)")
        
        # Verify required fields
        required_fields = ["company", "name"]
        for field in required_fields:
            if field not in lead or not lead[field]:
                errors.append(f"Missing required field: {field}")
        
        return (len(errors) == 0, errors)
    
    def verify_service_data(self, service_id: str, data: Dict) -> Tuple[bool, List[str]]:
        """Verify service data against known facts"""
        errors = []
        
        # Verify service exists
        if service_id not in self.known_services:
            errors.append(f"Unknown service: {service_id}")
        
        # Verify price if provided
        if "price" in data:
            expected_price = self.known_prices.get(service_id)
            if expected_price and abs(float(data["price"]) - expected_price) > 50:
                errors.append(f"Price mismatch: expected ~${expected_price}, got ${data['price']}")
        
        return (len(errors) == 0, errors)
    
    def verify_status_transition(self, from_status: str, to_status: str) -> bool:
        """Verify status transition is valid"""
        if from_status not in self.valid_transitions:
            return False
        return to_status in self.valid_transitions[from_status]
    
    def verify_revenue_calculation(self, revenue_data: Dict) -> Tuple[bool, List[str]]:
        """Verify revenue calculation accuracy"""
        errors = []
        
        # Check that profit = revenue - cost
        if "total_revenue" in revenue_data and "total_cost" in revenue_data:
            expected_profit = revenue_data["total_revenue"] - revenue_data["total_cost"]
            if "total_profit" in revenue_data:
                actual_profit = revenue_data["total_profit"]
                if abs(actual_profit - expected_profit) > 0.01:
                    errors.append(f"Profit calculation error: expected {expected_profit}, got {actual_profit}")
        
        # Verify margin calculation
        if "total_profit" in revenue_data and "total_revenue" in revenue_data:
            if revenue_data["total_revenue"] > 0:
                expected_margin = revenue_data["total_profit"] / revenue_data["total_revenue"]
                if "profit_margin" in revenue_data:
                    actual_margin = revenue_data["profit_margin"]
                    if abs(actual_margin - expected_margin) > 0.01:
                        errors.append(f"Margin calculation error: expected {expected_margin}, got {actual_margin}")
        
        return (len(errors) == 0, errors)
    
    def detect_hallucination(self, output: str, context: Dict = None) -> Tuple[bool, str]:
        """Detect potential hallucination in AI output"""
        context = context or {}
        
        # Check for factual inconsistencies
        if "service" in output:
            for service_id, description in self.known_services.items():
                if service_id in output and description not in output:
                    return (True, f"Service description mismatch for {service_id}")
        
        # Check for impossible numbers
        numbers = re.findall(r'\d+(?:\.\d+)?', output)
        for num in numbers:
            n = float(num)
            if n > 1000000 and "revenue" not in context.get("context", ""):
                return (True, f"Suspiciously large number: {n}")
            if n < 0 and "cost" not in context.get("context", ""):
                return (True, f"Negative number without context: {n}")
        
        # Check for contradictory statements
        if "success" in output.lower() and "failed" in output.lower():
            return (True, "Contradictory statements found")
        
        return (False, "")
    
    def sanitize_output(self, output: str) -> str:
        """Sanitize AI output to remove potential hallucinations"""
        # Remove overly confident statements without evidence
        output = re.sub(r'(definitely|certainly|absolutely)\s+', '', output, flags=re.IGNORECASE)
        
        # Remove speculative claims
        output = re.sub(r'(probably|maybe|perhaps|might)\s+', '', output, flags=re.IGNORECASE)
        
        return output.strip()
    
    def add_verification_metadata(self, data: Dict) -> Dict:
        """Add verification metadata to data"""
        metadata = {
            "verified_at": datetime.now().isoformat(),
            "verification_status": "pending",
            "hallucination_check": "passed"
        }
        
        # Verify lead data if present
        if "leads" in data:
            all_valid = True
            lead_errors = []
            for lead in data["leads"]:
                valid, errors = self.verify_lead_data(lead)
                if not valid:
                    all_valid = False
                    lead_errors.extend(errors)
            
            metadata["leads_verified"] = all_valid
            metadata["lead_errors"] = lead_errors
        
        # Verify revenue if present
        if "total_revenue" in data:
            valid, errors = self.verify_revenue_calculation(data)
            metadata["revenue_verified"] = valid
            metadata["revenue_errors"] = errors
        
        data["verification_metadata"] = metadata
        return data

# Singleton instance
preventer = HallucinationPreventer()
