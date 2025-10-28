import React, { useEffect, useMemo, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException, BarcodeFormat, DecodeHintType } from "@zxing/library";
import { Camera, RotateCcw, Upload, Zap, ZoomIn, X, Smartphone } from "lucide-react";

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
    <div className="fixed inset-0 z-50 bg-black/80 grid place-items-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <Camera className="text-blue-600" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Barcode Scanner</h3>
              <p className="text-sm text-gray-600">Scan a barcode or QR code</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scanner View */}
        <div className="p-4 md:p-6 space-y-4">
          <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />
            {/* Scanner frame overlay */}
            <div className="pointer-events-none absolute inset-0 border-2 border-white/30 m-8 md:m-12 rounded-lg" />
            <div className="absolute top-4 right-4">
              <div className="flex items-center gap-2 px-2 py-1 bg-black/50 rounded-full">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-white">Live</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Camera Selection */}
            {devices.length > 1 && (
              <div className="flex items-center gap-3">
                <Smartphone size={18} className="text-gray-500 flex-shrink-0" />
                <select
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={deviceId || ""}
                  onChange={(e) => onChangeCamera(e.target.value)}
                >
                  {devices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Camera ${d.deviceId.slice(0, 6)}…`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => startCamera(deviceId)}
                disabled={starting}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-medium"
              >
                <RotateCcw size={16} />
                {starting ? "Starting..." : "Restart Camera"}
              </button>

              <label className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-gray-700 font-medium">
                <Upload size={16} />
                Upload Photo
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onPickImage} />
              </label>

              {torchSupported && (
                <button 
                  type="button" 
                  onClick={toggleTorch}
                  className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors font-medium ${
                    torchOn 
                      ? 'bg-yellow-100 border-yellow-300 text-yellow-800' 
                      : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Zap size={16} />
                  {torchOn ? "Torch On" : "Torch Off"}
                </button>
              )}

              {zoomRange.max > 1 && (
                <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                  <ZoomIn size={16} className="text-gray-500" />
                  <input
                    type="range"
                    min={zoomRange.min}
                    max={zoomRange.max}
                    step={zoomRange.step}
                    value={zoom}
                    onChange={(e) => applyZoom(e.target.value)}
                    className="w-24"
                  />
                  <span className="text-sm text-gray-600 min-w-8">{zoom.toFixed(1)}x</span>
                </div>
              )}
            </div>

            {/* Error Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {/* Tips & Information */}
            <div className="space-y-2">
              {!secure && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="text-sm text-yellow-700">
                    <strong>Tip:</strong> Camera requires <b>HTTPS</b> or <b>http://localhost</b> to work properly.
                  </div>
                </div>
              )}
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm text-blue-700">
                  <strong>Scanning Tips:</strong> Fill 30–50% of view with the code, hold it horizontal (EAN/UPC), avoid glare, and try rotating if needed.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}