import React, { useRef } from "react";
import useHardwareScanner from "./useHardwareScanner";

export default function BarcodeInput({
  value,
  onChange,
  onScanned,
  placeholder = "Scan or type barcode…",
  className = "",
  autoFocus = true,
  inputRef,
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
    <input
      ref={ref}
      value={value || ""}
      onChange={(e) => onChange?.(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className={`mt-1 w-full border rounded-xl px-3 py-2 ${className}`}
      autoFocus={autoFocus}
    />
  );
}
