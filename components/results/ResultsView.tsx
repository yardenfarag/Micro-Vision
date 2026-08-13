"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AnalysisResult } from "@/lib/taxonomy";
import { SESSION_IMAGE_PREFIX } from "@/lib/clientConfig";
import { ImagePanel } from "./ImagePanel";
import { SummaryPanel } from "./SummaryPanel";
import { ConfidencePanel } from "./ConfidencePanel";
import { ViewerPanel } from "./ViewerPanel";
import { EducationCard } from "./EducationCard";

type Status = "loading" | "ready" | "missing";

export function ResultsView({ jobId }: { jobId: string }) {
  const [status, setStatus] = useState<Status>("loading");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/results/${jobId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("not found"))))
      .then((data: AnalysisResult) => {
        if (cancelled) return;
        try {
          const stored = sessionStorage.getItem(SESSION_IMAGE_PREFIX + jobId);
          if (stored) setImageSrc(stored);
        } catch {
          /* sessionStorage unavailable; results still render without the image */
        }
        setResult(data);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("missing");
      });

    return () => {
      cancelled = true;
    };
  }, [jobId]);

  if (status === "loading") {
    return (
      <div className="mx-auto flex max-w-6xl flex-col items-center px-5 py-24 text-center">
        <span className="mv-spin h-8 w-8 rounded-full border-2 border-[var(--accent)] border-t-transparent" />
        <p className="mt-4 text-[13px] text-[var(--muted)]">Loading your results…</p>
      </div>
    );
  }

  if (status === "missing" || !result) {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <h1 className="text-xl font-semibold text-[var(--foreground)]">
          Result not found
        </h1>
        <p className="mt-2 text-[13px] text-[var(--muted)]">
          This result may have expired or the server restarted. Results are kept
          only temporarily in this MVP.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex rounded-xl border border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-2 text-sm font-semibold text-[var(--accent)]"
        >
          Analyze a new image
        </Link>
      </div>
    );
  }

  const warn = result.input.quality === "usable_with_warning";

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <div className="mv-rise flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Analysis results
          </h1>
          <p className="mt-0.5 text-[12.5px] text-[var(--muted-2)]">
            {result.input.file_name}
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-4 py-2 text-sm font-medium text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          New analysis
        </Link>
      </div>

      {warn && (
        <div className="mv-rise mt-4 flex items-start gap-3 rounded-xl border border-[rgba(245,196,83,0.35)] bg-[rgba(245,196,83,0.1)] p-3.5">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0" aria-hidden>
            <path d="M12 4l8.5 15H3.5L12 4z" stroke="var(--warn)" strokeWidth="1.7" strokeLinejoin="round" />
            <path d="M12 10v4" stroke="var(--warn)" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="12" cy="16.4" r="0.9" fill="var(--warn)" />
          </svg>
          <div>
            <div className="text-[13px] font-medium text-[var(--warn)]">
              Usable with warning
            </div>
            <p className="text-[12px] text-[var(--muted)]">
              Quality issues were detected ({result.input.quality_warnings.join(", ").replaceAll("_", " ") || "minor"}).
              Results may be less reliable.
            </p>
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <ImagePanel src={imageSrc} segmentation={result.segmentation} />
        <div className="flex flex-col gap-4">
          <SummaryPanel result={result} />
          <ConfidencePanel result={result} />
        </div>
      </div>

      <div className="mt-4 w-full">
        <ViewerPanel viewer={result.viewer} />
      </div>

      <div className="mt-4">
        <EducationCard education={result.education} />
      </div>
    </div>
  );
}
