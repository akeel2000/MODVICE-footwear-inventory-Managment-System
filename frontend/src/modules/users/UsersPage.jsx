import React, { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Search, Users, Filter, Download } from "lucide-react";
import UserForm from "./UserForm";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/users");
      setUsers(Array.isArray(data) ? data : data?.items || []);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!q) return users;
    const s = q.toLowerCase();
    return users.filter((u) =>
      u.fullName?.toLowerCase().includes(s) ||
      u.email?.toLowerCase().includes(s) ||
      u.role?.toLowerCase().includes(s)
    );
  }, [q, users]);

  const onDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success("User deleted successfully");
      load();
    } catch {
      toast.error("Failed to delete user");
    }
  };

  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter(u => u.role === "Admin").length;
    const staff = users.filter(u => u.role === "Staff").length;
    const active = users.filter(u => u.active).length;
    return { total, admins, staff, active };
  }, [users]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">User Management</h1>
            <p className="text-gray-600">Manage system users and their permissions</p>
          </div>
          <button
            onClick={() => { setEditing(null); setOpen(true); }}
            className="inline-flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2.5 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
          >
            <Plus size={18} /> Add User
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard title="Total Users" value={stats.total} icon={<Users size={20} />} />
          <StatCard title="Administrators" value={stats.admins} icon={<Users size={20} />} type="admin" />
          <StatCard title="Staff Members" value={stats.staff} icon={<Users size={20} />} type="staff" />
          <StatCard title="Active Users" value={stats.active} icon={<Users size={20} />} type="active" />
        </div>
      </div>

      {/* Search and Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Search users by name, email, or role..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium">
              <Filter size={16} />
              Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium">
              <Download size={16} />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800">
            Users ({filtered.length})
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {loading ? "Loading users..." : "All users in the system"}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-700">User</th>
                <th className="text-left p-4 font-semibold text-gray-700">Email</th>
                <th className="text-left p-4 font-semibold text-gray-700">Role</th>
                <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                <th className="text-right p-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {user.fullName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.fullName || "—"}</div>
                        <div className="text-xs text-gray-500">
                          Joined {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-gray-700">{user.email}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === "Admin" 
                        ? "bg-purple-100 text-purple-800" 
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.active 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      {user.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors font-medium text-sm"
                        onClick={() => { setEditing(user); setOpen(true); }}
                      >
                        <Pencil size={14} /> Edit
                      </button>
                      <button
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-red-700 bg-red-50 rounded-lg hover:bg-red-100 focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors font-medium text-sm"
                        onClick={() => onDelete(user._id)}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td className="p-8 text-center text-gray-500" colSpan={5}>
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-4xl mb-2">👥</div>
                      <div className="text-lg font-medium text-gray-900 mb-1">No users found</div>
                      <p className="text-gray-600 max-w-md">
                        {q ? "No users match your search criteria. Try adjusting your search terms." : "Get started by adding your first user to the system."}
                      </p>
                      {!q && (
                        <button
                          onClick={() => { setEditing(null); setOpen(true); }}
                          className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors font-medium"
                        >
                          <Plus size={16} /> Add First User
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td className="p-8 text-center text-gray-500" colSpan={5}>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      Loading users...
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <UserForm
          initial={editing}
          onClose={() => setOpen(false)}
          onSaved={() => { setOpen(false); load(); }}
        />
      )}
    </div>
  );
}

function StatCard({ title, value, icon, type = "default" }) {
  const typeStyles = {
    default: "bg-white border-gray-200",
    admin: "bg-purple-50 border-purple-200",
    staff: "bg-blue-50 border-blue-200",
    active: "bg-green-50 border-green-200"
  };

  const iconStyles = {
    default: "text-gray-600",
    admin: "text-purple-600",
    staff: "text-blue-600",
    active: "text-green-600"
  };

  return (
    <div className={`rounded-lg border p-4 md:p-5 ${typeStyles[type]} hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-gray-600 mb-1">{title}</div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
        </div>
        <div className={`p-2 rounded-lg ${iconStyles[type]} bg-white`}>
          {icon}
        </div>
      </div>
    </div>
  );
}