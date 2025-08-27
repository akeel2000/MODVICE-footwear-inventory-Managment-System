// frontend/src/modules/sales/SalesPage.jsx
import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import SalesEntry from "./SalesEntry";
import SalesHistory from "./SalesHistory";

export default function SalesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "history" ? "history" : "entry";
  const [tab, setTab] = useState(initialTab);

  const switchTo = (next) => {
    setTab(next);
    const sp = new URLSearchParams(searchParams);
    if (next === "entry") sp.delete("tab");
    else sp.set("tab", "history");
    setSearchParams(sp, { replace: true });
  };

  const isEntry = useMemo(() => tab === "entry", [tab]);

  const baseBtn =
    "flex-1 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/40";
  const active = "bg-black text-white";
  const inactive = "hover:bg-gray-100";

  return (
    <div className="space-y-4">
      <div
        className="bg-white border rounded-2xl p-2 flex gap-2 w-full max-w-md"
        role="tablist"
        aria-label="Sales tabs"
      >
        <button
          role="tab"
          aria-selected={isEntry}
          aria-controls="sales-entry-panel"
          onClick={() => switchTo("entry")}
          className={`${baseBtn} ${isEntry ? active : inactive}`}
        >
          Sales Entry
        </button>
        <button
          role="tab"
          aria-selected={!isEntry}
          aria-controls="sales-history-panel"
          onClick={() => switchTo("history")}
          className={`${baseBtn} ${!isEntry ? active : inactive}`}
        >
          Sales History
        </button>
      </div>

      <div
        id={isEntry ? "sales-entry-panel" : "sales-history-panel"}
        role="tabpanel"
        className="outline-none"
      >
        {isEntry ? <SalesEntry /> : <SalesHistory />}
      </div>
    </div>
  );
}
