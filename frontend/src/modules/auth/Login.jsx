import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { LockKeyhole, Mail } from "lucide-react";

export default function Login() {
  const { token, login, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from?.pathname || "/app";

  const [form, setForm] = useState({ email: "", password: "" });

  if (token) return <Navigate to={from} replace />;

  const submit = async (e) => {
    e.preventDefault();
    const ok = await login(form.email, form.password);
    if (ok) navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">MODVICE Login</h1>
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="text-sm text-gray-600">Email</span>
            <div className="mt-1 flex items-center gap-2 border rounded-xl px-3">
              <Mail size={18} />
              <input
                type="email"
                className="w-full py-2 outline-none"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </label>
          <label className="block">
            <span className="text-sm text-gray-600">Password</span>
            <div className="mt-1 flex items-center gap-2 border rounded-xl px-3">
              <LockKeyhole size={18} />
              <input
                type="password"
                className="w-full py-2 outline-none"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-black text-white hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
