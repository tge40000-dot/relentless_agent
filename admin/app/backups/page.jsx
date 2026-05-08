"use client";

import { useState } from "react";
import { api } from "../../lib/api";
import useSWR from "swr";

export default function BackupsPage() {
  const { data, mutate } = useSWR("/api/admin/secure/backups", path => api(path));
  const [creating, setCreating] = useState(false);

  async function createBackup() {
    setCreating(true);
    try {
      const res = await api("/api/admin/secure/backups/create", "POST");
      if (res.success) {
        alert("Backup created successfully!");
        mutate();
      } else {
        alert("Failed to create backup: " + res.message);
      }
    } catch (err) {
      alert("Error creating backup: " + err.message);
    } finally {
      setCreating(false);
    }
  }

  async function restoreBackup(backupId) {
    if (!confirm("Are you sure you want to restore this backup? This will overwrite current data.")) {
      return;
    }

    try {
      const res = await api(`/api/admin/secure/backups/${backupId}/restore`, "POST");
      if (res.success) {
        alert("Backup restored successfully!");
        mutate();
      } else {
        alert("Failed to restore backup: " + res.message);
      }
    } catch (err) {
      alert("Error restoring backup: " + err.message);
    }
  }

  async function deleteBackup(backupId) {
    if (!confirm("Are you sure you want to delete this backup?")) {
      return;
    }

    try {
      const res = await api(`/api/admin/secure/backups/${backupId}`, "DELETE");
      if (res.success) {
        alert("Backup deleted successfully!");
        mutate();
      } else {
        alert("Failed to delete backup: " + res.message);
      }
    } catch (err) {
      alert("Error deleting backup: " + err.message);
    }
  }

  return (
    <div>
      <h1 className="text-2xl text-gold mb-6">System Backups</h1>

      <div className="mb-6">
        <button
          className="bg-gold text-black px-6 py-3 rounded hover:bg-yellow-400 transition-colors disabled:opacity-50"
          onClick={createBackup}
          disabled={creating}
        >
          {creating ? "Creating Backup..." : "Create New Backup"}
        </button>
      </div>

      <div className="bg-gray rounded border border-gray-800">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-lg text-gold">Available Backups</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-gold">ID</th>
                <th className="px-4 py-3 text-left text-gold">Date</th>
                <th className="px-4 py-3 text-left text-gold">Size</th>
                <th className="px-4 py-3 text-left text-gold">Type</th>
                <th className="px-4 py-3 text-left text-gold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.backups?.map(backup => (
                <tr key={backup.id} className="border-t border-gray-800">
                  <td className="px-4 py-3 text-dim">{backup.id}</td>
                  <td className="px-4 py-3">{backup.date}</td>
                  <td className="px-4 py-3">{backup.size}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-blue-900 text-blue-200 rounded text-xs">
                      {backup.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button 
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        onClick={() => restoreBackup(backup.id)}
                      >
                        Restore
                      </button>
                      <button 
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                        onClick={() => deleteBackup(backup.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!data?.backups || data.backups.length === 0) && (
            <div className="p-8 text-center text-dim">
              No backups found. Create your first backup above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
