"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { computeImageMetrics } from "@/lib/imageMetrics";
import {
  ACCEPTED_MIME,
  HARD_MIN_DIM,
  MAX_FILE_BYTES,
  PREFERRED_MIN_DIM,
  SESSION_IMAGE_PREFIX,
  SESSION_META_PREFIX,
  humanFileSize,
} from "@/lib/clientConfig";
import type { AnalyzeResponse } from "@/lib/taxonomy";
import { UploadZone } from "./UploadZone";
import { ProcessingSteps } from "./ProcessingSteps";
import { ErrorState, type ErrorKind } from "./ErrorState";

type Stage = "idle" | "preview" | "processing" | "error";

interface Preview {
  file: File;
  dataUrl: string;
  width: number;
  height: number;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Produce a small JPEG data URL to send to the model backend (keeps the
// request payload small; the backend resizes to 224px anyway).
function downscaleForModel(img: HTMLImageElement, max = 480): string {
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(img, 0, 0, w, h);
  try {
    return canvas.toDataURL("image/jpeg", 0.85);
  } catch {
    return ""; // tainted canvas (rare for local files); model path skipped
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("unreadable"));
    img.src = src;
  });
}

function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("unreadable"));
    reader.readAsDataURL(file);
  });
}

export function UploadFlow() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<{ kind: ErrorKind; message: string }>({
    kind: "validation",
    message: "",
  });

  const reset = useCallback(() => {
    setPreview(null);
    setStage("idle");
    setActiveStep(0);
  }, []);

  const showError = useCallback((kind: ErrorKind, message: string) => {
    setError({ kind, message });
    setStage("error");
  }, []);

  const onFile = useCallback(
    async (file: File) => {
      // Format check (spec 7.1)
      if (!ACCEPTED_MIME.includes(file.type as (typeof ACCEPTED_MIME)[number])) {
        showError(
          "validation",
          `Unsupported format "${file.type || "unknown"}". Please use JPG, PNG, or WebP.`
        );
        return;
      }
      // Size check
      if (file.size > MAX_FILE_BYTES) {
        showError(
          "validation",
          `File is ${humanFileSize(file.size)}, which exceeds the ${humanFileSize(
            MAX_FILE_BYTES
          )} limit.`
        );
        return;
      }

      try {
        const dataUrl = await readDataUrl(file);
        const img = await loadImage(dataUrl);
        const width = img.naturalWidth;
        const height = img.naturalHeight;

        if (Math.min(width, height) < HARD_MIN_DIM) {
          showError(
            "validation",
            `Image is ${width}×${height}px, which is too small to analyze. Use at least ${PREFERRED_MIN_DIM}×${PREFERRED_MIN_DIM}px.`
          );
          return;
        }

        setPreview({ file, dataUrl, width, height });
        setStage("preview");
      } catch {
        showError("validation", "This image could not be read. It may be corrupt.");
      }
    },
    [showError]
  );

  const analyze = useCallback(async () => {
    if (!preview) return;
    setStage("processing");
    setActiveStep(0);

    try {
      await delay(450);

      // Step 1 -> compute metrics (validation + quality inputs) + model image
      const img = await loadImage(preview.dataUrl);
      const metrics = computeImageMetrics(img);
      const modelImage = downscaleForModel(img);
      setActiveStep(1);
      await delay(500);

      // Step 2 -> analyze (server pipeline)
      setActiveStep(2);
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: preview.file.name, metrics, image: modelImage }),
      });
      const data = (await res.json()) as AnalyzeResponse;
      await delay(600);

      // Step 3 -> finalize
      setActiveStep(3);
      await delay(400);

      if (data.status === "success" && data.job_id) {
        try {
          sessionStorage.setItem(SESSION_IMAGE_PREFIX + data.job_id, preview.dataUrl);
          sessionStorage.setItem(
            SESSION_META_PREFIX + data.job_id,
            JSON.stringify({ width: preview.width, height: preview.height })
          );
        } catch {
          /* sessionStorage may be full; results page degrades gracefully */
        }
        router.push(`/results/${data.job_id}`);
        return;
      }

      if (data.status === "unsupported") {
        showError("unsupported", data.message ?? "This image type is not supported.");
      } else if (data.status === "not_usable") {
        showError("not_usable", data.message ?? "This image quality is too low.");
      } else {
        showError("failed", data.message ?? "Something went wrong during analysis.");
      }
    } catch {
      showError("failed", "We couldn't reach the analysis service. Please try again.");
    }
  }, [preview, router, showError]);

  if (stage === "processing") {
    return <ProcessingSteps activeIndex={activeStep} thumbnail={preview?.dataUrl ?? null} />;
  }

  if (stage === "error") {
    return <ErrorState kind={error.kind} message={error.message} onRetry={reset} />;
  }

  if (stage === "preview" && preview) {
    const belowPreferred = Math.min(preview.width, preview.height) < PREFERRED_MIN_DIM;
    return (
      <div className="mx-auto max-w-md">
        <div className="card mv-rise overflow-hidden p-4">
          <div className="relative overflow-hidden rounded-xl border border-[var(--border)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview.dataUrl}
              alt="Selected preview"
              className="max-h-72 w-full object-contain bg-[var(--surface-3)]"
            />
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 text-[12px] text-[var(--muted)]">
            <span className="truncate" title={preview.file.name}>
              {preview.file.name}
            </span>
            <span className="shrink-0 font-mono text-[var(--muted-2)]">
              {preview.width}×{preview.height} · {humanFileSize(preview.file.size)}
            </span>
          </div>

          {belowPreferred && (
            <div className="mt-3 rounded-lg border border-[rgba(245,196,83,0.3)] bg-[rgba(245,196,83,0.1)] p-2.5 text-[11.5px] text-[var(--warn)]">
              Below the preferred {PREFERRED_MIN_DIM}×{PREFERRED_MIN_DIM}px — results
              may be less reliable.
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button
              onClick={reset}
              className="flex-1 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-4 py-2.5 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            >
              Change
            </button>
            <button
              onClick={analyze}
              className="flex-[2] rounded-xl border border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-2.5 text-sm font-semibold text-[var(--accent)] transition-all hover:bg-[rgba(76,194,255,0.2)]"
            >
              Analyze image
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <UploadZone onFile={onFile} />;
}
