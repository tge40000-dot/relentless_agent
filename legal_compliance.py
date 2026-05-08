"""
Legal Compliance Module
Ensures all operations are legal and compliant with GDPR, CAN-SPAM, and other regulations
"""

import os
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dotenv import load_dotenv

load_dotenv(override=True)

class LegalCompliance:
    """
    Legal compliance checker that ensures:
    - GDPR compliance (EU data protection)
    - CAN-SPAM compliance (US email marketing)
    - TCPA compliance (US SMS marketing)
    - Terms of service compliance
    - Data privacy compliance
    """
    
    def __init__(self):
        self.gdpr_compliant = True
        self.can_spam_compliant = True
        self.tcpa_compliant = True
        self.consent_records = {}
        self.opt_out_list = set()
        self.do_not_call_list = set()
        
        # Load existing compliance data
        self._load_compliance_data()
    
    def check_gdpr_compliance(self, lead: Dict, consent_given: bool = False) -> Tuple[bool, List[str]]:
        """
        Check GDPR compliance for lead processing
        GDPR requires: lawful basis, data minimization, purpose limitation
        """
        issues = []
        
        # Check for lawful basis
        if not consent_given and not lead.get('consent_given', False):
            issues.append("No lawful basis for processing - consent required")
        
        # Check data minimization
        required_fields = ['company', 'industry']
        for field in required_fields:
            if field not in lead:
                issues.append(f"Missing required field: {field}")
        
        # Check for unnecessary data collection
        sensitive_fields = ['ssn', 'credit_card', 'bank_account']
        for field in sensitive_fields:
            if field in lead:
                issues.append(f"Unnecessary sensitive data: {field}")
        
        # Check data retention
        if lead.get('collected_date'):
            collected = datetime.fromisoformat(lead['collected_date'])
            retention_period = timedelta(days=365)  # 1 year retention
            if datetime.now() - collected > retention_period:
                issues.append("Data retention period exceeded")
        
        is_compliant = len(issues) == 0
        return is_compliant, issues
    
    def check_can_spam_compliance(self, email: Dict) -> Tuple[bool, List[str]]:
        """
        Check CAN-SPAM compliance for email marketing
        CAN-SPAM requires: clear opt-out, physical address, accurate headers
        """
        issues = []
        
        # Check opt-out mechanism
        if not email.get('unsubscribe_link'):
            issues.append("Missing unsubscribe link")
        
        # Check physical address
        if not email.get('physical_address'):
            issues.append("Missing physical address in footer")
        
        # Check accurate headers
        if not email.get('from_address'):
            issues.append("Missing from address")
        
        if not email.get('subject'):
            issues.append("Missing subject line")
        
        # Check for misleading subject
        subject = email.get('subject', '')
        if 'free' in subject.lower() and not email.get('actually_free', False):
            issues.append("Misleading subject line - 'free' claim")
        
        is_compliant = len(issues) == 0
        return is_compliant, issues
    
    def check_tcpa_compliance(self, sms: Dict) -> Tuple[bool, List[str]]:
        """
        Check TCPA compliance for SMS marketing
        TCPA requires: express consent, opt-out mechanism
        """
        issues = []
        
        # Check express consent
        if not sms.get('consent_given', False):
            issues.append("No express consent for SMS")
        
        # Check opt-out mechanism
        if not sms.get('opt_out_instruction'):
            issues.append("Missing opt-out instruction (e.g., 'Reply STOP')")
        
        # Check time restrictions (8 AM - 9 PM recipient's local time)
        if sms.get('send_time'):
            send_hour = datetime.fromisoformat(sms['send_time']).hour
            if send_hour < 8 or send_hour >= 21:
                issues.append("SMS sent outside allowed hours (8 AM - 9 PM)")
        
        is_compliant = len(issues) == 0
        return is_compliant, issues
    
    def record_consent(self, lead_id: str, consent_type: str, timestamp: str = None):
        """Record consent for a lead"""
        if not timestamp:
            timestamp = datetime.now().isoformat()
        
        if lead_id not in self.consent_records:
            self.consent_records[lead_id] = {}
        
        self.consent_records[lead_id][consent_type] = {
            "given": True,
            "timestamp": timestamp
        }
        
        self._save_compliance_data()
    
    def revoke_consent(self, lead_id: str):
        """Revoke consent for a lead"""
        if lead_id in self.consent_records:
            for consent_type in self.consent_records[lead_id]:
                self.consent_records[lead_id][consent_type]['given'] = False
                self.consent_records[lead_id][consent_type]['revoked'] = datetime.now().isoformat()
        
        self._save_compliance_data()
    
    def add_to_opt_out(self, email: str):
        """Add email to opt-out list"""
        self.opt_out_list.add(email.lower())
        self._save_compliance_data()
    
    def add_to_do_not_call(self, phone: str):
        """Add phone to do-not-call list"""
        self.do_not_call_list.add(phone)
        self._save_compliance_data()
    
    def can_contact(self, lead: Dict, contact_method: str = 'email') -> Tuple[bool, str]:
        """Check if lead can be contacted legally"""
        lead_id = lead.get('email') or lead.get('phone') or lead.get('company')
        
        # Check opt-out list
        if contact_method == 'email':
            email = lead.get('email', '').lower()
            if email in self.opt_out_list:
                return False, "Email is on opt-out list"
            
            # Check consent
            if lead_id in self.consent_records:
                if not self.consent_records[lead_id].get('email', {}).get('given', False):
                    return False, "No email consent given"
        
        if contact_method == 'sms':
            phone = lead.get('phone', '')
            if phone in self.do_not_call_list:
                return False, "Phone is on do-not-call list"
            
            # Check consent
            if lead_id in self.consent_records:
                if not self.consent_records[lead_id].get('sms', {}).get('given', False):
                    return False, "No SMS consent given"
        
        # Check GDPR compliance
        is_gdpr_compliant, gdpr_issues = self.check_gdpr_compliance(lead)
        if not is_gdpr_compliant:
            return False, f"GDPR compliance issue: {', '.join(gdpr_issues)}"
        
        return True, "Compliant"
    
    def sanitize_data(self, data: Dict) -> Dict:
        """Sanitize data to remove sensitive information"""
        sanitized = data.copy()
        
        # Remove sensitive fields
        sensitive_fields = ['ssn', 'credit_card', 'bank_account', 'password']
        for field in sensitive_fields:
            if field in sanitized:
                del sanitized[field]
        
        # Anonymize if needed
        if sanitized.get('anonymize', False):
            sanitized['company'] = self._anonymize(sanitized.get('company', ''))
            sanitized['email'] = self._anonymize(sanitized.get('email', ''))
            sanitized['phone'] = self._anonymize(sanitized.get('phone', ''))
        
        return sanitized
    
    def generate_privacy_policy(self, company: str) -> str:
        """Generate GDPR-compliant privacy policy"""
        return f"""
        Privacy Policy for {company}
        
        Last Updated: {datetime.now().strftime('%B %d, %Y')}
        
        1. Data Collection
        We collect company information, contact details, and industry data for business purposes.
        
        2. Legal Basis
        We process data based on your consent and legitimate business interests.
        
        3. Data Usage
        Your data is used for lead generation, business development, and service delivery.
        
        4. Data Sharing
        We do not sell your data. We may share it with service providers as necessary.
        
        5. Data Retention
        We retain data for up to 1 year unless you request deletion.
        
        6. Your Rights
        You have the right to access, correct, or delete your data. You may opt-out at any time.
        
        7. Contact
        For privacy inquiries, contact: privacy@relentlessbillionaire.com
        
        8. GDPR Compliance
        We comply with GDPR requirements for EU residents.
        """
    
    def generate_email_footer(self) -> str:
        """Generate CAN-SPAM compliant email footer"""
        return """
        ---
        
        Relentless Billionaire
        123 Business Street
        San Francisco, CA 94105
        
        To unsubscribe from future emails, reply with "UNSUBSCRIBE" in the subject line.
        
        This email was sent in compliance with CAN-SPAM regulations.
        """
    
    def _anonymize(self, text: str) -> str:
        """Anonymize text for privacy"""
        if '@' in text:  # Email
            parts = text.split('@')
            return f"{parts[0][:2]}***@{parts[1]}"
        elif len(text) > 4:  # General text
            return text[:2] + "***" + text[-2:]
        return text
    
    def _load_compliance_data(self):
        """Load compliance data from file"""
        try:
            if os.path.exists("logs/compliance_data.json"):
                with open("logs/compliance_data.json", 'r') as f:
                    data = json.load(f)
                    self.consent_records = data.get('consent_records', {})
                    self.opt_out_list = set(data.get('opt_out_list', []))
                    self.do_not_call_list = set(data.get('do_not_call_list', []))
        except json.JSONDecodeError as e:
            print(f"✗ Error loading compliance data (invalid JSON): {e}")
            self.consent_records = {}
            self.opt_out_list = set()
            self.do_not_call_list = set()
        except Exception as e:
            print(f"✗ Error loading compliance data: {e}")
            self.consent_records = {}
            self.opt_out_list = set()
            self.do_not_call_list = set()
    
    def _save_compliance_data(self):
        """Save compliance data to file"""
        os.makedirs("logs", exist_ok=True)
        
        try:
            data = {
                "consent_records": self.consent_records,
                "opt_out_list": list(self.opt_out_list),
                "do_not_call_list": list(self.do_not_call_list),
                "last_updated": datetime.now().isoformat()
            }
            
            with open("logs/compliance_data.json", 'w') as f:
                json.dump(data, f, indent=2)
                
        except Exception as e:
            print(f"✗ Error saving compliance data: {e}")

