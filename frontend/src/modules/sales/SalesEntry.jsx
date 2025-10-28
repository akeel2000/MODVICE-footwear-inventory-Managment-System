import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { createSale, listProducts, getByBarcode } from "../../services/api";
import BarcodeScanner from "../shared/BarcodeScanner";
import BarcodeInput from "../shared/BarcodeInput";

export default function SalesEntry() {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState("");
  const [scanOpen, setScanOpen] = useState(false);

  const [form, setForm] = useState({ productId: "", type: "Sale", qty: 1, unitPrice: "" });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await listProducts({ limit: 500, sort: "name" });
        const items = Array.isArray(data) ? data : data?.items || [];
        setProducts(items);
      } catch {
        toast.error("Failed to load products");
      }
    })();
  }, []);

  const selected = useMemo(
    () => products.find((p) => String(p._id) === String(form.productId)),
    [products, form.productId]
  );

  useEffect(() => {
    if (selected) setForm((f) => ({ ...f, unitPrice: Number(selected.price || 0) }));
    else setForm((f) => ({ ...f, unitPrice: "" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?._id]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return products;
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(s) ||
        p.brand?.toLowerCase().includes(s) ||
        p.barcode?.toLowerCase().includes(s)
    );
  }, [products, q]);

  async function handleScanned(code) {
    const clean = String(code || "").trim();
    if (!clean) return;

    let found = products.find((p) => (p.barcode || "").toLowerCase() === clean.toLowerCase());

    if (!found) {
      try {
        const { data } = await getByBarcode(clean);
        found = data;
        setProducts((list) => {
          const exists = list.some((p) => String(p._id) === String(data?._id));
          return exists ? list : [data, ...list];
        });
      } catch {}
    }

    if (found) {
      setForm((f) => ({ ...f, productId: found._id, unitPrice: Number(found.price || 0) }));
      toast.success(`Selected ${found.name}`);
    } else {
      toast.error("No product with that barcode");
    }
  }

  const submit = async (e) => {
    e.preventDefault();
    if (!form.productId) return toast.error("Pick a product");

    const qty = Number(form.qty);
    if (!Number.isFinite(qty) || qty <= 0) return toast.error("Qty must be > 0");

    const price = Number(form.unitPrice);
    if (!Number.isFinite(price) || price < 0) return toast.error("Enter a valid price");

    try {
      const body = { productId: form.productId, type: form.type, qty, unitPrice: price };
      const { data } = await createSale(body);
      toast.success(`${form.type} recorded`);
      setProducts((list) => list.map((p) => (String(p._id) === String(data.product._id) ? data.product : p)));
      setForm((f) => ({ ...f, qty: 1 }));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to record");
    }
  };

  const lowIf = (p) => (Number(p.quantity ?? 0) <= Number(p.reorderThreshold ?? 3) ? "bg-red-50 border-l-4 border-l-red-400" : "");

  return (
    <div className="space-y-6 p-4">
      {/* Form Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Sales Entry</h2>
        
        <form onSubmit={submit} className="space-y-6">
          {/* Barcode Scanner Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Barcode Scanner</span>
              <div className="mt-2 flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <BarcodeInput
                    value=""
                    onChange={() => {}}
                    onScanned={handleScanned}
                    placeholder="Focus here and scan a product barcode…"
                    autoFocus
                    className="w-full"
                  />
                </div>
                <button
                  type="button"
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 whitespace-nowrap"
                  onClick={() => setScanOpen(true)}
                >
                  <span>📷</span>
                  <span>Camera Scanner</span>
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Use a USB/Bluetooth scanner or a phone wedge app. Or use the camera scanner.
              </div>
            </label>
          </div>

          {/* Product Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Search Product</span>
              <input
                placeholder="Search by name, brand, or barcode"
                className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Select Product</span>
              <select
                className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={form.productId}
                onChange={(e) => setForm({ ...form, productId: e.target.value })}
                required
              >
                <option value="">Choose a product...</option>
                {filtered.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} — {p.brand} ({p.barcode || "no barcode"})
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Transaction Details */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Type</span>
              <select
                className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option>Sale</option>
                <option>Return</option>
                <option>Restock</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Quantity</span>
              <input
                type="number"
                min="1"
                className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={form.qty}
                onChange={(e) => setForm({ ...form, qty: Number(e.target.value || 1) })}
              />
              {selected && form.type === "Sale" && Number(form.qty) > Number(selected.quantity ?? 0) && (
                <div className="text-xs text-red-600 mt-1 font-medium">Insufficient stock</div>
              )}
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Unit Price (Rs.)</span>
              <input
                type="number"
                step="0.01"
                className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={form.unitPrice}
                onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
              />
            </label>

            <div className="flex items-end">
              <button 
                type="submit" 
                className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium" 
                disabled={!form.productId || Number(form.qty) <= 0 || Number(form.unitPrice) < 0}
              >
                Save Transaction
              </button>
            </div>
          </div>

          {/* Selected Product Info */}
          {selected && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Current Stock:</span>
                  <span className="font-semibold ml-1">{selected.quantity ?? 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">Reorder Threshold:</span>
                  <span className="font-semibold ml-1">{selected.reorderThreshold ?? 3}</span>
                </div>
                <div>
                  <span className="text-gray-600">Brand:</span>
                  <span className="font-semibold ml-1">{selected.brand}</span>
                </div>
                <div>
                  <span className="text-gray-600">Barcode:</span>
                  <span className="font-semibold ml-1">{selected.barcode || "—"}</span>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Products ({filtered.length})</h3>
          <p className="text-sm text-gray-600 mt-1">Showing first 25 matching products</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-700">Name</th>
                <th className="text-left p-4 font-semibold text-gray-700">Brand</th>
                <th className="text-left p-4 font-semibold text-gray-700">Barcode</th>
                <th className="text-left p-4 font-semibold text-gray-700">Price (Rs.)</th>
                <th className="text-left p-4 font-semibold text-gray-700">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.slice(0, 25).map((p) => (
                <tr 
                  key={p._id} 
                  className={`hover:bg-gray-50 transition-colors ${lowIf(p)} ${String(p._id) === String(form.productId) ? 'bg-blue-50' : ''}`}
                >
                  <td className="p-4 font-medium text-gray-900">{p.name}</td>
                  <td className="p-4 text-gray-700">{p.brand}</td>
                  <td className="p-4 font-mono text-gray-600">{p.barcode || "—"}</td>
                  <td className="p-4 text-gray-700">{Number(p.price || 0).toFixed(2)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      Number(p.quantity ?? 0) <= Number(p.reorderThreshold ?? 3) 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {p.quantity ?? 0}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="p-8 text-center text-gray-500" colSpan={5}>
                    No products found. Try adjusting your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      {scanOpen && (
        <BarcodeScanner
          onlyQr={false}
          onDetected={handleScanned}
          onClose={() => setScanOpen(false)}
        />
      )}
    </div>
  );
}