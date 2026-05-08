"use client";

import { api } from "../../lib/api";
import useSWR from "swr";
import { useState } from "react";

export default function SocialPage() {
  const { data, mutate, error } = useSWR(
    "/api/admin/secure/settings/social",
    path => api(path)
  );

  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await api("/api/admin/secure/settings/social", "PUT", JSON.parse(value));
      mutate();
      alert("Social links saved successfully!");
    } catch (err) {
      alert("Error saving social links: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  if (error) return <div className="text-red-400">Error loading social links</div>;
  if (!data) return <div className="text-dim">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl text-gold mb-6">Social Links</h1>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg text-gold mb-2">Current Social Links</h2>
          <pre className="bg-gray p-4 rounded text-sm overflow-x-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-lg text-gold mb-2">Update Social Links</h2>
          <textarea
            className="w-full p-3 bg-black border border-gray-700 rounded h-64 font-mono text-sm"
            placeholder="JSON social links"
            value={value}
            onChange={e => setValue(e.target.value)}
          />
          <button 
            className="mt-3 bg-gold text-black px-6 py-3 rounded hover:bg-yellow-400 transition-colors disabled:opacity-50"
            onClick={save}
            disabled={saving || !value}
          >
            {saving ? "Saving..." : "Save Social Links"}
          </button>
        </div>
      </div>
    </div>
  );
}
