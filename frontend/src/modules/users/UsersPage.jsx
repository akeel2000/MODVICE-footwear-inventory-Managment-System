import React, { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import UserForm from "./UserForm";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    try {
      const { data } = await api.get("/users");
      setUsers(Array.isArray(data) ? data : data?.items || []);
    } catch {
      toast.error("Failed to load users");
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
    if (!window.confirm("Delete this user?")) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success("Deleted");
      load();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-2.5" size={18} />
          <input
            className="pl-10 pr-3 py-2 border rounded-xl w-72"
            placeholder="Search name, email, role…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <button
          onClick={() => { setEditing(null); setOpen(true); }}
          className="inline-flex items-center gap-2 bg-black text-white rounded-xl px-4 py-2"
        >
          <Plus size={18} /> Add User
        </button>
      </div>

      <div className="bg-white border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Full Name</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Role</th>
              <th className="text-left p-3">Active</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u._id} className="border-t">
                <td className="p-3">{u.fullName}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.role}</td>
                <td className="p-3">{u.active ? "Yes" : "No"}</td>
                <td className="p-3 text-right space-x-2">
                  <button
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border hover:bg-gray-50"
                    onClick={() => { setEditing(u); setOpen(true); }}
                  >
                    <Pencil size={16} /> Edit
                  </button>
                  <button
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border text-red-600 hover:bg-red-50"
                    onClick={() => onDelete(u._id)}
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="p-6 text-center text-gray-500" colSpan={5}>
                  No users.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
