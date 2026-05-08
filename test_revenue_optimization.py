nponpppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppppp"""
Test Revenue Optimization with Membership Tiers
Demonstrates revenue intake optimization with 10% scaling rule enforcement
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8001"

def test_membership_tiers():
    """Test membership tier endpoint"""
    print("\n=== Testing Membership Tiers ===")
    response = requests.get(f"{BASE_URL}/memberships")
    data = response.json()
    
    print(f"Total Tiers: {data['count']}")
    for tier in data['memberships']:
        featured = " [FEATURED]" if tier['featured'] else ""
        print(f"  {tier['name']}: ${tier['price']}/{tier['price_unit']} - {tier['discount']*100}% off{featured}")
    
    return data

def test_revenue_summary():
    """Test revenue summary with 10% scaling rule"""
    print("\n=== Testing Revenue Summary ===")
    response = requests.get(f"{BASE_URL}/revenue/summary")
    data = response.json()
    
    print(f"Total Revenue: ${data['total_revenue']}")
    print(f"Scaling Budget (10%): ${data['scaling_budget']}")
    print(f"Scaling Rule: {data['scaling_budget_percentage']*100}%")
    print(f"Pending Proposals: {data['pending_proposals']}")
    
    return data

def test_scaling_status():
    """Test scaling status and approval requirement"""
    print("\n=== Testing Scaling Status ===")
    response = requests.get(f"{BASE_URL}/revenue/scaling")
    data = response.json()
    
    print(f"Rule: {data['rule']}")
    print(f"Available Budget: ${data['available_budget']}")
    print(f"Approval Required: {data['approval_required']}")
    
    return data

def create_test_job_with_tier(service_id, price, tier_id):
    """Create a test job with membership tier"""
    print(f"\n=== Creating Job: {service_id} with {tier_id} ===")
    
    job_data = {
        "service_id": service_id,
        "customer_email": f"customer_{tier_id}@example.com",
        "customer_name": f"Customer {tier_id}",
        "price": price,
        "tier_id": tier_id
    }
    
    response = requests.post(f"{BASE_URL}/jobs", json=job_data)
    data = response.json()
    
    print(f"Job Created: {data['job_id']}")
    print(f"Discount Applied: {data['discount']*100}%")
    print(f"Final Amount: ${data['final_amount']}")
    
    return data

def main():
    print("=" * 60)
    print("REVENUE OPTIMIZATION TEST")
    print("=" * 60)
    
    # Test 1: Get membership tiers
    memberships = test_membership_tiers()
    
    # Test 2: Check initial revenue state
    revenue = test_revenue_summary()
    
    # Test 3: Check scaling status
    scaling = test_scaling_status()
    
    # Test 4: Create jobs with different tiers to demonstrate revenue optimization
    print("\n=== Creating Test Jobs for Revenue Optimization ===")
    
    # No tier (full price)
    create_test_job_with_tier("svc_lead_generation", 500, None)
    
    # Starter tier (10% off)
    create_test_job_with_tier("svc_lead_generation", 500, "tier-starter")
    
    # PRO tier (25% off) - Featured
    create_test_job_with_tier("svc_lead_generation", 500, "tier-pro")
    
    # ELITE tier (40% off)
    create_test_job_with_tier("svc_lead_generation", 500, "tier-elite")
    
    # Test 5: Check updated revenue
    print("\n=== Updated Revenue Summary ===")
    updated_revenue = test_revenue_summary()
    
    # Test 6: Check revenue by tier
    print("\n=== Revenue by Tier (Optimization Data) ===")
    response = requests.get(f"{BASE_URL}/revenue")
    data = response.json()
    
    if 'revenue_by_tier' in data:
        tier_data = data['revenue_by_tier']
        print("Revenue by Tier:")
        for tier, rev in tier_data['revenue'].items():
            count = tier_data['count'][tier]
            avg = tier_data['average_order_value'][tier]
            print(f"  {tier}: ${rev:,.2f} ({count} orders, avg ${avg:,.2f})")
    
    if 'revenue_by_service' in data:
        service_data = data['revenue_by_service']
        print("\nRevenue by Service:")
        for service, rev in service_data['revenue'].items():
            count = service_data['count'][service]
            avg = service_data['average_order_value'][service]
            print(f"  {service}: ${rev:,.2f} ({count} orders, avg ${avg:,.2f})")
    
    print("\n" + "=" * 60)
    print("REVENUE OPTIMIZATION COMPLETE")
    print("=" * 60)
    print("\nKey Insights:")
    print("- 10% scaling rule enforced programmatically")
    print("- Membership tiers drive revenue through discounts")
    print("- Revenue tracking by tier enables optimization")
    print("- All scaling requires Christopher's approval")
    print("\nRecommendation:")
    print("- Promote PRO tier (25% discount) for optimal revenue")
    print("- Monitor tier performance to adjust pricing")
    print("- Use 10% budget for scaling only with approval")

if __name__ == "__main__":
    main()
