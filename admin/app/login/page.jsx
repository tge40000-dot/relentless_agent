"use client";

import { useState } from "react";
import { api } from "../../lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    try {
      const res = await api("/api/admin/login", "POST", { email, password });
      if (res.success) {
        window.location.href = "/dashboard";
      } else {
        setError(res.message || "Login failed");
      }
    } catch (err) {
      setError("Connection error");
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-black">
      <form onSubmit={submit} className="bg-gray p-8 rounded w-96">
        <h1 className="text-gold text-2xl mb-6">Admin Login</h1>

        {error && (
          <div className="bg-red-900 text-red-200 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <input
          className="w-full mb-4 p-3 bg-black border border-gray-700 rounded"
          placeholder="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          className="w-full mb-4 p-3 bg-black border border-gray-700 rounded"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        <button className="w-full bg-gold text-black p-3 rounded hover:bg-yellow-400 transition-colors">
          Login
        </button>
      </form>
    </div>
  );
}
