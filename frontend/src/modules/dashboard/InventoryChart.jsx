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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Stock Trend (Demo)</h3>
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Stock Level</span>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="h-72 md:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="stock" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#1d4ed8' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800">{data.reduce((sum, item) => sum + item.stock, 0)}</div>
          <div className="text-sm text-gray-500">Total Stock</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800">
            {Math.max(...data.map(item => item.stock))}
          </div>
          <div className="text-sm text-gray-500">Peak Stock</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800">
            {Math.min(...data.map(item => item.stock))}
          </div>
          <div className="text-sm text-gray-500">Lowest Stock</div>
        </div>
      </div>
    </div>
  );
}