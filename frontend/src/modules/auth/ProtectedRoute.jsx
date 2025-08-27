import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

/** <ProtectedRoute /> or <ProtectedRoute role="Admin" /> or role={["Admin","Mgr"]} */
export default function ProtectedRoute({ role }) {
  const { token, user } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role) {
    const allowed = Array.isArray(role) ? role.includes(user?.role) : user?.role === role;
    if (!allowed) return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}
