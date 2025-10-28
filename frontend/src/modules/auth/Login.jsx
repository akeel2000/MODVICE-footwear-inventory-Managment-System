import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { LockKeyhole, Mail, Eye, EyeOff, Package } from "lucide-react";

export default function Login() {
  const { token, login, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from?.pathname || "/app";

  const [form, setForm] = useState({ 
    email: "", 
    password: "" 
  });
  const [showPassword, setShowPassword] = useState(false);

  if (token) return <Navigate to={from} replace />;

  const submit = async (e) => {
    e.preventDefault();
    const ok = await login(form.email, form.password);
    if (ok) navigate(from, { replace: true });
  };

  const inputClass = "w-full py-3 bg-transparent outline-none text-gray-700 placeholder-gray-400";

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Brand/Visual Section */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-blue-600 to-blue-700 text-white p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
            <Package className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">MODVICE</h1>
            <p className="text-blue-100 text-sm">Inventory System</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold mb-4">
              Streamline Your Inventory Management
            </h2>
            <p className="text-blue-100 text-lg leading-relaxed">
              Access your dashboard to manage products, track sales, and generate comprehensive reports all in one place.
            </p>
          </div>

          <div className="flex items-center gap-4 text-blue-100">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Real-time Analytics</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Secure Access</span>
            </div>
          </div>
        </div>

        <div className="text-blue-100 text-sm">
          © 2024 MODVICE Inventory System. All rights reserved.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Package className="text-white" size={24} />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">MODVICE</h1>
              <p className="text-gray-500 text-sm">Inventory System</p>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome Back
              </h2>
              <p className="text-gray-600">
                Sign in to your inventory dashboard
              </p>
            </div>

            <form onSubmit={submit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="flex items-center gap-3 border border-gray-300 rounded-xl px-4 py-3 transition-all duration-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 hover:border-gray-400">
                  <Mail size={20} className="text-gray-400 flex-shrink-0" />
                  <input
                    type="email"
                    className={inputClass}
                    placeholder="you@company.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="flex items-center gap-3 border border-gray-300 rounded-xl px-4 py-3 transition-all duration-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 hover:border-gray-400">
                  <LockKeyhole size={20} className="text-gray-400 flex-shrink-0" />
                  <input
                    type={showPassword ? "text" : "password"}
                    className={inputClass}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in to Dashboard"
                )}
              </button>
            </form>

            {/* Demo Credentials Hint */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-600 text-center">
                <strong>Demo Access:</strong> Use admin@modvice.com / password
              </p>
            </div>
          </div>

          {/* Mobile Footer */}
          <div className="lg:hidden mt-8 text-center">
            <p className="text-gray-500 text-sm">
              © 2024 MODVICE Inventory System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}