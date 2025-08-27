import { useEffect, useRef } from "react";

/** Detect fast HID scanner input and emit code on Enter */
export default function useHardwareScanner({
  onScan,
  minLength = 6,
  maxInterKeyDelay = 35,
  terminatorKeys = ["Enter", "NumpadEnter"],
} = {}) {
  const bufRef = useRef([]);
  const lastTsRef = useRef(0);

  useEffect(() => {
    function onKeyDown(e) {
      const now = Date.now();
      const dt = now - (lastTsRef.current || now);
      lastTsRef.current = now;

      if (terminatorKeys.includes(e.key)) {
        const code = bufRef.current.join("");
        const fast = bufRef.current.length > 0 && dt <= maxInterKeyDelay * 2;
        if (code.length >= minLength && fast) {
          e.preventDefault();
          onScan?.(code);
        }
        bufRef.current = [];
        return;
      }

      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.key.length !== 1) return;

      if (dt > maxInterKeyDelay) bufRef.current = [];
      bufRef.current.push(e.key);
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onScan, minLength, maxInterKeyDelay, terminatorKeys]);
}
