import React, { useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { User, Mail, Key, Shield, CheckCircle, X, Save } from "lucide-react";

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
      toast.success(initial ? "User updated successfully" : "User created successfully");
      onSaved?.();
    } catch (e2) {
      toast.error(e2?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 grid place-items-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="text-blue-600" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {initial ? "Edit User" : "Add New User"}
              </h3>
              <p className="text-sm text-gray-600">
                {initial ? "Update user details" : "Create a new user account"}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="p-4 md:p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <Input 
                label="Full Name" 
                value={f.fullName} 
                onChange={(v) => setF({ ...f, fullName: v })} 
                required 
                icon={<User size={18} />}
                placeholder="Enter full name"
              />
              
              <Input 
                label="Email Address" 
                type="email" 
                value={f.email} 
                onChange={(v) => setF({ ...f, email: v })} 
                required 
                icon={<Mail size={18} />}
                placeholder="user@example.com"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Input 
                label={
                  <div className="flex items-center gap-2">
                    <Key size={16} />
                    <span>Password</span>
                    {initial && (
                      <span className="text-xs text-gray-500 font-normal">(leave blank to keep current)</span>
                    )}
                  </div>
                }
                type="password"
                value={f.password}
                onChange={(v) => setF({ ...f, password: v })}
                required={!initial}
                placeholder={initial ? "••••••••" : "Enter password"}
              />
            </div>

            {/* Role and Status */}
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Shield size={16} />
                  Role
                </span>
                <select
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={f.role}
                  onChange={(e) => setF({ ...f, role: e.target.value })}
                >
                  <option value="Admin">Administrator</option>
                  <option value="Manager">Manager</option>
                  <option value="Staff">Staff</option>
                  <option value="Cashier">Cashier</option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <CheckCircle size={16} />
                  Status
                </span>
                <select
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={String(f.active)}
                  onChange={(e) => setF({ ...f, active: e.target.value === "true" })}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </label>
            </div>
          </div>

          {/* Permissions Info */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Role Permissions</h4>
            <div className="text-xs text-blue-700 space-y-1">
              <div><strong>Admin:</strong> Full system access</div>
              <div><strong>Manager:</strong> Manage products & view reports</div>
              <div><strong>Staff:</strong> Basic sales & product viewing</div>
              <div><strong>Cashier:</strong> Sales transactions only</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <Save size={18} />
              {saving ? "Saving..." : (initial ? "Update User" : "Create User")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Input({ label, type = "text", value, onChange, required, icon, placeholder }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700 mb-2 block">{label}</span>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder={placeholder}
          className={`w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
            icon ? 'pl-10' : ''
          }`}
        />
      </div>
    </label>
  );
}