# Singleton instance
legal_compliance = LegalCompliance()

if __name__ == "__main__":
    # Test legal compliance
    print("Testing Legal Compliance...")
    
    # Test GDPR compliance
    test_lead = {
        "company": "Test Company",
        "industry": "Technology",
        "email": "contact@test.com",
        "consent_given": True,
        "collected_date": datetime.now().isoformat()
    }
    
    is_compliant, issues = legal_compliance.check_gdpr_compliance(test_lead)
    print(f"\nGDPR Compliance: {is_compliant}")
    if issues:
        print(f"Issues: {issues}")
    
    # Test CAN-SPAM compliance
    test_email = {
        "unsubscribe_link": "https://relentlessbillionaire.com/unsubscribe",
        "physical_address": "123 Business St, San Francisco, CA 94105",
        "from_address": "noreply@relentlessbillionaire.com",
        "subject": "Business Opportunity"
    }
    
    is_compliant, issues = legal_compliance.check_can_spam_compliance(test_email)
    print(f"\nCAN-SPAM Compliance: {is_compliant}")
    if issues:
        print(f"Issues: {issues}")
    
    # Test contact permission
    can_contact, reason = legal_compliance.can_contact(test_lead, 'email')
    print(f"\nCan Contact: {can_contact}")
    print(f"Reason: {reason}")
