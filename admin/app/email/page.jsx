"use client";

import { useState } from "react";
import { api } from "../../lib/api";

export default function EmailPage() {
  const [subject, setSubject] = useState("");
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function sendEmail() {
    if (!subject || !message || !recipient) {
      alert("Please fill in all fields");
      return;
    }

    setSending(true);
    try {
      const res = await api("/api/admin/secure/email/send", "POST", {
        to: recipient,
        subject: subject,
        message: message
      });
      
      if (res.success) {
        alert("Email sent successfully!");
        setSubject("");
        setMessage("");
        setRecipient("");
      } else {
        alert("Failed to send email: " + res.message);
      }
    } catch (err) {
      alert("Error sending email: " + err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl text-gold mb-6">Email Messaging</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg text-gold mb-4">Send New Email</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-dim mb-2">Recipient Email</label>
              <input
                className="w-full p-3 bg-black border border-gray-700 rounded"
                placeholder="customer@example.com"
                type="email"
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-dim mb-2">Subject</label>
              <input
                className="w-full p-3 bg-black border border-gray-700 rounded"
                placeholder="Email subject"
                value={subject}
                onChange={e => setSubject(e.target.value)}
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
              onClick={sendEmail}
              disabled={sending || !subject || !message || !recipient}
            >
              {sending ? "Sending..." : "Send Email"}
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-lg text-gold mb-4">Email Templates</h2>
          <div className="space-y-3">
            <div className="p-4 bg-gray rounded border border-gray-800">
              <h3 className="text-gold font-semibold mb-2">Welcome Email</h3>
              <p className="text-dim text-sm mb-2">Welcome to Relentless Billionaire! Your membership is now active.</p>
              <button 
                className="text-blue-400 text-sm hover:text-blue-300"
                onClick={() => {
                  setSubject("Welcome to Relentless Billionaire!");
                  setMessage("Welcome to Relentless Billionaire! Your membership is now active. Thank you for joining our exclusive community.");
                }}
              >
                Use Template
              </button>
            </div>
            <div className="p-4 bg-gray rounded border border-gray-800">
              <h3 className="text-gold font-semibold mb-2">Order Confirmation</h3>
              <p className="text-dim text-sm mb-2">Your order has been confirmed and is being processed.</p>
              <button 
                className="text-blue-400 text-sm hover:text-blue-300"
                onClick={() => {
                  setSubject("Order Confirmation");
                  setMessage("Your order has been confirmed and is being processed. We'll notify you when it's ready for delivery.");
                }}
              >
                Use Template
              </button>
            </div>
            <div className="p-4 bg-gray rounded border border-gray-800">
              <h3 className="text-gold font-semibold mb-2">Service Completion</h3>
              <p className="text-dim text-sm mb-2">Your service has been completed and is ready for review.</p>
              <button 
                className="text-blue-400 text-sm hover:text-blue-300"
                onClick={() => {
                  setSubject("Service Completed");
                  setMessage("Your service has been completed and is ready for review. Thank you for choosing Relentless Billionaire.");
                }}
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
