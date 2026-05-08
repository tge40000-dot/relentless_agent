"""
Stripe Products Setup
Creates live Stripe products for 4 services + 3 membership subscription tiers.
Outputs price IDs ready to paste into the Cloudflare Worker.
"""

import os
import json
import stripe
from dotenv import load_dotenv

load_dotenv(override=True)

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

# ── One-time payment services ────────────────────────────────────────────────
SERVICES = [
    {
        "worker_key": "svc-lead-gen",
        "name": "AI Lead Generation",
        "description": "AI-powered lead generation. 50-100 qualified leads with custom outreach sequences.",
        "price": 50000,  # $500 in cents
        "metadata": {"service_type": "lead_generation", "delivery_time": "24-48 hours"},
    },
    {
        "worker_key": "svc-flyer",
        "name": "Custom Event Flyer Design",
        "description": "Professional event flyers with luxury aesthetic. Print-ready and social-optimized.",
        "price": 20000,  # $200 in cents
        "metadata": {"service_type": "flyer_production", "delivery_time": "12-24 hours"},
    },
    {
        "worker_key": "svc-outreach",
        "name": "Targeted Outreach Campaign",
        "description": "Full-service outreach to venues, sponsors, and partners. Custom pitch deck + email sequences.",
        "price": 100000,  # $1,000 in cents
        "metadata": {"service_type": "outreach_automation", "delivery_time": "24-48 hours"},
    },
    {
        "worker_key": "svc-consulting",
        "name": "1-on-1 Business Consulting",
        "description": "Strategic business consulting with Christopher. Brand architecture, revenue modeling, growth strategy.",
        "price": 200000,  # $2,000 in cents
        "metadata": {"service_type": "consulting", "delivery_time": "Scheduled"},
    },
]

# ── Recurring membership subscription tiers ──────────────────────────────────
MEMBERSHIPS = [
    {
        "worker_key": "tier-starter",
        "name": "STARTER Membership",
        "description": "10% off all services, early event access, monthly newsletter, Discord access.",
        "price": 4900,  # $49/mo in cents
        "metadata": {"tier": "starter", "discount": "10"},
    },
    {
        "worker_key": "tier-pro",
        "name": "PRO Membership",
        "description": "25% off all services, priority booking, free monthly flyer, 1-on-1 check-in, VIP access.",
        "price": 19900,  # $199/mo in cents
        "metadata": {"tier": "pro", "discount": "25"},
    },
    {
        "worker_key": "tier-elite",
        "name": "ELITE Membership",
        "description": "40% off all services, unlimited priority booking, 2 free flyers/mo, weekly strategy calls.",
        "price": 49900,  # $499/mo in cents
        "metadata": {"tier": "elite", "discount": "40"},
    },
]


def create_products():
    if not stripe.api_key or stripe.api_key.startswith("your_"):
        print("❌ STRIPE_SECRET_KEY not configured in .env")
        return

    print("RELENTLESS BILLIONAIRE -- Stripe Live Setup")
    print("=" * 55)

    price_map = {}  # worker_key -> price_id
    all_results = []

    # Services (one-time payment)
    print("\nSERVICES (one-time payment)")
    for svc in SERVICES:
        try:
            product = stripe.Product.create(
                name=svc["name"],
                description=svc["description"],
                metadata=svc["metadata"],
            )
            price = stripe.Price.create(
                product=product.id,
                unit_amount=svc["price"],
                currency="usd",
                metadata=svc["metadata"],
            )
            link = stripe.PaymentLink.create(
                line_items=[{"price": price.id, "quantity": 1}]
            )
            price_map[svc["worker_key"]] = price.id
            all_results.append({
                "worker_key": svc["worker_key"],
                "name": svc["name"],
                "price_usd": svc["price"] / 100,
                "product_id": product.id,
                "price_id": price.id,
                "payment_link": link.url,
            })
            print(f"  [OK] {svc['name']} -- {price.id}")
            print(f"       Link: {link.url}")
        except Exception as e:
            print(f"  [ERR] {svc['name']}: {e}")

    # Membership tiers (recurring subscriptions)
    print("\nMEMBERSHIPS (monthly subscription)")
    for tier in MEMBERSHIPS:
        try:
            product = stripe.Product.create(
                name=tier["name"],
                description=tier["description"],
                metadata=tier["metadata"],
            )
            price = stripe.Price.create(
                product=product.id,
                unit_amount=tier["price"],
                currency="usd",
                recurring={"interval": "month"},
                metadata=tier["metadata"],
            )
            price_map[tier["worker_key"]] = price.id
            all_results.append({
                "worker_key": tier["worker_key"],
                "name": tier["name"],
                "price_usd": tier["price"] / 100,
                "product_id": product.id,
                "price_id": price.id,
            })
            print(f"  [OK] {tier['name']} -- {price.id}")
        except Exception as e:
            print(f"  [ERR] {tier['name']}: {e}")

    # Output for Worker update
    print("\n" + "=" * 55)
    print("COPY THIS INTO api-worker.js -> STRIPE_PRICE_MAP:\n")
    print("const STRIPE_PRICE_MAP = {")
    for k, v in price_map.items():
        print(f"  '{k}': '{v}',")
    print("};")

    # Save to file
    output = {"price_map": price_map, "products": all_results}
    with open("stripe_products.json", "w") as f:
        json.dump(output, f, indent=2)
    print("\n[SAVED] Full details saved to stripe_products.json")
    return output


if __name__ == "__main__":
    create_products()
