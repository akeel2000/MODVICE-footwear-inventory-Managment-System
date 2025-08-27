import React, { useEffect, useMemo, useRef, useState } from "react";
import api, { uploadImage, assetUrl } from "../../services/api";
import toast from "react-hot-toast";
import BarcodeScanner from "../shared/BarcodeScanner";
import BarcodeInput from "../shared/BarcodeInput";

const toAsset = (u) => assetUrl(u);

const hasTag = (p, ...tags) => {
  const bag = new Set(
    [
      ...(p?.tags || []),
      ...(p?.collections || []),
      p?.category,
      p?.collection,
      p?.section,
    ]
      .filter(Boolean)
      .map((s) => String(s).toLowerCase())
  );
  return tags.some((t) => bag.has(String(t).toLowerCase()));
};

// EAN-13 helpers
function ean13Checksum(d12) {
  const nums = d12.split("").map((c) => parseInt(c, 10));
  const sum = nums.reduce((acc, n, i) => acc + n * (i % 2 === 0 ? 1 : 3), 0);
  const mod = sum % 10;
  return (10 - mod) % 10;
}
function generateEAN13() {
  const d12 = String(Math.floor(1e11 + Math.random() * 9e11)); // 12 digits
  return d12 + ean13Checksum(d12);
}

export default function ProductForm({ initial, existing = [], onClose, onSaved }) {
  const seedSizes =
    Array.isArray(initial?.sizes)
      ? initial.sizes
      : (initial?.sizes || initial?.size || "")
          .toString()
          .split(",")
          .map((s) => parseInt(String(s).trim(), 10))
          .filter((n) => !Number.isNaN(n));

  const [f, setF] = useState(() => ({
    name: "",
    brand: "",
    color: "",
    type: "",
    material: "",
    sizes: seedSizes,
    price: "",
    quantity: "",
    barcode: "",
    reorderThreshold: 3,
    image: "",
    newArrival: !!(initial?.newArrival || initial?.new || initial?.isNew || hasTag(initial || {}, "new-arrival", "new")),
    topSeller: !!(initial?.topSeller || initial?.bestSeller || initial?.bestseller || initial?.top || hasTag(initial || {}, "bestseller", "best-seller", "customer favorite", "top")),
    trending: !!(initial?.trending || initial?.isTrending || hasTag(initial || {}, "trending", "hot")),
    seasonal: !!(initial?.seasonal || initial?.isSeasonal || hasTag(initial || {}, "seasonal")),
    ...(initial || {}),
  }));

  const [saving, setSaving] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [imgFile, setImgFile] = useState(null);
  const barcodeRef = useRef(null);

  useEffect(() => { barcodeRef.current?.focus(); }, []);

  const [sizesCsv, setSizesCsv] = useState(
    (Array.isArray(f.sizes) && f.sizes.length ? f.sizes : []).join(",")
  );

  const preview = useMemo(
    () => (imgFile ? URL.createObjectURL(imgFile) : toAsset(f.image)),
    [imgFile, f.image]
  );
  useEffect(() => () => { if (imgFile) URL.revokeObjectURL(preview); }, [imgFile, preview]);

  const barcodeError = useMemo(() => {
    const val = (f.barcode || "").trim().toLowerCase();
    if (!val) return null;
    const conflict = existing.some(
      (p) => p._id !== initial?._id && (p.barcode || "").toLowerCase() === val
    );
    return conflict ? "Barcode already exists" : null;
  }, [f.barcode, existing, initial]);

  const handleCloseForm = () => { setScanOpen(false); onClose?.(); };

  const onGenerate = () => {
    for (let i = 0; i < 5; i++) {
      const candidate = generateEAN13();
      const clash = existing.some(
        (p) => p._id !== initial?._id && String(p.barcode || "").trim() === candidate
      );
      if (!clash) {
        setF((x) => ({ ...x, barcode: candidate }));
        requestAnimationFrame(() => barcodeRef.current?.select?.());
        return;
      }
    }
    toast.error("Try again: couldn’t generate a unique barcode locally.");
  };

  const submit = async (e) => {
    e.preventDefault();
    if (barcodeError) return toast.error(barcodeError);

    const normalizedSizes = sizesCsv
      .split(",")
      .map((s) => parseInt(String(s).trim(), 10))
      .filter((n) => !Number.isNaN(n));

    setSaving(true);
    try {
      const payload = {
        ...f,
        price: Number(f.price || 0),
        quantity: Number(f.quantity || 0),
        reorderThreshold: Number(f.reorderThreshold || 0),
        size: normalizedSizes.join(","),
        sizes: normalizedSizes,
      };

      if (imgFile) {
        const { data } = await uploadImage(imgFile); // { url: "/uploads/xxx.jpg" }
        payload.image = data.url;
      }

      const tagSet = new Set([...(payload.tags || [])]);
      if (payload.newArrival) tagSet.add("new-arrival");
      if (payload.topSeller) tagSet.add("bestseller");
      if (payload.trending) tagSet.add("trending");
      if (payload.seasonal) tagSet.add("seasonal");
      payload.tags = Array.from(tagSet);

      if (initial?._id) await api.put(`/products/${initial._id}`, payload);
      else await api.post(`/products`, payload);

      toast.success(initial ? "Updated" : "Added");
      onSaved?.();
    } catch (e2) {
      const msg = e2?.response?.data?.message || "";
      if (/duplicate key/i.test(msg) || /barcode.*exists/i.test(msg)) {
        toast.error("Barcode already exists. Pick another / re-generate.");
      } else {
        console.error(e2);
        toast.error("Save failed");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50">
        <div className="bg-white rounded-2xl w-full max-w-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{initial ? "Edit Product" : "Add Product"}</h3>
            <button onClick={handleCloseForm} className="text-gray-500 hover:text-black">✕</button>
          </div>

          <form onSubmit={submit} className="grid grid-cols-2 gap-4">
            <Input label="Name" value={f.name} onChange={(v) => setF({ ...f, name: v })} required />
            <Input label="Brand" value={f.brand || ""} onChange={(v) => setF({ ...f, brand: v })} />
            <Input label="Color" value={f.color || ""} onChange={(v) => setF({ ...f, color: v })} />
            <Input label="Type" value={f.type || ""} onChange={(v) => setF({ ...f, type: v })} />
            <Input label="Material" value={f.material || ""} onChange={(v) => setF({ ...f, material: v })} />

            <Input
              label="Sizes (comma separated)"
              value={sizesCsv}
              onChange={(v) => {
                setSizesCsv(v);
                const arr = v
                  .split(",")
                  .map((s) => parseInt(String(s).trim(), 10))
                  .filter((n) => !Number.isNaN(n));
                setF({ ...f, sizes: arr, size: arr.join(",") });
              }}
            />

            <Input label="Price" type="number" value={f.price} onChange={(v) => setF({ ...f, price: v })} required />
            <Input label="Quantity" type="number" value={f.quantity} onChange={(v) => setF({ ...f, quantity: v })} required />

            {/* Image */}
            <label className="block col-span-2">
              <span className="text-sm text-gray-600">Product image</span>
              <input
                type="file" accept="image/*"
                className="mt-1 w-full border rounded-xl px-3 py-2"
                onChange={(e) => setImgFile(e.target.files?.[0] || null)}
              />
              {preview && (
                <img
                  src={preview} alt="preview"
                  className="mt-2 h-28 w-28 object-cover rounded-lg border"
                  onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/112x112?text=No+Image"; }}
                />
              )}
            </label>

            {/* Barcode */}
            <label className="block col-span-2">
              <span className="text-sm text-gray-600">Barcode</span>
              <div className="flex gap-2 items-start">
                <div className="flex-1">
                  <BarcodeInput
                    inputRef={barcodeRef}
                    value={f.barcode}
                    onChange={(v) => setF({ ...f, barcode: v })}
                    onScanned={() => {}}
                  />
                  <span className="text-xs text-gray-500">
                    Phone (Bluetooth HID) / USB scanner works. Or camera → 📷. Click Generate to auto-create EAN-13.
                  </span>
                  {barcodeError && <div className="text-xs text-red-600 mt-1">{barcodeError}</div>}
                </div>
                <button type="button" onClick={() => setScanOpen(true)} className="mt-1 px-3 rounded-xl border hover:bg-gray-50">📷</button>
                <button type="button" onClick={onGenerate} className="mt-1 px-3 rounded-xl border hover:bg-gray-50">Generate</button>
              </div>
            </label>

            <Input
              label="Reorder Threshold" type="number"
              value={f.reorderThreshold}
              onChange={(v) => setF({ ...f, reorderThreshold: v })}
              required
            />

            <div className="col-span-2 grid grid-cols-2 gap-2">
              <Toggle label="Show in New Arrivals"      checked={!!f.newArrival} onChange={(v) => setF({ ...f, newArrival: v })} />
              <Toggle label="Show in Customer Favorites" checked={!!f.topSeller}   onChange={(v) => setF({ ...f, topSeller: v })} />
              <Toggle label="Show in Trending Now"       checked={!!f.trending}    onChange={(v) => setF({ ...f, trending: v })} />
              <Toggle label="Show in Seasonal Picks"     checked={!!f.seasonal}    onChange={(v) => setF({ ...f, seasonal: v })} />
            </div>

            <div className="col-span-2 flex justify-end gap-2 pt-2">
              <button type="button" onClick={handleCloseForm} className="px-4 py-2 rounded-xl border">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-black text-white">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {scanOpen && (
        <BarcodeScanner
          onlyQr={false}
          onDetected={(code) => setF((x) => ({ ...x, barcode: String(code || "").trim() }))}
          onClose={() => setScanOpen(false)}
        />
      )}
    </>
  );
}

function Input({ label, type = "text", value, onChange, required, inputRef }) {
  return (
    <label className="block">
      <span className="text-sm text-gray-600">{label}</span>
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="mt-1 w-full border rounded-xl px-3 py-2"
      />
    </label>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 border rounded-xl px-3 py-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="text-sm">{label}</span>
    </label>
  );
}
