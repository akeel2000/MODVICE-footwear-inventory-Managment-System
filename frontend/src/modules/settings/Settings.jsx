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
import { Download, User, Shield, Database, FileText, Save, Calendar } from "lucide-react";

function PdfBtn({ label, action, disabled, icon }) {
  return (
    <button 
      type="button" 
      disabled={disabled} 
      onClick={action}
      className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-medium"
    >
      {icon}
      {label}
    </button>
  );
}

function SalesPdfButtons({ onExport, working }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center gap-2 flex-1">
        <Calendar size={16} className="text-gray-500 flex-shrink-0" />
        <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Date Range:</span>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 flex-1">
        <input 
          type="date" 
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          value={from} 
          onChange={(e) => setFrom(e.target.value)} 
        />
        <input 
          type="date" 
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          value={to} 
          onChange={(e) => setTo(e.target.value)} 
        />
      </div>
      <PdfBtn 
        label={working ? "Exporting..." : "Export Sales PDF"} 
        action={() => onExport({ from, to })} 
        disabled={working}
        icon={<FileText size={16} />}
      />
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
      toast.success("Backup downloaded successfully");
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
      toast.success("Products PDF exported successfully");
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
      toast.success("Users PDF exported successfully");
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
      toast.success("Sales PDF exported successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export Sales PDF");
    } finally {
      setPdfBusy(false);
    }
  };

  if (user?.role !== "Admin") {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <Shield size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600">Only administrators can access system settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">System Settings</h1>
          <p className="text-gray-600">Manage your account preferences and system configuration</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Profile Settings */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <User className="text-blue-600" size={24} />
              <h3 className="text-lg font-semibold text-gray-900">Profile Settings</h3>
            </div>
            
            <form onSubmit={save} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 mb-2 block">Full Name</span>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={f.fullName}
                    onChange={(e) => setF({ ...f, fullName: e.target.value })}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-gray-700 mb-2 block">New Password</span>
                  <input
                    type="password"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={f.password}
                    onChange={(e) => setF({ ...f, password: e.target.value })}
                    placeholder="Leave blank to keep current"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-medium text-gray-700 mb-2 block">Default Low-Stock Threshold</span>
                <input
                  type="number"
                  min="0"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={f.thresholdDefault}
                  onChange={(e) => setF({ ...f, thresholdDefault: Number(e.target.value) })}
                />
                <div className="text-sm text-gray-500 mt-2">
                  This becomes the default for new products. Existing items keep their own threshold unless edited.
                </div>
              </label>

              {isMock && (
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 mb-2 block">User Role (Demo Only)</span>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={f.role}
                    onChange={(e) => setF({ ...f, role: e.target.value })}
                  >
                    <option value="Admin">Administrator</option>
                    <option value="Staff">Staff Member</option>
                  </select>
                  <div className="text-sm text-gray-500 mt-2">
                    Switch role to preview Staff view — Add/Edit/Delete disabled, no Settings/Export/Acknowledge.
                  </div>
                </label>
              )}

              <div className="flex flex-wrap gap-3 pt-4">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <Save size={18} />
                  {saving ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>

          {/* Export Tools */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Database className="text-green-600" size={24} />
              <h3 className="text-lg font-semibold text-gray-900">Data Management</h3>
            </div>

            <div className="space-y-6">
              {/* Backup */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <Download size={20} className="text-gray-500" />
                  <div>
                    <div className="font-medium text-gray-900">System Backup</div>
                    <div className="text-sm text-gray-600">Download complete database backup as JSON</div>
                  </div>
                </div>
                <button
                  onClick={downloadBackup}
                  disabled={downloading}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-medium whitespace-nowrap"
                >
                  {downloading ? "Preparing Backup..." : "Download Backup"}
                </button>
              </div>

              {/* PDF Exports */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="text-purple-600" size={20} />
                  <h4 className="font-medium text-gray-900">PDF Reports</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <PdfBtn 
                    label={pdfBusy ? "Exporting..." : "Products Report"} 
                    action={exportProductsPDF} 
                    disabled={pdfBusy}
                    icon={<FileText size={16} />}
                  />
                  <PdfBtn 
                    label={pdfBusy ? "Exporting..." : "Users Report"} 
                    action={exportUsersPDF} 
                    disabled={pdfBusy}
                    icon={<FileText size={16} />}
                  />
                </div>

                <SalesPdfButtons onExport={exportSalesPDF} working={pdfBusy} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}