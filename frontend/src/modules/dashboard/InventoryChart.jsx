// frontend/src/modules/dashboard/InventoryChart.jsx
import React from "react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "Mon", stock: 450 },
  { name: "Tue", stock: 470 },
  { name: "Wed", stock: 430 },
  { name: "Thu", stock: 520 },
  { name: "Fri", stock: 510 },
  { name: "Sat", stock: 540 },
  { name: "Sun", stock: 530 }
];

export function InventoryChart() {
  return (
    <div className="bg-white border rounded-2xl p-4">
      <div className="font-semibold mb-2">Stock Trend (Demo)</div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="stock" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
