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
    toast.error("Try again: couldn't generate a unique barcode locally.");
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
      <div className="fixed inset-0 bg-black/50 grid place-items-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {initial ? "Edit Product" : "Add New Product"}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {initial ? "Update product details" : "Fill in the product information below"}
              </p>
            </div>
            <button 
              onClick={handleCloseForm}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="md:col-span-2">
                <h4 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">Basic Information</h4>
              </div>
              
              <Input label="Product Name" value={f.name} onChange={(v) => setF({ ...f, name: v })} required />
              <Input label="Brand" value={f.brand || ""} onChange={(v) => setF({ ...f, brand: v })} />
              <Input label="Color" value={f.color || ""} onChange={(v) => setF({ ...f, color: v })} />
              <Input label="Product Type" value={f.type || ""} onChange={(v) => setF({ ...f, type: v })} />
              <Input label="Material" value={f.material || ""} onChange={(v) => setF({ ...f, material: v })} />

              {/* Pricing & Inventory */}
              <div className="md:col-span-2 mt-4">
                <h4 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">Pricing & Inventory</h4>
              </div>

              <Input label="Price (Rs.)" type="number" step="0.01" value={f.price} onChange={(v) => setF({ ...f, price: v })} required />
              <Input label="Quantity" type="number" value={f.quantity} onChange={(v) => setF({ ...f, quantity: v })} required />
              <Input label="Reorder Threshold" type="number" value={f.reorderThreshold} onChange={(v) => setF({ ...f, reorderThreshold: v })} required />
              
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
                placeholder="e.g., 36,38,40,42"
              />

              {/* Image Upload */}
              <div className="md:col-span-2">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Product Image</span>
                  <div className="mt-2 flex flex-col sm:flex-row gap-6 items-start">
                    <div className="flex-shrink-0">
                      <div className="h-32 w-32 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden">
                        {preview ? (
                          <img
                            src={preview}
                            alt="Product preview"
                            className="h-full w-full object-cover"
                            onError={(e) => { 
                              e.currentTarget.src = "https://via.placeholder.com/128x128?text=No+Image"; 
                            }}
                          />
                        ) : (
                          <div className="text-center p-4">
                            <div className="text-gray-400 text-2xl mb-1">📷</div>
                            <div className="text-xs text-gray-500">No image</div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        onChange={(e) => setImgFile(e.target.files?.[0] || null)}
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Upload a product image. JPG, PNG, or WebP formats supported.
                      </p>
                    </div>
                  </div>
                </label>
              </div>

              {/* Barcode Section */}
              <div className="md:col-span-2">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Barcode</span>
                  <div className="mt-2 space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <BarcodeInput
                          inputRef={barcodeRef}
                          value={f.barcode}
                          onChange={(v) => setF({ ...f, barcode: v })}
                          onScanned={() => {}}
                          className="w-full"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button 
                          type="button" 
                          onClick={() => setScanOpen(true)}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 whitespace-nowrap"
                        >
                          <span>📷</span>
                          <span>Scan</span>
                        </button>
                        <button 
                          type="button" 
                          onClick={onGenerate}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                        >
                          Generate
                        </button>
                      </div>
                    </div>
                    {barcodeError && (
                      <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{barcodeError}</div>
                    )}
                    <p className="text-xs text-gray-500">
                      Use a barcode scanner, camera scanner, or generate a unique EAN-13 barcode automatically.
                    </p>
                  </div>
                </label>
              </div>

              {/* Product Features */}
              <div className="md:col-span-2">
                <h4 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">Product Features</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Toggle label="New Arrival" checked={!!f.newArrival} onChange={(v) => setF({ ...f, newArrival: v })} />
                  <Toggle label="Customer Favorite" checked={!!f.topSeller} onChange={(v) => setF({ ...f, topSeller: v })} />
                  <Toggle label="Trending Now" checked={!!f.trending} onChange={(v) => setF({ ...f, trending: v })} />
                  <Toggle label="Seasonal Pick" checked={!!f.seasonal} onChange={(v) => setF({ ...f, seasonal: v })} />
                </div>
              </div>
            </form>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button 
              type="button" 
              onClick={handleCloseForm}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={saving}
              onClick={submit}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                initial ? 'Update Product' : 'Add Product'
              )}
            </button>
          </div>
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

function Input({ label, type = "text", value, onChange, required, placeholder, inputRef }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      />
    </label>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
      <div className="relative">
        <input 
          type="checkbox" 
          checked={checked} 
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div className={`w-10 h-6 rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-300'
        }`}>
          <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? 'transform translate-x-4' : ''
          }`} />
        </div>
      </div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </label>
  );
}