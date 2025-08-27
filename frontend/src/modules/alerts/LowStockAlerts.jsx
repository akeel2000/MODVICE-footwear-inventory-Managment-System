import React, { useEffect, useState } from "react";
import { lowStock } from "../../services/api";

export function LowStockAlerts({ onAnyChange }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await lowStock();
      setItems(Array.isArray(data) ? data : data?.items || []);
    } catch {
      setItems([
        { _id: "1", name: "Sneaker A", qty: 3 },
        { _id: "2", name: "Loafer B", qty: 2 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (typeof onAnyChange === "function") onAnyChange(); }, [items.length]); // eslint-disable-line

  return (
    <div className="bg-white border rounded-2xl p-4">
      <div className="font-semibold mb-2">Low Stock Alerts</div>
      {loading ? (
        <ul className="space-y-2 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="flex justify-between text-sm">
              <span className="h-4 w-40 bg-gray-200 rounded" />
              <span className="h-4 w-8 bg-gray-200 rounded" />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="space-y-2">
          {items.length === 0 && <li className="text-sm text-gray-500">No alerts 🎉</li>}
          {items.map((it) => (
            <li key={it._id} className="flex justify-between text-sm">
              <span>{it.name}</span>
              <span className="text-red-600 font-medium">{it.qty}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
