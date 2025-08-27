import React, { useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

export default function UserForm({ initial, onClose, onSaved }) {
  const [f, setF] = useState(
    initial || { fullName: "", email: "", password: "", role: "Staff", active: true }
  );
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (initial?._id) {
        await api.put(`/users/${initial._id}`, { ...f, password: f.password || undefined });
      } else {
        await api.post(`/users`, f);
      }
      toast.success(initial ? "User updated" : "User created");
      onSaved?.();
    } catch (e2) {
      toast.error(e2?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{initial ? "Edit User" : "Add User"}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-black">✕</button>
        </div>

        <form onSubmit={submit} className="grid grid-cols-2 gap-4">
          <Input label="Full Name" value={f.fullName} onChange={(v) => setF({ ...f, fullName: v })} required />
          <Input label="Email" type="email" value={f.email} onChange={(v) => setF({ ...f, email: v })} required />

          <label className="block col-span-2">
            <span className="text-sm text-gray-600">
              Password {initial && <em className="text-xs text-gray-400">(leave blank to keep)</em>}
            </span>
            <input
              type="password"
              value={f.password}
              onChange={(e) => setF({ ...f, password: e.target.value })}
              className="mt-1 w-full border rounded-xl px-3 py-2"
              placeholder={initial ? "(unchanged)" : "Set initial password"}
              required={!initial}
            />
          </label>

          <label className="block">
            <span className="text-sm text-gray-600">Role</span>
            <select
              className="mt-1 w-full border rounded-xl px-3 py-2"
              value={f.role}
              onChange={(e) => setF({ ...f, role: e.target.value })}
            >
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Staff">Staff</option>
              <option value="Cashier">Cashier</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm text-gray-600">Active</span>
            <select
              className="mt-1 w-full border rounded-xl px-3 py-2"
              value={String(f.active)}
              onChange={(e) => setF({ ...f, active: e.target.value === "true" })}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </label>

          <div className="col-span-2 flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-black text-white">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Input({ label, type = "text", value, onChange, required }) {
  return (
    <label className="block">
      <span className="text-sm text-gray-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="mt-1 w-full border rounded-xl px-3 py-2"
      />
    </label>
  );
}
