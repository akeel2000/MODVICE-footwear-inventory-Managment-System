import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import ProductForm from "./ProductForm";
import { useAuth } from "../auth/AuthContext";
import api, { listProducts, listPublicProducts, assetUrl } from "../../services/api";

const toAsset = (u) => assetUrl(u);

const pickArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.products)) return data.products;
  return [];
};

export default function ProductsPage() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const { user } = useAuth();

  const load = async () => {
    try {
      const hasToken = !!localStorage.getItem("token");
      let resp;

      if (hasToken) {
        try {
          resp = await listProducts();
        } catch (e) {
          if (e?.response?.status === 401) resp = await listPublicProducts(256);
          else throw e;
        }
      } else {
        resp = await listPublicProducts(256);
      }

      const arr = pickArray(resp?.data);
      setItems(arr);
    } catch (e) {
      console.error(e);
      setItems([]);
      const msg = e?.response?.data?.message || e?.message || "Failed to load products";
      toast.error(msg);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!q) return items;
    const s = q.toLowerCase();
    const safe = (v) => (v == null ? "" : String(v).toLowerCase());
    return items.filter(
      (x) => safe(x.name).includes(s) || safe(x.brand).includes(s) || safe(x.barcode).includes(s)
    );
  }, [items, q]);

  const onDelete = async (id) => {
    if (!user || user.role !== "Admin") return;
    if (!window.confirm("Delete this product?")) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success("Deleted");
      load();
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-2.5" size={18} />
          <input
            className="pl-10 pr-3 py-2 border rounded-xl w-72"
            placeholder="Search name, brand, barcode…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {user?.role === "Admin" && (
          <button
            onClick={() => { setEditing(null); setOpen(true); }}
            className="inline-flex items-center gap-2 bg-black text-white rounded-xl px-4 py-2"
          >
            <Plus size={18} /> Add Product
          </button>
        )}
      </div>

      <div className="bg-white border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 w-16">Image</th>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Brand</th>
              <th className="text-left p-3">Sizes</th>
              <th className="text-left p-3">Price</th>
              <th className="text-left p-3">Qty</th>
              <th className="text-left p-3">Barcode</th>
              <th className="text-left p-3">Reorder Thr.</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const qty = Number(p.quantity ?? 0);
              const threshold = Number(p.reorderThreshold ?? 3);
              const low = qty <= threshold;
              const imgSrc = p.image ? toAsset(p.image) : "";
              const price = Number(p.price ?? 0);
              const sizesDisp = Array.isArray(p.sizes) ? p.sizes.join(", ") : p.size || "—";

              return (
                <tr key={p._id || p.id || p.barcode || p.name} className="border-t">
                  <td className="p-3">
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={p.name || "Product"}
                        className="h-12 w-12 object-cover rounded-md border"
                        onError={(e) => {
                          e.currentTarget.src = "https://via.placeholder.com/48?text=%E2%80%94";
                        }}
                      />
                    ) : <span className="text-xs text-gray-400">—</span>}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span>{p.name || "—"}</span>
                      {(p.newArrival || p.topSeller || p.trending || p.seasonal) && (
                        <div className="flex gap-1">
                          {p.newArrival && <Badge>New</Badge>}
                          {p.topSeller && <Badge>Fav</Badge>}
                          {p.trending && <Badge>Trend</Badge>}
                          {p.seasonal && <Badge>Season</Badge>}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3">{p.brand || "—"}</td>
                  <td className="p-3">{sizesDisp}</td>
                  <td className="p-3">{price.toFixed(2)}</td>
                  <td className={`p-3 ${low ? "bg-red-50" : ""}`}>{qty}</td>
                  <td className="p-3">{p.barcode || "—"}</td>
                  <td className="p-3">{threshold}</td>
                  <td className="p-3 text-right space-x-2">
                    {user?.role === "Admin" ? (
                      <>
                        <button
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border hover:bg-gray-50"
                          onClick={() => { setEditing(p); setOpen(true); }}
                        >
                          <Pencil size={16} /> Edit
                        </button>
                        <button
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border text-red-600 hover:bg-red-50"
                          onClick={() => onDelete(p._id || p.id)}
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-gray-500">Read-only</span>
                    )}
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td className="p-6 text-center text-gray-500" colSpan={9}>
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && user?.role === "Admin" && (
        <ProductForm
          initial={editing}
          existing={items}
          onClose={() => setOpen(false)}
          onSaved={() => { setOpen(false); load(); }}
        />
      )}
    </div>
  );
}

function Badge({ children }) {
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 border">
      {children}
    </span>
  );
}
