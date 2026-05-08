"use client";

import { useState } from "react";
import { api } from "../../lib/api";

export default function ResetPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await api("/api/admin/reset-password", "POST", { email });
      if (res.success) {
        setMessage("Password reset link sent to your email");
      } else {
        setMessage(res.message || "Reset failed");
      }
    } catch (err) {
      setMessage("Connection error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-black">
      <form onSubmit={submit} className="bg-gray p-8 rounded w-96">
        <h1 className="text-gold text-2xl mb-6">Reset Password</h1>

        {message && (
          <div className={`p-3 rounded mb-4 text-sm ${
            message.includes("sent") ? "bg-green-900 text-green-200" : "bg-red-900 text-red-200"
          }`}>
            {message}
          </div>
        )}

        <input
          className="w-full mb-4 p-3 bg-black border border-gray-700 rounded"
          placeholder="Admin email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />

        <button 
          className="w-full bg-gold text-black p-3 rounded hover:bg-yellow-400 transition-colors disabled:opacity-50"
          type="submit"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        <div className="mt-4 text-center">
          <a href="/login" className="text-gold hover:text-yellow-400 text-sm">
            Back to Login
          </a>
        </div>
      </form>
    </div>
  );
}
