import React from "react";
import { useAuth } from "../auth/AuthContext";

export default function Topbar() {
  const { user } = useAuth();
  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-4">
      <div className="font-semibold">Inventory Management</div>
      <div className="text-sm text-gray-600">
        {user ? `${user.fullName || user.email} (${user.role || "Staff"})` : "Guest"}
      </div>
    </header>
  );
}
