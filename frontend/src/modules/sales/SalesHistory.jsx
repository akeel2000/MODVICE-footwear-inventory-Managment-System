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
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales History</h1>
          <p className="text-gray-600 mt-1">View and manage all transaction records</p>
        </div>
        <div className="text-sm text-gray-500">
          Showing {rows.length} transaction{rows.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">From Date</span>
            <input
              type="date"
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">To Date</span>
            <input
              type="date"
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Type</span>
            <select
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              <option value="">All Types</option>
              <option>Sale</option>
              <option>Return</option>
              <option>Restock</option>
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm font-medium text-gray-700">Search Products</span>
            <input
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Search by product name, brand, or barcode..."
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            />
          </label>
        </div>
        
        <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={() => load(buildParams())}
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Loading...
              </>
            ) : (
              'Apply Filters'
            )}
          </button>
          <button
            onClick={() => {
              setFilters({ from: "", to: "", type: "", q: "" });
              setTimeout(() => load({}), 0);
            }}
            className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium"
          >
            Reset All
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <SummaryCard title="Total Entries" value={totals.count} />
        <SummaryCard title="Total Quantity" value={totals.qty} />
        <SummaryCard title="Sales (Rs.)" value={totals.sales.toFixed(2)} />
        <SummaryCard title="Returns (Rs.)" value={totals.returns.toFixed(2)} />
        <SummaryCard title="Restock (Rs.)" value={totals.restock.toFixed(2)} />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800">Transaction Records</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-700">Date</th>
                <th className="text-left p-4 font-semibold text-gray-700">Product</th>
                <th className="text-left p-4 font-semibold text-gray-700">Type</th>
                <th className="text-left p-4 font-semibold text-gray-700">Qty</th>
                <th className="text-left p-4 font-semibold text-gray-700">Unit Price</th>
                <th className="text-left p-4 font-semibold text-gray-700">Amount</th>
                <th className="text-right p-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((r, i) => {
                const id = r._id || r.id || i;
                const typeColors = {
                  Sale: 'bg-green-100 text-green-800',
                  Return: 'bg-red-100 text-red-800',
                  Restock: 'bg-blue-100 text-blue-800'
                };
                
                return (
                  <tr key={id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-900 whitespace-nowrap">
                      {r.date}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {r.image ? (
                          <img src={r.image} alt="" className="h-10 w-10 rounded-lg object-cover border border-gray-200" />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">No Image</span>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 truncate">{r.product}</div>
                          <div className="text-xs text-gray-500 truncate">
                            {r.brand} • {r.barcode || "No barcode"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[r.type] || 'bg-gray-100 text-gray-800'}`}>
                        {r.type}
                      </span>
                    </td>
                    <td className="p-4 text-gray-700">{Number(r.qty || 0)}</td>
                    <td className="p-4 text-gray-700">{Number(r.unitPrice || 0).toFixed(2)}</td>
                    <td className={`p-4 font-medium ${
                      Number(r.amount) < 0 ? "text-red-600" : "text-gray-900"
                    }`}>
                      {Number(r.amount || 0).toFixed(2)}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        className="px-3 py-1.5 text-xs border border-red-300 text-red-700 rounded-lg hover:bg-red-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors font-medium"
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
                  <td className="p-8 text-center text-gray-500" colSpan={7}>
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-4xl mb-2">📊</div>
                      <div className="text-lg font-medium text-gray-900 mb-1">No transactions found</div>
                      <p className="text-gray-600">Adjust your filters or add new transactions to see records here.</p>
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
                  <td className={`p-4 font-semibold ${totals.net < 0 ? "text-red-600" : "text-gray-900"}`} colSpan={2}>
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

function SummaryCard({ title, value }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-5 hover:shadow-md transition-shadow">
      <div className="text-sm font-medium text-gray-600 mb-1">{title}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}