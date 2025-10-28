import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../auth/AuthContext";
import { Card } from "../shared/Card";
import { listSales } from "../../services/api";
import { Download, Filter, Calendar, BarChart3, RefreshCw } from "lucide-react";

const fmt = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function ReportsPage() {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [range, setRange] = useState({ from: fmt(firstOfMonth), to: fmt(today) });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const run = async () => {
    if (!range.from || !range.to) return toast.error("Please select both From and To dates");
    setLoading(true);
    try {
      const { data } = await listSales(range);
      const normalized = (data || []).map((r) => ({ ...r, image: r.image || r.product?.image || "" }));
      setRows(normalized);
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Failed to load report");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { run(); }, []); // initial load

  const totals = useMemo(() => {
    const base = { count: rows.length, qty: 0, sales: 0, purchases: 0, net: 0 };
    return rows.reduce((acc, r) => {
      const amt = Number(r.amount || 0);
      const qty = Number(r.qty || 0);
      acc.qty += qty;
      if (amt >= 0) acc.sales += amt; else acc.purchases += Math.abs(amt);
      acc.net += amt;
      return acc;
    }, base);
  }, [rows]);

  const exportCSV = () => {
    const header = ["Date", "Product", "Type", "Qty", "Amount", "Image URL"];
    const data = rows.map((r) => [r.date, r.product, r.type, r.qty, r.amount, r.image || ""]);
    const csv = [header, ...data].map((a) => a.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; 
    a.download = `sales-report-${range.from}-to-${range.to}.csv`; 
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported successfully");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Sales Reports</h1>
            <p className="text-gray-600">Analyze sales performance and transaction history</p>
          </div>
          {user?.role === "Admin" && rows.length > 0 && (
            <button 
              onClick={exportCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
            >
              <Download size={18} />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                <Calendar size={16} />
                From Date
              </span>
              <input 
                type="date" 
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={range.from} 
                onChange={(e) => setRange({ ...range, from: e.target.value })} 
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                <Calendar size={16} />
                To Date
              </span>
              <input 
                type="date" 
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={range.to} 
                onChange={(e) => setRange({ ...range, to: e.target.value })} 
              />
            </label>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={run} 
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Filter size={18} />
                  Generate Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card 
          title="Total Transactions" 
          value={totals.count} 
          icon={<BarChart3 size={20} />}
        />
        <Card 
          title="Total Quantity" 
          value={totals.qty} 
          icon={<BarChart3 size={20} />}
        />
        <Card 
          title="Total Sales" 
          value={`Rs. ${totals.sales.toFixed(2)}`} 
          icon={<BarChart3 size={20} />}
          type="success"
        />
        <Card 
          title="Total Returns" 
          value={`Rs. ${totals.purchases.toFixed(2)}`} 
          icon={<BarChart3 size={20} />}
          type="warning"
        />
        <Card 
          title="Net Amount" 
          value={`Rs. ${totals.net.toFixed(2)}`} 
          icon={<BarChart3 size={20} />}
          type={totals.net >= 0 ? "success" : "error"}
        />
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800">
            Transaction Details ({rows.length} records)
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Showing transactions from {range.from} to {range.to}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-700 w-20">Image</th>
                <th className="text-left p-4 font-semibold text-gray-700">Date</th>
                <th className="text-left p-4 font-semibold text-gray-700">Product</th>
                <th className="text-left p-4 font-semibold text-gray-700">Type</th>
                <th className="text-left p-4 font-semibold text-gray-700">Qty</th>
                <th className="text-left p-4 font-semibold text-gray-700">Amount (Rs.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((r, i) => {
                const typeColors = {
                  Sale: 'bg-green-100 text-green-800',
                  Return: 'bg-red-100 text-red-800',
                  Restock: 'bg-blue-100 text-blue-800'
                };

                return (
                  <tr key={r.id || r._id || i} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      {r.image ? (
                        <img 
                          src={r.image} 
                          alt={r.product} 
                          className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                          loading="lazy" 
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No Image</span>
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-medium text-gray-900 whitespace-nowrap">
                      {r.date}
                    </td>
                    <td className="p-4 text-gray-700">{r.product}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        typeColors[r.type] || 'bg-gray-100 text-gray-800'
                      }`}>
                        {r.type}
                      </span>
                    </td>
                    <td className="p-4 text-gray-700">{r.qty}</td>
                    <td className={`p-4 font-medium ${
                      Number(r.amount) < 0 ? "text-red-600" : "text-gray-900"
                    }`}>
                      {Number(r.amount).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && !loading && (
                <tr>
                  <td className="p-8 text-center text-gray-500" colSpan={6}>
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-4xl mb-2">📊</div>
                      <div className="text-lg font-medium text-gray-900 mb-1">No transactions found</div>
                      <p className="text-gray-600">Select a date range and generate a report to see transaction data.</p>
                    </div>
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td className="p-8 text-center text-gray-500" colSpan={6}>
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={18} className="animate-spin" />
                      Loading transactions...
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td className="p-4 font-semibold text-gray-900" colSpan={5}>
                    Net Total
                  </td>
                  <td className={`p-4 font-semibold ${
                    totals.net < 0 ? "text-red-600" : "text-gray-900"
                  }`}>
                    {totals.net.toFixed(2)} Rs.
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}