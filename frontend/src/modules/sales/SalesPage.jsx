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

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header Section */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Sales Management</h1>
        <p className="text-gray-600 max-w-2xl">
          {isEntry 
            ? "Record new sales, returns, and restocks with barcode scanning support" 
            : "View transaction history, filter records, and manage sales data"
          }
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 max-w-md mb-6 md:mb-8">
        <div className="flex gap-1" role="tablist" aria-label="Sales tabs">
          <button
            role="tab"
            aria-selected={isEntry}
            aria-controls="sales-entry-panel"
            onClick={() => switchTo("entry")}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              isEntry 
                ? "bg-blue-600 text-white shadow-sm" 
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            Sales Entry
          </button>
          <button
            role="tab"
            aria-selected={!isEntry}
            aria-controls="sales-history-panel"
            onClick={() => switchTo("history")}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              !isEntry 
                ? "bg-blue-600 text-white shadow-sm" 
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            Sales History
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div
        id={isEntry ? "sales-entry-panel" : "sales-history-panel"}
        role="tabpanel"
        className="outline-none transition-opacity duration-200"
        tabIndex={0}
      >
        {isEntry ? <SalesEntry /> : <SalesHistory />}
      </div>

      {/* Quick Stats Bar */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Sale Transactions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>Return Transactions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Restock Transactions</span>
          </div>
        </div>
      </div>
    </div>
  );
}