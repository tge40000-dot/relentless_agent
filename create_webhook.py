"""
Creates the Stripe webhook endpoint and retrieves the signing secret.
Automatically updates .env with STRIPE_WEBHOOK_SECRET.
"""
import os
import re
import stripe
from dotenv import load_dotenv

load_dotenv(override=True)
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

ENDPOINT_URL = "https://relentlessbillionaire.com/api/webhooks/stripe"
EVENTS = [
    "checkout.session.completed",
    "invoice.paid",
    "invoice.payment_failed",
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "payment_intent.succeeded",
    "payment_intent.payment_failed",
]

def run():
    print("Creating Stripe webhook endpoint...")

    # Check if already exists
    existing = stripe.WebhookEndpoint.list(limit=20)
    for ep in existing.data:
        if ep.url == ENDPOINT_URL:
            print(f"Endpoint already exists: {ep.id}")
            print("NOTE: Signing secret cannot be re-retrieved via API.")
            print("Go to Stripe Dashboard -> Webhooks -> click endpoint -> Reveal signing secret")
            return None

    # Create new endpoint
    endpoint = stripe.WebhookEndpoint.create(
        url=ENDPOINT_URL,
        enabled_events=EVENTS,
        description="Relentless Billionaire - production webhook",
    )

    secret = endpoint.secret  # whsec_...
    print(f"[OK] Webhook created: {endpoint.id}")
    print(f"[OK] Signing secret:  {secret}")

    # Update .env
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    with open(env_path, "r") as f:
        content = f.read()

    updated = re.sub(
        r"STRIPE_WEBHOOK_SECRET=.*",
        f"STRIPE_WEBHOOK_SECRET={secret}",
        content,
    )
    with open(env_path, "w") as f:
        f.write(updated)

    print(f"[OK] .env updated with STRIPE_WEBHOOK_SECRET")
    print(f"\nSecret: {secret}")
    return secret

if __name__ == "__main__":
    run()
