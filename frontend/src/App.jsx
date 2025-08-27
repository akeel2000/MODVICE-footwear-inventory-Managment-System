import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./modules/auth/Login";
import ProtectedRoute from "./modules/auth/ProtectedRoute";
import Layout from "./modules/layout/Layout";

import Dashboard from "./modules/dashboard/Dashboard";
import ProductsPage from "./modules/products/ProductsPage";
import ReportsPage from "./modules/reports/ReportsPage";
import Settings from "./modules/settings/Settings";
import UsersPage from "./modules/users/UsersPage";
import OnePageSite from "./modules/public/OnePageSite";
import SalesPage from "./modules/sales/SalesPage";

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<OnePageSite />} />
      <Route path="/login" element={<Login />} />

      {/* Protected app */}
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="reports" element={<ReportsPage />} />

          {/* Admin only */}
          <Route element={<ProtectedRoute role="Admin" />}>
            <Route path="users" element={<UsersPage />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* In-app fallback */}
          <Route path="*" element={<Navigate to="." replace />} />
        </Route>
      </Route>

      {/* Global fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
