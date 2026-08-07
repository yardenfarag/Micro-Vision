"use client";

import { useState } from "react";
import type { ResultSegmentation } from "@/lib/taxonomy";
import { SegmentationOverlay } from "./SegmentationOverlay";
import { ConfidenceBar, SectionTitle } from "@/components/ui";

export function ImagePanel({
  src,
  segmentation,
}: {
  src: string | null;
  segmentation: ResultSegmentation;
}) {
  const [showOverlay, setShowOverlay] = useState(true);

  return (
    <div className="card card-hover p-4">
      <SectionTitle source="visible" hint="Original upload with detected regions">
        Image &amp; segmentation
      </SectionTitle>

      <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-3)]">
        {src ? (
          <div className="relative aspect-square w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt="Analyzed microscopy image"
              className="absolute inset-0 h-full w-full object-contain"
            />
            <SegmentationOverlay
              src={src}
              mode={segmentation.mode}
              visible={showOverlay}
            />
          </div>
        ) : (
          <div className="grid aspect-square w-full place-items-center p-6 text-center text-[12px] text-[var(--muted-2)]">
            Original image isn&apos;t available in this session. Overlay is computed
            from the uploaded image during analysis.
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          onClick={() => setShowOverlay((v) => !v)}
          disabled={!src}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors disabled:opacity-40 ${
            showOverlay
              ? "border-[rgba(56,225,214,0.4)] bg-[var(--visible-soft)] text-[var(--visible)]"
              : "border-[var(--border-strong)] bg-[var(--surface-2)] text-[var(--muted)]"
          }`}
        >
          <span
            className={`inline-flex h-3.5 w-6 items-center rounded-full px-0.5 transition-colors ${
              showOverlay ? "bg-[var(--visible)]" : "bg-[var(--surface-3)]"
            }`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full bg-white transition-transform ${
                showOverlay ? "translate-x-2.5" : "translate-x-0"
              }`}
            />
          </span>
          Segmentation overlay
        </button>

        <span className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 text-[11px] text-[var(--muted)]">
          mode: <span className="font-mono text-[var(--foreground)]">{segmentation.mode}</span>
        </span>
      </div>

      <div className="mt-3">
        <ConfidenceBar
          value={segmentation.confidence}
          label="Segmentation confidence"
        />
      </div>
    </div>
  );
}
