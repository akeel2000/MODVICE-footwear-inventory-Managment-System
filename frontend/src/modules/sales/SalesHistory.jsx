// frontend/src/modules/sales/SalesHistory.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { listSales, deleteSale } from "../../services/api";
import toast from "react-hot-toast";

export default function SalesHistory() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ from: "", to: "", type: "", q: "" });

  // Build params from current filters (stable reference)
  const buildParams = useCallback(
    () => ({
      from: filters.from || undefined,
      to: filters.to || undefined,
      type: filters.type || undefined,
      q: filters.q || undefined,
    }),
    [filters]
  );

  // Loader does not depend on filters; we pass params explicitly
  const load = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const { data } = await listSales(params);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load sales");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load once
  useEffect(() => {
    load(buildParams());
  }, [load, buildParams]);

  const totals = useMemo(() => {
    return rows.reduce(
      (a, r) => {
        const amt = Number(r.amount || 0);
        const qty = Number(r.qty || 0);
        a.count += 1;
        a.qty += qty;
        if (r.type === "Sale") a.sales += amt;
        if (r.type === "Return") a.returns += Math.abs(amt);
        if (r.type === "Restock") a.restock += amt;
        a.net += amt;
        return a;
      },
      { count: 0, qty: 0, sales: 0, returns: 0, restock: 0, net: 0 }
    );
  }, [rows]);

  const onDelete = async (id) => {
    if (!window.confirm("Delete this entry? (You can optionally revert stock in the next step)")) return;
    const doRevert = window.confirm("Revert stock change made by this transaction?");
    try {
      await deleteSale(id, { revert: doRevert });
      toast.success("Deleted");
      load(buildParams());
    } catch (e) {
      toast.error(e?.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white border rounded-2xl p-4 grid md:grid-cols-5 gap-3">
        <label className="block">
          <span className="text-sm text-gray-600">From</span>
          <input
            type="date"
            className="mt-1 w-full border rounded-xl px-3 py-2"
            value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="text-sm text-gray-600">To</span>
          <input
            type="date"
            className="mt-1 w-full border rounded-xl px-3 py-2"
            value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="text-sm text-gray-600">Type</span>
          <select
            className="mt-1 w-full border rounded-xl px-3 py-2"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          >
            <option value="">All</option>
            <option>Sale</option>
            <option>Return</option>
            <option>Restock</option>
          </select>
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm text-gray-600">Search (product / brand / barcode)</span>
          <input
            className="mt-1 w-full border rounded-xl px-3 py-2"
            placeholder="e.g. Nike, 8901, Air"
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          />
        </label>
        <div className="md:col-span-5 flex gap-2">
          <button
            onClick={() => load(buildParams())}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-black text-white"
          >
            {loading ? "Loading…" : "Apply"}
          </button>
          <button
            onClick={() => {
              setFilters({ from: "", to: "", type: "", q: "" });
              setTimeout(() => load({}), 0);
            }}
            className="px-4 py-2 rounded-xl border"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <SummaryCard title="Entries" value={totals.count} />
        <SummaryCard title="Total Qty" value={totals.qty} />
        <SummaryCard title="Sales (Rs.)" value={totals.sales.toFixed(2)} />
        <SummaryCard title="Returns (Rs.)" value={totals.returns.toFixed(2)} />
        <SummaryCard title="Restock (Rs.)" value={totals.restock.toFixed(2)} />
      </div>

      {/* Table */}
      <div className="bg-white border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Product</th>
              <th className="text-left p-3">Type</th>
              <th className="text-left p-3">Qty</th>
              <th className="text-left p-3">Unit Price</th>
              <th className="text-left p-3">Amount</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const id = r._id || r.id || i;
              return (
                <tr key={id} className="border-t">
                  <td className="p-3">{r.date}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {r.image ? (
                        <img src={r.image} alt="" className="h-8 w-8 rounded object-cover border" />
                      ) : (
                        <div className="h-8 w-8 rounded bg-gray-100 border" />
                      )}
                      <div>
                        <div className="font-medium">{r.product}</div>
                        <div className="text-xs text-gray-500">
                          {r.brand} • {r.barcode || "—"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">{r.type}</td>
                  <td className="p-3">{Number(r.qty || 0)}</td>
                  <td className="p-3">{Number(r.unitPrice || 0).toFixed(2)}</td>
                  <td className={`p-3 ${Number(r.amount) < 0 ? "text-red-600" : ""}`}>
                    {Number(r.amount || 0).toFixed(2)}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      className="px-3 py-1 rounded-lg border text-red-600 hover:bg-red-50"
                      onClick={() => onDelete(r._id || r.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td className="p-6 text-center text-gray-500" colSpan={7}>
                  No transactions. Adjust filters or add entries.
                </td>
              </tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t bg-gray-50">
                <td className="p-3 font-semibold" colSpan={5}>
                  Net
                </td>
                <td className={`p-3 font-semibold ${totals.net < 0 ? "text-red-600" : ""}`} colSpan={2}>
                  {totals.net.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

function SummaryCard({ title, value }) {
  return (
    <div className="bg-white border rounded-2xl p-4">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-xl font-semibold mt-1">{value}</div>
    </div>
  );
}
