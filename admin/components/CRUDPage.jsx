"use client";

import useSWR from "swr";
import { api } from "../lib/api";
import { useState } from "react";

export default function CRUDPage({ collection }) {
  const { data, mutate, error } = useSWR(
    `/api/admin/secure/content/${collection}`,
    path => api(path)
  );

  const [form, setForm] = useState({});
  const [editingId, setEditingId] = useState(null);

  async function save() {
    if (editingId) {
      await api(`/api/admin/secure/content/${collection}/${editingId}`, "PUT", form);
    } else {
      await api(`/api/admin/secure/content/${collection}`, "POST", form);
    }
    setForm({});
    setEditingId(null);
    mutate();
  }

  async function deleteItem(id) {
    if (confirm("Are you sure you want to delete this item?")) {
      await api(`/api/admin/secure/content/${collection}/${id}`, "DELETE");
      mutate();
    }
  }

  function editItem(item) {
    setForm(item);
    setEditingId(item.id);
  }

  if (error) return <div className="text-red-400">Error loading data</div>;
  if (!data) return <div className="text-dim">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl text-gold mb-6 capitalize">{collection}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl mb-4 text-gold">
            {editingId ? "Edit Item" : "Create New"}
          </h2>
          <div className="space-y-3">
            <input
              className="w-full p-3 bg-black border border-gray-700 rounded"
              placeholder="Name"
              value={form.name || ""}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
            <textarea
              className="w-full p-3 bg-black border border-gray-700 rounded h-32"
              placeholder="Description"
              value={form.description || ""}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
            <input
              className="w-full p-3 bg-black border border-gray-700 rounded"
              placeholder="Image URL (optional)"
              value={form.image || ""}
              onChange={e => setForm({ ...form, image: e.target.value })}
            />
            <button 
              className="bg-gold text-black px-6 py-3 rounded hover:bg-yellow-400 transition-colors"
              onClick={save}
            >
              {editingId ? "Update" : "Create"}
            </button>
            {editingId && (
              <button 
                className="ml-3 bg-gray text-dim px-6 py-3 rounded hover:bg-gray-800 transition-colors"
                onClick={() => {
                  setForm({});
                  setEditingId(null);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl mb-4 text-gold">Existing Items</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {data?.items?.map(item => (
              <div key={item.id} className="p-4 bg-gray rounded border border-gray-800">
                <h3 className="text-gold font-semibold">{item.name}</h3>
                <p className="text-dim text-sm mb-2">{item.description}</p>
                {item.image && (
                  <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded mb-2" />
                )}
                <div className="flex gap-2">
                  <button 
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    onClick={() => editItem(item)}
                  >
                    Edit
                  </button>
                  <button 
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                    onClick={() => deleteItem(item.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {(!data?.items || data.items.length === 0) && (
              <p className="text-dim">No items found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
