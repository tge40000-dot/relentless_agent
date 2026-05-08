"use client";

import { useState } from "react";
import { api } from "../../lib/api";

export default function SMSPage() {
  const [message, setMessage] = useState("");
  const [recipient, setRecipient] = useState("");
  const [sending, setSending] = useState(false);

  async function sendSMS() {
    if (!message || !recipient) {
      alert("Please fill in all fields");
      return;
    }

    setSending(true);
    try {
      const res = await api("/api/admin/secure/sms/send", "POST", {
        to: recipient,
        message: message
      });
      
      if (res.success) {
        alert("SMS sent successfully!");
        setMessage("");
        setRecipient("");
      } else {
        alert("Failed to send SMS: " + res.message);
      }
    } catch (err) {
      alert("Error sending SMS: " + err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl text-gold mb-6">SMS Messaging</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg text-gold mb-4">Send New SMS</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-dim mb-2">Recipient Phone</label>
              <input
                className="w-full p-3 bg-black border border-gray-700 rounded"
                placeholder="+1234567890"
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-dim mb-2">Message</label>
              <textarea
                className="w-full p-3 bg-black border border-gray-700 rounded h-32"
                placeholder="Enter your message..."
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
            </div>
            <button
              className="bg-gold text-black px-6 py-3 rounded hover:bg-yellow-400 transition-colors disabled:opacity-50"
              onClick={sendSMS}
              disabled={sending || !message || !recipient}
            >
              {sending ? "Sending..." : "Send SMS"}
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-lg text-gold mb-4">SMS Templates</h2>
          <div className="space-y-3">
            <div className="p-4 bg-gray rounded border border-gray-800">
              <h3 className="text-gold font-semibold mb-2">Welcome Message</h3>
              <p className="text-dim text-sm mb-2">Welcome to Relentless Billionaire! Your membership is now active.</p>
              <button 
                className="text-blue-400 text-sm hover:text-blue-300"
                onClick={() => setMessage("Welcome to Relentless Billionaire! Your membership is now active.")}
              >
                Use Template
              </button>
            </div>
            <div className="p-4 bg-gray rounded border border-gray-800">
              <h3 className="text-gold font-semibold mb-2">Order Confirmation</h3>
              <p className="text-dim text-sm mb-2">Your order has been confirmed. We'll notify you when it's ready.</p>
              <button 
                className="text-blue-400 text-sm hover:text-blue-300"
                onClick={() => setMessage("Your order has been confirmed. We'll notify you when it's ready.")}
              >
                Use Template
              </button>
            </div>
            <div className="p-4 bg-gray rounded border border-gray-800">
              <h3 className="text-gold font-semibold mb-2">Service Update</h3>
              <p className="text-dim text-sm mb-2">Your service is now in progress. Expected completion: [DATE]</p>
              <button 
                className="text-blue-400 text-sm hover:text-blue-300"
                onClick={() => setMessage("Your service is now in progress. Expected completion: [DATE]")}
              >
                Use Template
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
