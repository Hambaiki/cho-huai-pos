"use client";

import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/form";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils/cn";
import {
  BinaryBitmap,
  HTMLCanvasElementLuminanceSource,
  HybridBinarizer,
  MultiFormatReader,
  NotFoundException,
} from "@zxing/library";
import { Camera, CameraOff, Minus, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface BarcodeCameraScannerProps {
  onBarcode: (barcode: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function BarcodeCameraScanner({
  onBarcode,
  onClose,
  isOpen,
}: BarcodeCameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [error, setError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [detectedBarcode, setDetectedBarcode] = useState<string | null>(null);
  const [zoomSupported, setZoomSupported] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomMin, setZoomMin] = useState(1);
  const [zoomMax, setZoomMax] = useState(1);

  const streamRef = useRef<MediaStream | null>(null);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);
  const zoomRangeRef = useRef({ min: 1, max: 1, step: 0.1 });
  const readerRef = useRef(new MultiFormatReader());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scanningRef = useRef(false);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const detectedBarcodeRef = useRef<string | null>(null);
  const detectionPausedRef = useRef(false);
  const ignoredBarcodeRef = useRef<string | null>(null);
  const ignoreCooldownRef = useRef<NodeJS.Timeout | null>(null);
  const scanSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCameraActive(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || scanSoundRef.current) return;

    const scanSound = new Audio("/audio/store-scanner-beep.mp3");
    scanSound.preload = "auto";
    scanSound.volume = 1;
    scanSoundRef.current = scanSound;
  }, [isOpen]);

  const playDetectedSound = () => {
    try {
      if (!scanSoundRef.current) {
        const scanSound = new Audio("/audio/store-scanner-beep.mp3");
        scanSound.preload = "auto";
        scanSound.volume = 1;
        scanSoundRef.current = scanSound;
      }

      const scanSound = scanSoundRef.current;
      scanSound.currentTime = 0;
      void scanSound.play();
    } catch {
      // Ignore audio playback errors (autoplay policy, unsupported browser)
    }
  };

  useEffect(() => {
    if (!isOpen || !cameraActive) return;

    const initCamera = async () => {
      try {
        setError(null);
        const videoElement = videoRef.current;
        if (!videoElement) return;

        // iOS Safari requires HTTPS or localhost
        const isSecureContext =
          window.location.protocol === "https:" ||
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1";

        if (!isSecureContext) {
          setError(
            "Camera access requires HTTPS connection (or localhost for development). Please use manual barcode entry.",
          );
          setCameraActive(false);
          return;
        }

        // Check if getUserMedia is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError(
            "Camera access is not supported on this device. Please use manual barcode entry.",
          );
          setCameraActive(false);
          return;
        }

        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" }, // Use back camera on mobile
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        streamRef.current = stream;
        videoTrackRef.current = stream.getVideoTracks()[0] ?? null;

        if (videoTrackRef.current) {
          const track = videoTrackRef.current;
          const capabilities =
            track.getCapabilities() as MediaTrackCapabilities & {
              focusMode?: string[];
              zoom?: { min: number; max: number; step?: number };
            };

          if (Array.isArray(capabilities.focusMode)) {
            if (capabilities.focusMode.includes("continuous")) {
              await track.applyConstraints({
                advanced: [{ focusMode: "continuous" }],
              } as unknown as MediaTrackConstraints);
            } else if (capabilities.focusMode.includes("single-shot")) {
              await track.applyConstraints({
                advanced: [{ focusMode: "single-shot" }],
              } as unknown as MediaTrackConstraints);
            }
          }

          if (capabilities.zoom) {
            const min = capabilities.zoom.min;
            const max = capabilities.zoom.max;
            const step = capabilities.zoom.step ?? 0.1;
            zoomRangeRef.current = { min, max, step };
            setZoomMin(min);
            setZoomMax(max);
            setZoomSupported(max > min);

            const currentZoom =
              (track.getSettings() as MediaTrackSettings & { zoom?: number })
                .zoom ?? min;
            const clampedZoom = Math.min(max, Math.max(min, currentZoom));
            setZoomLevel(clampedZoom);

            await track.applyConstraints({
              advanced: [{ zoom: clampedZoom }],
            } as unknown as MediaTrackConstraints);
          } else {
            setZoomSupported(false);
            setZoomLevel(1);
          }
        }

        videoElement.srcObject = stream;

        // Wait for video to be ready before starting barcode scanning
        const onLoadedMetadata = () => {
          scanningRef.current = true;
          startBarcodeScanning(videoElement);
          videoElement.removeEventListener("loadedmetadata", onLoadedMetadata);
        };

        videoElement.addEventListener("loadedmetadata", onLoadedMetadata);

        // Start playback (autoPlay attribute should handle this, but be defensive)
        await new Promise((resolve) => {
          if (videoElement.readyState >= 2) {
            // HAVE_CURRENT_DATA or better
            resolve(null);
          } else {
            const onCanPlay = () => {
              videoElement.removeEventListener("canplay", onCanPlay);
              resolve(null);
            };
            videoElement.addEventListener("canplay", onCanPlay);
          }
        });
      } catch (err) {
        let errorMessage = "Failed to access camera";

        if (err instanceof Error) {
          if (err.name === "NotAllowedError") {
            errorMessage =
              "Camera permission denied. Please enable camera access in Settings > Privacy > Camera.";
          } else if (err.name === "NotFoundError") {
            errorMessage = "No camera found on this device";
          } else if (err.name === "NotReadableError") {
            errorMessage =
              "Camera is in use by another app. Please close it and try again.";
          } else {
            errorMessage = err.message;
          }
        }

        setError(errorMessage);
        setCameraActive(false);
      }
    };

    const startBarcodeScanning = (videoElement: HTMLVideoElement) => {
      // Use ZXing's built-in video decoding with proper error handling
      const scan = () => {
        if (!scanningRef.current || !isOpen) {
          return;
        }

        if (detectionPausedRef.current) {
          scanTimeoutRef.current = setTimeout(scan, 100);
          return;
        }

        try {
          // Ensure video is still playing and ready
          if (
            videoElement.readyState < 2 ||
            videoElement.paused ||
            videoElement.ended
          ) {
            // Video not ready, retry soon
            if (scanningRef.current && isOpen) {
              scanTimeoutRef.current = setTimeout(scan, 100);
            }
            return;
          }

          // Draw current video frame to an off-screen canvas
          if (!canvasRef.current) {
            canvasRef.current = document.createElement("canvas");
          }
          const canvas = canvasRef.current;
          canvas.width = videoElement.videoWidth;
          canvas.height = videoElement.videoHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            scanTimeoutRef.current = setTimeout(scan, 100);
            return;
          }
          ctx.drawImage(videoElement, 0, 0);

          const luminance = new HTMLCanvasElementLuminanceSource(canvas);
          const bitmap = new BinaryBitmap(new HybridBinarizer(luminance));
          const result = readerRef.current.decode(bitmap);

          if (result && scanningRef.current) {
            const barcodeText = result.getText().trim();
            if (barcodeText) {
              if (detectedBarcodeRef.current !== barcodeText) {
                detectedBarcodeRef.current = barcodeText;
              }

              if (ignoredBarcodeRef.current === barcodeText) {
                scanTimeoutRef.current = setTimeout(scan, 100);
                return;
              }

              detectionPausedRef.current = true;
              playDetectedSound();
              setDetectedBarcode(barcodeText);
            }
          }
        } catch (err) {
          if (!(err instanceof NotFoundException)) {
            console.error("Barcode scan error:", err);
          }

          // Continue scanning with a small delay to avoid CPU overload
          if (scanningRef.current && isOpen) {
            scanTimeoutRef.current = setTimeout(scan, 100);
          }
          return;
        }

        if (scanningRef.current && isOpen) {
          scanTimeoutRef.current = setTimeout(scan, 100);
        }
      };

      // Start scanning
      scan();
    };

    initCamera();

    return () => {
      // Stop scanning
      scanningRef.current = false;
      detectionPausedRef.current = false;
      ignoredBarcodeRef.current = null;
      detectedBarcodeRef.current = null;
      videoTrackRef.current = null;
      setZoomSupported(false);
      setZoomLevel(1);
      setZoomMin(1);
      setZoomMax(1);
      setDetectedBarcode(null);
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
      if (ignoreCooldownRef.current) {
        clearTimeout(ignoreCooldownRef.current);
      }
      if (scanSoundRef.current) {
        scanSoundRef.current.pause();
        scanSoundRef.current.currentTime = 0;
      }

      // Stop camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, cameraActive]);

  const clearIgnoreAfterCooldown = () => {
    if (ignoreCooldownRef.current) clearTimeout(ignoreCooldownRef.current);
    ignoreCooldownRef.current = setTimeout(() => {
      ignoredBarcodeRef.current = null;
    }, 1500);
  };

  const handleAddDetectedBarcode = () => {
    if (!detectedBarcode) return;
    onBarcode(detectedBarcode);

    // Keep scanner open after adding and prevent immediate re-trigger
    ignoredBarcodeRef.current = detectedBarcode;
    detectionPausedRef.current = false;
    setDetectedBarcode(null);
    clearIgnoreAfterCooldown();
  };

  const handleDismissDetectedBarcode = () => {
    if (detectedBarcode) {
      ignoredBarcodeRef.current = detectedBarcode;
    }
    detectionPausedRef.current = false;
    setDetectedBarcode(null);
    clearIgnoreAfterCooldown();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onBarcode(manualInput.trim());
      setManualInput("");
      onClose();
    }
  };

  const handleZoomChange = async (nextZoom: number) => {
    const min = zoomRangeRef.current.min;
    const max = zoomRangeRef.current.max;
    const clampedZoom = Math.min(max, Math.max(min, nextZoom));
    setZoomLevel(clampedZoom);
    const track = videoTrackRef.current;
    if (!track) return;

    try {
      await track.applyConstraints({
        advanced: [{ zoom: clampedZoom }],
      } as unknown as MediaTrackConstraints);
    } catch {
      // Some devices report zoom capability but can still reject updates.
    }
  };

  const handleZoomStep = async (direction: "in" | "out") => {
    const step = zoomRangeRef.current.step || 0.1;
    const delta = direction === "in" ? step : -step;
    await handleZoomChange(zoomLevel + delta);
  };

  return (
    <>
      <Modal
        open={isOpen}
        onClose={onClose}
        fullScreen
        className="flex flex-col items-center justify-center px-6 py-8"
      >
        <div className="flex flex-col items-center justify-center w-full max-w-xs">
          {error ? (
            <div className="mb-4 aspect-square w-full h-auto bg-black rounded-2xl">
              <div className="rounded-lg bg-red-50 p-4">
                <p className="text-sm text-red-700">Camera access error</p>
                <p className="mt-2 text-xs text-red-600">{error}</p>
              </div>
            </div>
          ) : cameraActive ? (
            <>
              <div className="relative mb-4 aspect-square w-full h-auto overflow-hidden bg-black rounded-2xl">
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  playsInline
                  autoPlay
                  muted
                />

                <div className="absolute top-0 left-0 z-10 w-full p-3">
                  <p className="text-xs text-white bg-warning-500 text-center rounded-full px-3 py-1 animate-pulse">
                    Scanning for barcode... Point camera at barcode
                  </p>
                </div>

                <div
                  className={cn(
                    "absolute inset-0 z-10 flex items-end bg-black/55 p-3",
                    detectedBarcode
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-95",
                    "transition origin-center",
                  )}
                >
                  <div className="w-full rounded-lg bg-white p-3 shadow-2xl ring-1 ring-black/8">
                    <p className="flex items-center gap-2 text-xs font-medium text-neutral-700">
                      Barcode detected
                    </p>
                    <p className="mt-1 break-all rounded-md bg-neutral-100 px-2 py-1 text-sm text-neutral-900">
                      {detectedBarcode || "Unknown code"}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button type="button" onClick={handleAddDetectedBarcode}>
                        Add this barcode
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleDismissDetectedBarcode}
                      >
                        Ignore this code
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {zoomSupported ? (
                <div className="mb-4 w-full rounded-lg border border-neutral-200 bg-surface-muted p-3">
                  <div className="flex items-center justify-between">
                    <p>Zoom ({zoomLevel.toFixed(1)}x)</p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        icon={<Minus size={16} />}
                        onClick={() => void handleZoomStep("out")}
                        disabled={zoomLevel <= zoomMin + 0.001}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        icon={<Plus size={16} />}
                        onClick={() => void handleZoomStep("in")}
                        disabled={zoomLevel >= zoomMax - 0.001}
                      />
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-3 items-center gap-2"></div>
                  <p className="mt-2 text-[11px] text-neutral-500">
                    If barcode looks blurry up close, move back slightly and use
                    zoom.
                  </p>
                </div>
              ) : null}
            </>
          ) : (
            <div className="mb-4 aspect-square w-full h-auto bg-black rounded-2xl">
              <div className="flex h-full w-full items-center justify-center">
                <CameraOff size={48} className="text-white" />
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mb-4 w-full space-y-2">
            <label className="block text-sm font-medium text-neutral-900">
              Manual Barcode Entry
            </label>
            <div className="flex gap-2">
              <FormInput
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Enter or scan barcode..."
                className="flex-1 bg-white"
                autoFocus
                autoComplete="off"
              />
              <Button
                type="submit"
                disabled={!manualInput.trim()}
                className="whitespace-nowrap"
              >
                Add
              </Button>
            </div>
          </form>

          <div className="mt-4 flex gap-3 w-full">
            <Button
              onClick={() => setCameraActive(cameraActive ? false : true)}
              variant={cameraActive ? "warning" : "primary"}
              type="button"
              icon={
                cameraActive ? <CameraOff size={16} /> : <Camera size={16} />
              }
              className="flex-1"
            >
              {cameraActive ? "Hide Camera" : "Show Camera"}
            </Button>
            <Button
              onClick={onClose}
              variant="destructive"
              type="button"
              className="flex-1"
            >
              Exit
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
