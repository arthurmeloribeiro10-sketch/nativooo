import { useCallback, useEffect, useRef, useState } from "react";

type ScannerStatus =
  "idle" | "starting" | "scanning" | "permission_denied" | "unsupported" | "error";

declare global {
  interface Window {
    BarcodeDetector?: new (options: { formats: string[] }) => {
      detect(source: CanvasImageSource): Promise<Array<{ rawValue: string }>>;
    };
  }
}

const BARCODE_FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39"];
const DETECT_INTERVAL_MS = 350;

/**
 * Encapsula câmera + detecção de código de barras. Nunca grava a imagem —
 * os frames só existem no <video> em memória, usados para detecção e
 * descartados.
 */
export function useBarcodeScanner(onDetected: (barcode: string) => void) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectTimerRef = useRef<number | null>(null);
  const [status, setStatus] = useState<ScannerStatus>("idle");
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const detectorSupported = typeof window !== "undefined" && "BarcodeDetector" in window;

  const stop = useCallback(() => {
    if (detectTimerRef.current) {
      window.clearInterval(detectTimerRef.current);
      detectTimerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    setStatus("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const [track] = stream.getVideoTracks();
      const caps = track?.getCapabilities?.() as
        (MediaTrackCapabilities & { torch?: boolean }) | undefined;
      setTorchSupported(Boolean(caps?.torch));

      if (!detectorSupported || !window.BarcodeDetector) {
        setStatus("unsupported");
        return;
      }

      const detector = new window.BarcodeDetector({ formats: BARCODE_FORMATS });
      setStatus("scanning");

      detectTimerRef.current = window.setInterval(async () => {
        if (!videoRef.current) return;
        try {
          const [first] = await detector.detect(videoRef.current);
          if (first) {
            onDetected(first.rawValue);
          }
        } catch {
          // frame ilegível — tenta de novo no próximo tick
        }
      }, DETECT_INTERVAL_MS);
    } catch (e) {
      if (
        e instanceof DOMException &&
        (e.name === "NotAllowedError" || e.name === "PermissionDeniedError")
      ) {
        setStatus("permission_denied");
      } else {
        setStatus("error");
      }
    }
  }, [detectorSupported, onDetected]);

  const toggleTorch = useCallback(async () => {
    const [track] = streamRef.current?.getVideoTracks() ?? [];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] });
      setTorchOn(next);
    } catch {
      // lanterna não suportada neste dispositivo/navegador
    }
  }, [torchOn]);

  useEffect(() => stop, [stop]);

  return { videoRef, status, start, stop, torchOn, torchSupported, toggleTorch, detectorSupported };
}
