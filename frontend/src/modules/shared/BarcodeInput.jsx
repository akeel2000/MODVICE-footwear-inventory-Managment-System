import React, { useRef } from "react";
import useHardwareScanner from "./useHardwareScanner";
import { Barcode, Camera } from "lucide-react";

export default function BarcodeInput({
  value,
  onChange,
  onScanned,
  placeholder = "Scan or type barcode...",
  className = "",
  autoFocus = true,
  inputRef,
  onCameraClick,
  showCameraButton = false,
}) {
  const fallbackRef = useRef(null);
  const ref = inputRef || fallbackRef;

  useHardwareScanner({
    onScan: (code) => {
      const clean = String(code || "").trim();
      if (!clean) return;
      onChange?.(clean);
      ref.current?.focus();
      ref.current?.select?.();
      onScanned?.(clean);
    },
  });

  const onKeyDown = (e) => {
    if (e.key === "Enter") e.preventDefault();
  };

  return (
    <div className="relative">
      {/* Input with icon */}
      <div className="relative">
        <Barcode 
          size={18} 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" 
        />
        
        <input
          ref={ref}
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={`w-full border border-gray-300 rounded-lg pl-10 pr-12 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400 ${className}`}
          autoFocus={autoFocus}
        />

        {/* Camera button */}
        {showCameraButton && (
          <button
            type="button"
            onClick={onCameraClick}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            title="Open camera scanner"
          >
            <Camera size={16} />
          </button>
        )}
      </div>

      {/* Helper text */}
      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span>Ready for barcode scanner input</span>
      </div>
    </div>
  );
}