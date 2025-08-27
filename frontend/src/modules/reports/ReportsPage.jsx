import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../auth/AuthContext";
import { Card } from "../shared/Card";
import { listSales } from "../../services/api";

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
    a.href = url; a.download = "report.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border rounded-2xl p-4 flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="text-sm text-gray-600">From</span>
          <input type="date" className="mt-1 border rounded-xl px-3 py-2" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} />
        </label>
        <label className="block">
          <span className="text-sm text-gray-600">To</span>
          <input type="date" className="mt-1 border rounded-xl px-3 py-2" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} />
        </label>
        <button onClick={run} disabled={loading} className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-60">
          {loading ? "Loading…" : "Generate"}
        </button>

        {user?.role === "Admin" && rows.length > 0 && (
          <button onClick={exportCSV} className="px-4 py-2 rounded-xl border">Export CSV</button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card title="Transactions" value={totals.count} />
        <Card title="Total Qty" value={totals.qty} />
        <Card title="Sales (Rs.)" value={totals.sales.toFixed(2)} />
        <Card title="Returns (Rs.)" value={totals.purchases.toFixed(2)} />
        <Card title="Net (Rs.)" value={totals.net.toFixed(2)} />
      </div>

      <div className="bg-white border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Image</th>
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Product</th>
              <th className="text-left p-3">Type</th>
              <th className="text-left p-3">Qty</th>
              <th className="text-left p-3">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id || r._id || i} className="border-t">
                <td className="p-3">
                  {r.image ? (
                    <img src={r.image} alt={r.product} className="h-10 w-10 rounded object-cover border" loading="lazy" />
                  ) : (
                    <div className="h-10 w-10 rounded bg-gray-100 grid place-items-center text-[10px] text-gray-400">N/A</div>
                  )}
                </td>
                <td className="p-3">{r.date}</td>
                <td className="p-3">{r.product}</td>
                <td className="p-3">{r.type}</td>
                <td className="p-3">{r.qty}</td>
                <td className={`p-3 ${Number(r.amount) < 0 ? "text-red-600" : ""}`}>{Number(r.amount).toFixed(2)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="p-6 text-center text-gray-500" colSpan={6}>
                  No data. Select a date range and click Generate.
                </td>
              </tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t bg-gray-50">
                <td className="p-3 font-semibold" colSpan={5}>Total</td>
                <td className={`p-3 font-semibold ${totals.net < 0 ? "text-red-600" : ""}`}>{totals.net.toFixed(2)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
