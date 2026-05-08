"""
Test Autonomous AI System - Short Intervals for Testing
"""

import asyncio
import os
from datetime import datetime
from autonomous_ai_system import AutonomousAISystem

async def main():
    print("=== Relentless Billionaire Autonomous AI System (TEST MODE) ===")
    print("Running with short intervals for testing...")
    print("")
    
    # Create system
    autonomous_ai = AutonomousAISystem()
    
    # Test individual components
    print("\n[TEST] Testing ML Lead Scorer...")
    from ml_lead_scorer import ml_scorer
    test_lead = {
        "company": "Test Company",
        "industry": "Technology",
        "source": "crunchbase",
        "email": "test@test.com",
        "phone": "555-0100",
        "website": "https://test.com",
        "revenue_range": "$5M-$10M",
        "employee_count": "51-200",
        "market": "technology"
    }
    result = ml_scorer.score_lead(test_lead)
    print(f"   Lead Score: {result['score']}/100")
    print(f"   Tier: {result['tier']}")
    print(f"   Conversion Probability: {result['conversion_probability']:.2%}")
    
    print("\n[TEST] Testing OpenAI Content Generator...")
    from openai_content import openai_generator
    email = openai_generator.generate_outreach_email(test_lead, "Lead Generation")
    print(f"   Email generated (length: {len(email)} chars)")
    
    print("\n[TEST] Testing Revenue Optimizer...")
    from revenue_optimizer import revenue_optimizer
    sample_transactions = [
        {"amount": 5000, "customer_email": "customer@example.com", "date": datetime.now().isoformat()}
    ]
    metrics = revenue_optimizer.analyze_revenue(sample_transactions)
    print(f"   Total Revenue: ${metrics.total_revenue:,.2f}")
    print(f"   Monthly Revenue: ${metrics.monthly_revenue:,.2f}")
    
    print("\n[TEST] All components working!")
    print("\n[INFO] Full autonomous system would run 24/7 with:")
    print("   - Sales cycle every 24 hours")
    print("   - Service fulfillment checks every hour")
    print("   - Community building daily")
    print("   - Revenue optimization daily")
    print("   - Compliance checks hourly")
    print("   - Daily SMS reports")
    print("\n[INFO] To start full system, run: python autonomous_ai_system.py")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[STOP] Test stopped by user")
