import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../auth/AuthContext";
import {
  updateProfile,
  updateThreshold,
  getThresholdDefault,
  getBackup,
  listProducts,
  listUsers,
  listSales,
} from "../../services/api";

function PdfBtn({ label, action, disabled }) {
  return (
    <button type="button" disabled={disabled} onClick={action} className="px-4 py-2 rounded-xl border">
      {label}
    </button>
  );
}

function SalesPdfButtons({ onExport, working }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input type="date" className="border rounded-xl px-3 py-2" value={from} onChange={(e) => setFrom(e.target.value)} />
      <input type="date" className="border rounded-xl px-3 py-2" value={to} onChange={(e) => setTo(e.target.value)} />
      <PdfBtn label={working ? "Exporting…" : "Sales (PDF)"} disabled={working} action={() => onExport({ from, to })} />
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const [f, setF] = useState({
    fullName: user?.fullName || "",
    password: "",
    thresholdDefault: 5,
    role: user?.role || "Admin",
  });
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  const isMock =
    (import.meta?.env?.VITE_MOCK_API === "true") ||
    (typeof process !== "undefined" && process.env?.REACT_APP_MOCK_API === "true");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getThresholdDefault();
        if (data?.defaultThreshold != null) {
          setF((x) => ({ ...x, thresholdDefault: Number(data.defaultThreshold) }));
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (user) {
      setF((p) => ({ ...p, fullName: user.fullName || "", role: user.role || "Admin" }));
    }
  }, [user]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ fullName: f.fullName, password: f.password || undefined });
      await updateThreshold(f.thresholdDefault);

      if (isMock) {
        const u = JSON.parse(localStorage.getItem("user") || "{}");
        u.fullName = f.fullName || u.fullName;
        u.role = f.role || u.role;
        localStorage.setItem("user", JSON.stringify(u));
        toast.success("Settings saved (mock)");
        toast("Role changed to " + u.role);
        setTimeout(() => window.location.reload(), 500);
      } else {
        toast.success("Settings saved");
      }
      setF((x) => ({ ...x, password: "" }));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const downloadBackup = async () => {
    setDownloading(true);
    try {
      const { data } = await getBackup();
      const text = JSON.stringify(data, null, 2);
      const blob = new Blob([text], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      const a = document.createElement("a");
      a.href = url;
      a.download = `modvice-backup-${ts}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Backup downloaded");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Backup failed");
    } finally {
      setDownloading(false);
    }
  };

  const loadJsPDF = async () => {
    const [{ default: jsPDF }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    return jsPDF;
  };

  const fetchAllProducts = async () => {
    let page = 1;
    const limit = 500;
    let out = [];
    for (;;) {
      const { data } = await listProducts({ page, limit, sort: "name" });
      const items = Array.isArray(data) ? data : data?.items || [];
      out = out.concat(items);
      if (items.length < limit) break;
      page += 1;
    }
    return out;
  };

  const exportProductsPDF = async () => {
    setPdfBusy(true);
    try {
      const jsPDF = await loadJsPDF();
      const rows = await fetchAllProducts();

      const doc = new jsPDF({ orientation: "landscape", unit: "pt" });
      doc.setFontSize(14);
      doc.text("Products Report", 40, 32);

      const body = rows.map((p) => [
        p.name || "",
        p.brand || "",
        p.barcode || "",
        Number(p.price || 0).toFixed(2),
        Number(p.quantity || 0),
        Number(p.reorderThreshold ?? 0),
      ]);

      // eslint-disable-next-line no-undef
      doc.autoTable({
        startY: 48,
        head: [["Name", "Brand", "Barcode", "Price", "Qty", "Reorder"]],
        body,
        styles: { fontSize: 10, cellPadding: 4 },
        headStyles: { fontStyle: "bold" },
        margin: { left: 40, right: 40 },
      });

      const ts = new Date().toISOString().slice(0, 10);
      doc.save(`products-${ts}.pdf`);
      toast.success("Products PDF exported");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export Products PDF");
    } finally {
      setPdfBusy(false);
    }
  };

  const exportUsersPDF = async () => {
    setPdfBusy(true);
    try {
      const jsPDF = await loadJsPDF();
      const { data } = await listUsers();
      const users = Array.isArray(data) ? data : [];

      const doc = new jsPDF({ unit: "pt" });
      doc.setFontSize(14);
      doc.text("Users Report", 40, 32);

      const body = users.map((u) => [u.fullName || "", u.email || "", u.role || ""]);

      // eslint-disable-next-line no-undef
      doc.autoTable({
        startY: 48,
        head: [["Name", "Email", "Role"]],
        body,
        styles: { fontSize: 10, cellPadding: 4 },
        headStyles: { fontStyle: "bold" },
        margin: { left: 40, right: 40 },
      });

      const ts = new Date().toISOString().slice(0, 10);
      doc.save(`users-${ts}.pdf`);
      toast.success("Users PDF exported");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export Users PDF");
    } finally {
      setPdfBusy(false);
    }
  };

  const exportSalesPDF = async ({ from, to }) => {
    setPdfBusy(true);
    try {
      const jsPDF = await loadJsPDF();
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;

      const { data } = await listSales(params);
      const rows = Array.isArray(data) ? data : [];

      const doc = new jsPDF({ orientation: "landscape", unit: "pt" });
      doc.setFontSize(14);
      const rangeLabel = from || to ? ` (${from || "…"} → ${to || "…"})` : "";
      doc.text(`Sales Report${rangeLabel}`, 40, 32);

      const body = rows.map((r) => [
        r.date || "",
        r.product || "",
        r.brand || "",
        r.type || "",
        Number(r.qty || 0),
        Number(r.unitPrice || 0).toFixed(2),
        Number(r.amount || 0).toFixed(2),
        r.barcode || "",
      ]);

      // eslint-disable-next-line no-undef
      doc.autoTable({
        startY: 48,
        head: [["Date", "Product", "Brand", "Type", "Qty", "Unit Price", "Amount", "Barcode"]],
        body,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fontStyle: "bold" },
        margin: { left: 40, right: 40 },
      });

      const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 10);
      doc.save(`sales-${ts}.pdf`);
      toast.success("Sales PDF exported");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export Sales PDF");
    } finally {
      setPdfBusy(false);
    }
  };

  if (user?.role !== "Admin") {
    return <div className="text-sm text-gray-600">Only Admin can access Settings.</div>;
  }

  return (
    <div className="bg-white border rounded-2xl p-6 max-w-3xl space-y-4">
      <h3 className="text-lg font-semibold">Settings (Admin)</h3>

      <form onSubmit={save} className="space-y-4">
        <label className="block">
          <span className="text-sm text-gray-600">Full Name</span>
          <input
            className="mt-1 w-full border rounded-xl px-3 py-2"
            value={f.fullName}
            onChange={(e) => setF({ ...f, fullName: e.target.value })}
          />
        </label>

        <label className="block">
          <span className="text-sm text-gray-600">New Password</span>
          <input
            type="password"
            className="mt-1 w-full border rounded-xl px-3 py-2"
            value={f.password}
            onChange={(e) => setF({ ...f, password: e.target.value })}
            placeholder="(leave blank to keep current)"
          />
        </label>

        <label className="block">
          <span className="text-sm text-gray-600">Default Low-Stock Threshold</span>
          <input
            type="number"
            min="0"
            className="mt-1 w-full border rounded-xl px-3 py-2"
            value={f.thresholdDefault}
            onChange={(e) => setF({ ...f, thresholdDefault: Number(e.target.value) })}
          />
          <div className="text-xs text-gray-500 mt-1">
            This becomes the default for new products. Existing items keep their own threshold unless edited.
          </div>
        </label>

        {isMock && (
          <label className="block">
            <span className="text-sm text-gray-600">User Role (Demo)</span>
            <select
              className="mt-1 w-full border rounded-xl px-3 py-2"
              value={f.role}
              onChange={(e) => setF({ ...f, role: e.target.value })}
            >
              <option value="Admin">Admin</option>
              <option value="Staff">Staff</option>
            </select>
            <div className="text-xs text-gray-500 mt-1">
              (Mock only) Switch role to preview Staff view — Add/Edit/Delete disabled, no Settings/Export/Acknowledge.
            </div>
          </label>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-black text-white">
            {saving ? "Saving..." : "Save Changes"}
          </button>

          <button
            type="button"
            onClick={downloadBackup}
            disabled={downloading}
            className="px-4 py-2 rounded-xl border"
            title="Download JSON backup (all collections)"
          >
            {downloading ? "Preparing…" : "Download Backup (.json)"}
          </button>

          <PdfBtn label={pdfBusy ? "Exporting…" : "Products (PDF)"} action={exportProductsPDF} disabled={pdfBusy} />
          <PdfBtn label={pdfBusy ? "Exporting…" : "Users (PDF)"} action={exportUsersPDF} disabled={pdfBusy} />

          <SalesPdfButtons onExport={exportSalesPDF} working={pdfBusy} />
        </div>
      </form>
    </div>
  );
}
