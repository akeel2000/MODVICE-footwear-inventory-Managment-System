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

  const lowIf = (p) => (Number(p.quantity ?? 0) <= Number(p.reorderThreshold ?? 3) ? "bg-red-50" : "");

  return (
    <div className="space-y-4">
      <div className="bg-white border rounded-2xl p-4">
        <form onSubmit={submit} className="grid md:grid-cols-4 gap-3">
          <label className="block md:col-span-4">
            <span className="text-sm text-gray-600">Scan here</span>
            <div className="mt-1 flex items-center gap-2">
              <BarcodeInput
                value=""
                onChange={() => {}}
                onScanned={handleScanned}
                placeholder="Focus here and scan a product barcode…"
                autoFocus
              />
              <button
                type="button"
                className="px-3 py-2 rounded-xl border"
                onClick={() => setScanOpen(true)}
                title="Open camera barcode scanner"
              >
                📷
              </button>
            </div>
            <div className="text-xs text-gray-500">
              Use a USB/Bluetooth scanner or a phone wedge app. Or use the camera scanner (📷).
            </div>
          </label>

          <label className="block md:col-span-2">
            <span className="text-sm text-gray-600">Product</span>
            <div className="mt-1 space-y-2">
              <input
                placeholder="Search name / brand / barcode"
                className="w-full border rounded-xl px-3 py-2"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <select
                className="w-full border rounded-xl px-3 py-2"
                value={form.productId}
                onChange={(e) => setForm({ ...form, productId: e.target.value })}
                required
              >
                <option value="">Select…</option>
                {filtered.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} — {p.brand} ({p.barcode || "no barcode"})
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label className="block">
            <span className="text-sm text-gray-600">Type</span>
            <select
              className="mt-1 w-full border rounded-xl px-3 py-2"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option>Sale</option>
              <option>Return</option>
              <option>Restock</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm text-gray-600">Qty</span>
            <input
              type="number"
              min="1"
              className="mt-1 w-full border rounded-xl px-3 py-2"
              value={form.qty}
              onChange={(e) => setForm({ ...form, qty: Number(e.target.value || 1) })}
            />
            {selected && form.type === "Sale" && Number(form.qty) > Number(selected.quantity ?? 0) && (
              <div className="text-xs text-red-600 mt-1">Insufficient stock</div>
            )}
          </label>

          <label className="block">
            <span className="text-sm text-gray-600">Unit Price</span>
            <input
              type="number"
              step="0.01"
              className="mt-1 w-full border rounded-xl px-3 py-2"
              value={form.unitPrice}
              onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
            />
          </label>

          <div className="md:col-span-4 flex items-center gap-3 pt-1">
            <button type="submit" className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50" disabled={!form.productId || Number(form.qty) <= 0 || Number(form.unitPrice) < 0}>
              Save
            </button>
            {selected && (
              <div className="text-sm text-gray-600">
                Current stock: <b>{selected.quantity ?? 0}</b> &nbsp;|&nbsp; Reorder at <b>{selected.reorderThreshold ?? 3}</b>
              </div>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Brand</th>
              <th className="text-left p-3">Barcode</th>
              <th className="text-left p-3">Price</th>
              <th className="text-left p-3">Qty</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 25).map((p) => (
              <tr key={p._id} className={`border-t ${lowIf(p)}`}>
                <td className="p-3">{p.name}</td>
                <td className="p-3">{p.brand}</td>
                <td className="p-3">{p.barcode || "—"}</td>
                <td className="p-3">{Number(p.price || 0).toFixed(2)}</td>
                <td className="p-3">{p.quantity ?? 0}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="p-6 text-center text-gray-500" colSpan={5}>No matches</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
