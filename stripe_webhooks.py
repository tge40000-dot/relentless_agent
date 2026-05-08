"""
Stripe Webhook Handler
Processes Stripe webhook events for payments and subscriptions
"""

import os
import json
import stripe
from fastapi import FastAPI, Request, HTTPException, Header
from typing import Dict
from dotenv import load_dotenv

load_dotenv(override=True)

# Configure Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

app = FastAPI(title="Stripe Webhooks")

@app.post("/webhooks/stripe")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    """Handle Stripe webhook events"""
    payload = await request.body()
    
    if not stripe_signature:
        raise HTTPException(status_code=400, detail="No stripe signature")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, WEBHOOK_SECRET
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid payload: {str(e)}")
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail=f"Invalid signature: {str(e)}")
    
    # Handle the event
    event_type = event['type']
    print(f"📡 Received Stripe webhook: {event_type}")
    
    if event_type == 'checkout.session.completed':
        await handle_checkout_completed(event)
    elif event_type == 'payment_intent.succeeded':
        await handle_payment_succeeded(event)
    elif event_type == 'payment_intent.payment_failed':
        await handle_payment_failed(event)
    elif event_type == 'invoice.paid':
        await handle_invoice_paid(event)
    elif event_type == 'invoice.payment_failed':
        await handle_invoice_payment_failed(event)
    elif event_type == 'customer.subscription.created':
        await handle_subscription_created(event)
    elif event_type == 'customer.subscription.updated':
        await handle_subscription_updated(event)
    elif event_type == 'customer.subscription.deleted':
        await handle_subscription_deleted(event)
    else:
        print(f"⚠️  Unhandled event type: {event_type}")
    
    return {"status": "success", "event": event_type}

async def handle_checkout_completed(event):
    """Handle checkout.session.completed event"""
    session = event['data']['object']
    print(f"✅ Checkout completed: {session['id']}")
    
    # Extract metadata
    metadata = session.get('metadata', {})
    customer_email = session.get('customer_details', {}).get('email')
    
    # Create job if metadata contains service info
    if 'service_id' in metadata:
        await create_job_from_payment(
            customer_email=customer_email,
            service_id=metadata['service_id'],
            amount=session['amount_total'] / 100,
            payment_id=session['payment_intent']
        )
    
    # Send confirmation email
    if customer_email:
        from sendgrid_email import send_payment_confirmation
        send_payment_confirmation(
            customer_email,
            session['amount_total'] / 100,
            session['payment_intent']
        )

async def handle_payment_succeeded(event):
    """Handle payment_intent.succeeded event"""
    payment_intent = event['data']['object']
    print(f"✅ Payment succeeded: {payment_intent['id']}")
    
    # Update job status if linked
    await update_job_payment_status(payment_intent['id'], 'succeeded')

async def handle_payment_failed(event):
    """Handle payment_intent.payment_failed event"""
    payment_intent = event['data']['object']
    print(f"❌ Payment failed: {payment_intent['id']}")
    
    # Update job status if linked
    await update_job_payment_status(payment_intent['id'], 'failed')
    
    # Send notification to admin
    from twilio_sms import send_system_alert
    send_system_alert(
        "critical",
        f"Payment failed: {payment_intent['id']} - ${payment_intent['amount'] / 100}",
        [os.getenv("ADMIN_PHONE", "")]
    )

async def handle_invoice_paid(event):
    """Handle invoice.paid event (subscription)"""
    invoice = event['data']['object']
    print(f"✅ Invoice paid: {invoice['id']}")
    
    # Record subscription payment
    await record_subscription_payment(
        subscription_id=invoice['subscription'],
        amount=invoice['amount_paid'] / 100,
        invoice_id=invoice['id']
    )

async def handle_invoice_payment_failed(event):
    """Handle invoice.payment_failed event"""
    invoice = event['data']['object']
    print(f"❌ Invoice payment failed: {invoice['id']}")
    
    # Send dunning email
    customer_id = invoice['customer']
    await send_dunning_email(customer_id, invoice)

async def handle_subscription_created(event):
    """Handle customer.subscription.created event"""
    subscription = event['data']['object']
    print(f"✅ Subscription created: {subscription['id']}")
    
    # Record new subscription
    await record_subscription(subscription)

async def handle_subscription_updated(event):
    """Handle customer.subscription.updated event"""
    subscription = event['data']['object']
    print(f"✅ Subscription updated: {subscription['id']}")
    
    # Update subscription record
    await update_subscription_record(subscription)

async def handle_subscription_deleted(event):
    """Handle customer.subscription.deleted event"""
    subscription = event['data']['object']
    print(f"❌ Subscription deleted: {subscription['id']}")
    
    # Cancel subscription
    await cancel_subscription(subscription['id'])

# Helper functions
async def create_job_from_payment(customer_email: str, service_id: str, amount: float, payment_id: str):
    """Create job from successful payment"""
    try:
        import requests
        job_data = {
            "service_id": service_id,
            "customer_email": customer_email,
            "customer_name": customer_email.split('@')[0],
            "price": amount,
            "status": "pending",
            "metadata": {
                "payment_id": payment_id,
                "payment_source": "stripe"
            }
        }
        
        response = requests.post(
            "http://127.0.0.1:8001/jobs",
            json=job_data,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✓ Job created from payment: {result.get('job_id')}")
            
            # Send job creation email
            from sendgrid_email import send_job_created_email
            send_job_created_email(customer_email, result.get('job_id'))
        else:
            print(f"✗ Failed to create job: {response.text}")
    except Exception as e:
        print(f"✗ Error creating job from payment: {e}")

async def update_job_payment_status(payment_id: str, status: str):
    """Update job payment status"""
    try:
        import requests
        response = requests.get(
            f"http://127.0.0.1:8001/jobs",
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            jobs = data.get("jobs", [])
            
            for job in jobs:
                if job.get("metadata", {}).get("payment_id") == payment_id:
                    update_data = {
                        "status": "in_progress" if status == "succeeded" else "payment_failed"
                    }
                    requests.put(
                        f"http://127.0.0.1:8001/jobs/{job['id']}",
                        json=update_data,
                        timeout=10
                    )
                    print(f"✓ Updated job {job['id']} payment status to {status}")
                    break
    except Exception as e:
        print(f"✗ Error updating job payment status: {e}")

async def record_subscription_payment(subscription_id: str, amount: float, invoice_id: str):
    """Record subscription payment"""
    print(f"Recording subscription payment: {subscription_id} - ${amount}")
    # In production, save to database

async def record_subscription(subscription):
    """Record new subscription"""
    print(f"Recording subscription: {subscription['id']}")
    # In production, save to database

async def update_subscription_record(subscription):
    """Update subscription record"""
    print(f"Updating subscription: {subscription['id']}")
    # In production, update in database

async def cancel_subscription(subscription_id: str):
    """Cancel subscription"""
    print(f"Cancelling subscription: {subscription_id}")
    # In production, update in database

async def send_dunning_email(customer_id: str, invoice):
    """Send dunning email for failed payment"""
    print(f"Sending dunning email to customer: {customer_id}")
    # In production, send email via SendGrid

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
