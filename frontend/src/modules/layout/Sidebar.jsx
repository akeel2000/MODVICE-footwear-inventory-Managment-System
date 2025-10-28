// frontend/src/components/layout/Sidebar.jsx
import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  Package, 
  BarChart3, 
  Settings as Cog, 
  LogOut, 
  Users, 
  ShoppingCart, 
  Home, 
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";

const linkClass = ({ isActive }, collapsed) =>
  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium group ${
    isActive 
      ? "bg-blue-600 text-white shadow-sm" 
      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
  } ${collapsed ? 'justify-center px-3' : ''}`;

const tooltipClass = "absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50";

export default function Sidebar({ collapsed = false, mobile = false, onClose, onToggleCollapse }) {
  const { logout, user } = useAuth();
  const location = useLocation();
  
  const handleNavClick = () => {
    if (mobile) {
      onClose?.();
    }
  };

  const NavigationItem = ({ to, icon, label, end = false }) => (
    <NavLink 
      to={to} 
      end={end}
      className={(props) => linkClass(props, collapsed)}
      onClick={handleNavClick}
    >
      {icon}
      {!collapsed && <span className="truncate">{label}</span>}
      {collapsed && (
        <div className={tooltipClass}>
          {label}
        </div>
      )}
    </NavLink>
  );

  return (
    <aside className={`bg-white border-r border-gray-200 h-full flex flex-col transition-all duration-300 ${
      mobile ? 'w-64' : collapsed ? 'w-20' : 'w-64'
    }`}>
      {/* Logo/Brand Section */}
      <div className={`h-20 flex items-center justify-between border-b border-gray-200 ${
        collapsed ? 'px-3' : 'px-6'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">MODVICE</h1>
              <p className="text-xs text-gray-500 truncate">Inventory System</p>
            </div>
          )}
        </div>
        
        {/* Collapse Toggle - Desktop only */}
        {!mobile && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
        
        {/* Close Button - Mobile only */}
        {mobile && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Navigation Section */}
      <div className="flex-1 py-6 overflow-y-auto">
        <nav className="px-3 space-y-1">
          {!collapsed && (
            <div className="px-3 mb-4">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Main</h2>
            </div>
          )}
          
          <NavigationItem 
            to="/app" 
            icon={<Home size={20} className="flex-shrink-0" />}
            label="Dashboard"
            end
          />
          
          <NavigationItem 
            to="/app/sales" 
            icon={<ShoppingCart size={20} className="flex-shrink-0" />}
            label="Sales"
          />
          
          <NavigationItem 
            to="/app/products" 
            icon={<Package size={20} className="flex-shrink-0" />}
            label="Products"
          />
          
          <NavigationItem 
            to="/app/reports" 
            icon={<BarChart3 size={20} className="flex-shrink-0" />}
            label="Reports"
          />

          {/* Admin Section */}
          {user?.role === "Admin" && (
            <>
              {!collapsed && (
                <div className="px-3 mt-6 mb-4">
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Administration</h2>
                </div>
              )}
              
              <NavigationItem 
                to="/app/users" 
                icon={<Users size={20} className="flex-shrink-0" />}
                label="Users"
              />
              
              <NavigationItem 
                to="/app/settings" 
                icon={<Cog size={20} className="flex-shrink-0" />}
                label="Settings"
              />
            </>
          )}
        </nav>
      </div>

      {/* User & Logout Section */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        {!collapsed ? (
          <>
            <div className="flex items-center gap-3 px-3 py-2 mb-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-gray-700">
                  {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name || user?.email || 'User'}
                </p>
                <p className="text-xs text-gray-500 capitalize truncate">
                  {user?.role?.toLowerCase() || 'user'}
                </p>
              </div>
            </div>
            
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-white hover:text-gray-900 transition-all duration-200 font-medium border border-transparent hover:border-gray-300"
            >
              <LogOut size={20} className="flex-shrink-0" />
              <span className="truncate">Logout</span>
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center space-y-3">
            <div className="relative group">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">
                  {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className={tooltipClass}>
                {user?.name || user?.email || 'User'}
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg text-gray-700 hover:bg-white transition-all duration-200 relative group"
              title="Logout"
            >
              <LogOut size={20} />
              <div className={tooltipClass}>
                Logout
              </div>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}