import React from "react";
import { NavLink } from "react-router-dom";
import { Package, BarChart3, Settings as Cog, LogOut, Users, ShoppingCart } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-2 rounded-xl transition ${
    isActive ? "bg-black text-white" : "hover:bg-gray-100"
  }`;

export default function Sidebar() {
  const { logout, user } = useAuth();
  return (
    <aside className="w-60 hidden md:flex flex-col border-r bg-white">
      <div className="h-16 flex items-center px-4 text-xl font-bold">MODVICE</div>
      <nav className="p-3 space-y-1">
        <NavLink to="/app" end className={linkClass}>
          <BarChart3 size={18} /> Dashboard
        </NavLink>
        <NavLink to="/app/sales" className={linkClass}>
          <ShoppingCart size={18} /> Sales
        </NavLink>
        <NavLink to="/app/products" className={linkClass}>
          <Package size={18} /> Products
        </NavLink>
        <NavLink to="/app/reports" className={linkClass}>
          <BarChart3 size={18} /> Reports
        </NavLink>

        {user?.role === "Admin" && (
          <>
            <NavLink to="/app/users" className={linkClass}>
              <Users size={18} /> Users
            </NavLink>
            <NavLink to="/app/settings" className={linkClass}>
              <Cog size={18} /> Settings
            </NavLink>
          </>
        )}

        <button
          onClick={logout}
          className="mt-4 w-full text-left flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-gray-100"
        >
          <LogOut size={18} /> Logout
        </button>
      </nav>
    </aside>
  );
}
