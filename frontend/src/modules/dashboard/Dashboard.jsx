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
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        <Card title="Products" value={stats.products} />
        <Card title="Low Stock" value={stats.lowStock} />
        <Card title="Sales Today (Rs.)" value={stats.salesToday.toFixed(2)} />
        <Card title="Qty Sold Today" value={stats.qtyToday} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <InventoryChart />
        </div>
        <LowStockAlerts onAnyChange={load} />
      </div>
    </div>
  );
}
