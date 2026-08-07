"use client";

import { useEffect, useRef, useState } from "react";
import type { SegmentationMode } from "@/lib/taxonomy";

const PROC_MAX = 900;

// Client-side segmentation overlay. This draws a real, threshold-based highlight
// of stained foreground over the original image (spec 7.4: overlay drawn on the
// original image; the mask is for display only, not internal structures).
export function SegmentationOverlay({
  src,
  mode,
  visible,
}: {
  src: string;
  mode: SegmentationMode;
  visible: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const scale = Math.min(1, PROC_MAX / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      const tmp = document.createElement("canvas");
      tmp.width = w;
      tmp.height = h;
      const tctx = tmp.getContext("2d", { willReadFrequently: true });
      if (!tctx) return;
      tctx.drawImage(img, 0, 0, w, h);
      const { data } = tctx.getImageData(0, 0, w, h);

      // Build a foreground mask from stained (saturated) pixels.
      const mask = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++) {
        const r = data[i * 4];
        const g = data[i * 4 + 1];
        const b = data[i * 4 + 2];
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const v = max / 255;
        const s = max === 0 ? 0 : (max - min) / max;
        // Cluster mode highlights broader regions; instance mode is stricter.
        const sThr = mode === "cluster" ? 0.16 : 0.22;
        mask[i] = s > sThr && v > 0.12 && v < 0.98 ? 1 : 0;
      }

      const out = ctx.createImageData(w, h);
      const fill = [56, 225, 214]; // var(--visible)
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = y * w + x;
          if (!mask[idx]) continue;

          // Edge if any 4-neighbor is background (or border).
          const edge =
            x === 0 ||
            y === 0 ||
            x === w - 1 ||
            y === h - 1 ||
            !mask[idx - 1] ||
            !mask[idx + 1] ||
            !mask[idx - w] ||
            !mask[idx + w];

          const o = idx * 4;
          out.data[o] = fill[0];
          out.data[o + 1] = fill[1];
          out.data[o + 2] = fill[2];
          out.data[o + 3] = edge ? 235 : 70;
        }
      }
      ctx.putImageData(out, 0, 0);
      setReady(true);
    };
    img.onerror = () => setReady(false);
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src, mode]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden={!visible}
      className="pointer-events-none absolute inset-0 h-full w-full object-contain transition-opacity duration-300"
      style={{ opacity: visible && ready ? 1 : 0, mixBlendMode: "screen" }}
    />
  );
}
