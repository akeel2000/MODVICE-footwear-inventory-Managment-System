import React, { useEffect, useMemo, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException, BarcodeFormat, DecodeHintType } from "@zxing/library";

export default function BarcodeScanner({ onDetected, onClose, onlyQr = false }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const streamRef = useRef(null);
  const activeTrackRef = useRef(null);
  const scannedOnceRef = useRef(false);

  const [error, setError] = useState("");
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [starting, setStarting] = useState(false);

  const [zoomRange, setZoomRange] = useState({ min: 1, max: 1, step: 0.1 });
  const [zoom, setZoom] = useState(1);

  const secure = useMemo(() => {
    const host = window.location.hostname || "";
    return window.isSecureContext || host === "localhost" || host.startsWith("127.");
  }, []);

  const hints = useMemo(() => {
    const formats = onlyQr
      ? [BarcodeFormat.QR_CODE]
      : [
          BarcodeFormat.QR_CODE,
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_128,
          BarcodeFormat.CODE_39,
          BarcodeFormat.CODE_93,
          BarcodeFormat.ITF,
          BarcodeFormat.PDF_417,
        ];
    const m = new Map();
    m.set(DecodeHintType.POSSIBLE_FORMATS, formats);
    m.set(DecodeHintType.TRY_HARDER, true);
    m.set(DecodeHintType.ALSO_INVERTED, true);
    return m;
  }, [onlyQr]);

  async function stopEverything() {
    try { readerRef.current?.reset(); } catch {}
    try {
      const stream = videoRef.current?.srcObject || streamRef.current;
      stream?.getTracks?.().forEach((t) => t.stop());
    } catch {}
    activeTrackRef.current = null;
    streamRef.current = null;
  }

  async function afterStartApplyCapabilities(track) {
    if (!track) return;
    activeTrackRef.current = track;
    try {
      const caps = track.getCapabilities?.() || {};
      const hasTorch = !!caps.torch;
      setTorchSupported(hasTorch);

      if (hasTorch && torchOn) {
        await track.applyConstraints({ advanced: [{ torch: true }] });
      }

      if (caps.focusMode && Array.isArray(caps.focusMode) && caps.focusMode.includes("continuous")) {
        await track.applyConstraints({ advanced: [{ focusMode: "continuous" }] });
      }

      if (typeof caps.zoom === "number" || caps.zoom) {
        const zr = {
          min: caps.zoom?.min ?? 1,
          max: caps.zoom?.max ?? 1,
          step: caps.zoom?.step ?? 0.1,
        };
        setZoomRange(zr);
        setZoom(Math.min(Math.max(1, zr.min), zr.max));
      } else {
        setZoomRange({ min: 1, max: 1, step: 0.1 });
        setZoom(1);
      }
    } catch {}
  }

  const applyZoom = async (z) => {
    const track = activeTrackRef.current;
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ zoom: Number(z) }] });
      setZoom(Number(z));
    } catch {}
  };

  async function pickPreferredCamera(explicitId = null) {
    try { await navigator.mediaDevices.getUserMedia({ video: true, audio: false }); } catch {}
    let cams = await BrowserMultiFormatReader.listVideoInputDevices();
    cams = Array.isArray(cams) ? cams : [];
    setDevices(cams);
    if (explicitId) return explicitId;

    const prefer =
      cams.find((d) => /camo|iphone/i.test(d.label || "")) ||
      cams.find((d) => /rear|back|environment/i.test(d.label || "")) ||
      cams[0];

    return prefer?.deviceId || null;
  }

  async function startCamera(selectedId = null) {
    if (!secure) {
      setError("Camera requires HTTPS or http://localhost.");
      return;
    }
    setStarting(true);
    setError("");
    await stopEverything();

    const reader = new BrowserMultiFormatReader(hints, 200);
    readerRef.current = reader;

    const chosenId = await pickPreferredCamera(selectedId || deviceId);
    if (chosenId) setDeviceId(chosenId);

    const constraints = {
      video: {
        deviceId: chosenId ? { exact: chosenId } : undefined,
        facingMode: chosenId ? undefined : { ideal: "environment" },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30, max: 60 },
      },
      audio: false,
    };

    try {
      await reader.decodeFromConstraints(constraints, videoRef.current, async (result, err) => {
        if (result && !scannedOnceRef.current) {
          scannedOnceRef.current = true;
          const text = result.getText();
          try { await stopEverything(); } finally {
            onDetected?.(text);
            onClose?.();
          }
          return;
        }
        if (err && !(err instanceof NotFoundException)) {
          // ignore non-NotFound errors during scanning loop
        }
      });

      const stream = videoRef.current?.srcObject;
      streamRef.current = stream;
      const track = stream?.getVideoTracks?.()[0]; // ✅ FIXED
      await afterStartApplyCapabilities(track);
      await pickPreferredCamera(chosenId);
    } catch (e) {
      console.error(e);
      setError(
        e?.name === "NotAllowedError"
          ? "Camera permission denied. Allow camera in browser settings."
          : "Unable to start camera on this device."
      );
      await stopEverything();
    } finally {
      setStarting(false);
    }
  }

  useEffect(() => {
    scannedOnceRef.current = false;
    startCamera(null);
    return () => { stopEverything(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyQr]);

  const onChangeCamera = async (id) => {
    setDeviceId(id);
    scannedOnceRef.current = false;
    await startCamera(id);
  };

  const toggleTorch = async () => {
    try {
      const track = activeTrackRef.current;
      if (!track) return;
      const next = !torchOn;
      await track.applyConstraints({ advanced: [{ torch: next }] });
      setTorchOn(next);
    } catch {
      setError("Torch not available on this camera.");
    }
  };

  const onPickImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    try {
      const localReader = new BrowserMultiFormatReader(hints, 300);
      const res = await localReader.decodeFromImageUrl(url);
      await stopEverything();
      onDetected?.(res.getText());
      onClose?.();
    } catch (err) {
      console.error(err);
      setError("Couldn't detect a code in the photo.");
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const handleClose = async () => {
    await stopEverything();
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 grid place-items-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">Scan Barcode / QR</h3>
          <button onClick={handleClose} className="text-gray-500 hover:text-black">✕</button>
        </div>

        <div className="p-4 space-y-3">
          <div className="relative rounded-lg overflow-hidden bg-black">
            <video ref={videoRef} autoPlay playsInline muted className="w-full max-h-[60vh] object-contain" />
            <div className="pointer-events-none absolute inset-0 border-2 border-white/40 m-10 rounded-xl" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {devices.length > 1 && (
              <>
                <label className="text-sm text-gray-600">Camera:</label>
                <select
                  className="border rounded-lg px-2 py-1"
                  value={deviceId || ""}
                  onChange={(e) => onChangeCamera(e.target.value)}
                >
                  {devices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Camera ${d.deviceId.slice(0, 6)}…`}
                    </option>
                  ))}
                </select>
              </>
            )}

            <button
              type="button"
              onClick={() => startCamera(deviceId)}
              className="px-3 py-1 rounded-lg border"
              disabled={starting}
              title="If iOS/Chrome blocked auto-start, tap here to start."
            >
              {starting ? "Starting…" : "Restart"}
            </button>

            <label className="ml-auto inline-flex items-center gap-2 px-3 py-1 rounded-lg border hover:bg-gray-50 cursor-pointer">
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onPickImage} />
              Upload photo
            </label>

            {torchSupported && (
              <button type="button" onClick={toggleTorch} className="px-3 py-1 rounded-lg border">
                {torchOn ? "Torch: ON" : "Torch: OFF"}
              </button>
            )}

            {zoomRange.max > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">Zoom</span>
                <input
                  type="range"
                  min={zoomRange.min}
                  max={zoomRange.max}
                  step={zoomRange.step}
                  value={zoom}
                  onChange={(e) => applyZoom(e.target.value)}
                />
              </div>
            )}
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
          {!secure && <div className="text-xs text-gray-600">Tip: camera needs <b>HTTPS</b> or <b>http://localhost</b>.</div>}
          <div className="text-xs text-gray-500">
            Tips: Fill 30–50% of view with the code, hold it horizontal (EAN/UPC), avoid glare, and try rotating the phone.
          </div>
        </div>
      </div>
    </div>
  );
}
