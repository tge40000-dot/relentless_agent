"""
Telnyx SMS Gateway Integration
For sending SMS messages and alerts
"""

import os
from typing import List, Optional, Dict
from dotenv import load_dotenv

try:
    import telnyx
    TELNYX_AVAILABLE = True
except ImportError:
    TELNYX_AVAILABLE = False

load_dotenv(override=True)

class TwilioSMS:
    def __init__(self):
        self.api_key = os.getenv("TELNYX_API_KEY")
        self.from_number = os.getenv("TELNYX_FROM_NUMBER")
        self.client = None
        
        if TELNYX_AVAILABLE and self.api_key:
            try:
                self.client = telnyx.Telnyx(api_key=self.api_key)
                print("[OK] Telnyx client initialized")
            except Exception as e:
                print(f"[ERROR] Telnyx initialization failed: {e}")
        else:
            print("[WARNING] Telnyx credentials not configured")
    
    def send_sms(self, to_number: str, message: str) -> bool:
        """Send SMS message via Telnyx"""
        if not self.client:
            print("[WARNING] Telnyx client not initialized, using fallback")
            return self._fallback_send(to_number, message)
        
        try:
            msg = self.client.messages.send(
                from_=self.from_number,
                to=to_number,
                text=message
            )
            print(f"[OK] SMS sent to {to_number}: ID {msg.id}")
            return True
        except Exception as e:
            print(f"[ERROR] Telnyx SMS error: {e}")
            return self._fallback_send(to_number, message)
    
    def send_bulk_sms(self, to_numbers: List[str], message: str) -> Dict:
        """Send SMS to multiple numbers"""
        results = {
            "total": len(to_numbers),
            "sent": 0,
            "failed": 0,
            "errors": []
        }
        
        for number in to_numbers:
            if self.send_sms(number, message):
                results["sent"] += 1
            else:
                results["failed"] += 1
                results["errors"].append(f"Failed to send to {number}")
        
        return results
    
    def _fallback_send(self, to_number: str, message: str) -> bool:
        """Fallback when Telnyx is not configured"""
        print(f"[FALLBACK SMS] To: {to_number}")
        print(f"[FALLBACK SMS] Message: {message[:100]}...")
        return True
    
    def get_message_status(self, message_id: str) -> Optional[Dict]:
        """Get status of a sent message"""
        if not self.client:
            return None
        
        try:
            msg = self.client.messages.retrieve(id=message_id)
            return {
                "id": msg.id,
                "status": msg.to[0].status if msg.to else None,
                "to": msg.to[0].phone_number if msg.to else None,
                "from": msg.from_,
                "direction": msg.direction,
            }
        except Exception as e:
            print(f"✗ Error getting message status: {e}")
            return None

# Singleton instance (kept as twilio_sms for backward compatibility)
twilio_sms = TwilioSMS()

# System alerts that should trigger SMS
ALERT_TYPES = {
    "critical": ["System down", "Database failure", "Payment failure"],
    "warning": ["High CPU", "High memory", "Queue backup"],
    "info": ["Job completed", "New customer", "Revenue milestone"]
}

def send_system_alert(alert_type: str, message: str, recipients: List[str]):
    """Send system alert via SMS"""
    if alert_type not in ALERT_TYPES:
        print(f"⚠️  Unknown alert type: {alert_type}")
        return False
    
    # Add alert type prefix
    formatted_message = f"[{alert_type.upper()}] {message}"
    
    # Send to all recipients
    results = twilio_sms.send_bulk_sms(recipients, formatted_message)
    
    print(f"📊 Alert sent: {results['sent']}/{results['total']} delivered")
    return results["sent"] > 0

def send_customer_notification(phone: str, message: str):
    """Send customer notification"""
    formatted_message = f"[Relentless] {message}"
    return twilio_sms.send_sms(phone, formatted_message)

def send_otp(phone: str, otp: str) -> bool:
    """Send OTP for verification"""
    message = f"Your verification code is: {otp}. Valid for 5 minutes."
    return twilio_sms.send_sms(phone, message)

if __name__ == "__main__":
    # Test Telnyx integration
    print("Testing Telnyx SMS Integration...")
    
    # Test single SMS
    test_number = os.getenv("TEST_PHONE_NUMBER", "+1234567890")
    if twilio_sms.send_sms(test_number, "Test message from Relentless Agent"):
        print("✓ SMS test successful")
    else:
        print("✗ SMS test failed")
    
    # Test bulk SMS
    test_numbers = [test_number]
    results = twilio_sms.send_bulk_sms(test_numbers, "Bulk test message")
    print(f"Bulk SMS results: {results}")
    
    # Test system alert
    send_system_alert("info", "Test system alert", [test_number])
