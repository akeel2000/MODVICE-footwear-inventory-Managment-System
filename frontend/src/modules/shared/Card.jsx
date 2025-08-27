import React from "react";
export function Card({ title, value }) {
  return (
    <div className="bg-white border rounded-2xl p-5">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
