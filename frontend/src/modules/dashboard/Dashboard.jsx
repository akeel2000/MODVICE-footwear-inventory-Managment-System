import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { Card } from "../shared/Card";
import { LowStockAlerts } from "../alerts/LowStockAlerts";
import { InventoryChart } from "./InventoryChart";

export default function Dashboard() {
  const [stats, setStats] = useState({
    products: 0,
    lowStock: 0,
    salesToday: 0,
    qtyToday: 0,
  });

  const load = async () => {
    try {
      const { data } = await api.get("/dashboard");
      setStats({
        products: Number(data?.products ?? 0),
        lowStock: Number(data?.lowStock ?? 0),
        salesToday: Number(data?.salesToday ?? 0),
        qtyToday: Number(data?.qtyToday ?? 0),
      });
    } catch {
      setStats({ products: 0, lowStock: 0, salesToday: 0, qtyToday: 0 });
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6 p-4">
      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card 
          title="Products" 
          value={stats.products} 
          className="h-full"
        />
        <Card 
          title="Low Stock" 
          value={stats.lowStock} 
          className="h-full"
        />
        <Card 
          title="Sales Today (Rs.)" 
          value={stats.salesToday.toFixed(2)} 
          className="h-full"
        />
        <Card 
          title="Qty Sold Today" 
          value={stats.qtyToday} 
          className="h-full"
        />
      </div>

      {/* Chart and Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
            <InventoryChart />
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 h-full">
            <LowStockAlerts onAnyChange={load} />
          </div>
        </div>
      </div>
    </div>
  );
}