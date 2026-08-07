"use client";

import {
  ARRANGEMENT_DISPLAY,
  GRAM_DISPLAY,
  MORPHOLOGY_DISPLAY,
  QUALITY_DISPLAY,
  type AnalysisResult,
} from "@/lib/taxonomy";
import { Pill, SectionTitle } from "@/components/ui";

export function SummaryPanel({ result }: { result: AnalysisResult }) {
  const { classification, input } = result;
  const qualityTone =
    input.quality === "usable"
      ? "ok"
      : input.quality === "usable_with_warning"
        ? "warn"
        : "danger";

  return (
    <div className="card card-hover p-4">
      <SectionTitle source="visible" hint="Estimated from the uploaded image">
        Quick summary
      </SectionTitle>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <SummaryTile
          label="Morphology"
          value={MORPHOLOGY_DISPLAY[classification.morphology.label]}
          confidence={classification.morphology.confidence}
        />
        <SummaryTile
          label="Arrangement"
          value={ARRANGEMENT_DISPLAY[classification.arrangement.label]}
          confidence={classification.arrangement.confidence}
        />
        <SummaryTile
          label="Gram appearance"
          value={GRAM_DISPLAY[classification.gram_appearance.label]}
          confidence={classification.gram_appearance.confidence}
          small
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Pill tone={result._source === "model" ? "ok" : "neutral"}>
          {result._source === "model"
            ? "Morphology & Gram: trained model"
            : "Morphology & Gram: heuristic estimate"}
        </Pill>
        <Pill tone={qualityTone}>
          <span className="opacity-70">Quality:</span> {QUALITY_DISPLAY[input.quality]}
        </Pill>
        {input.quality_warnings.map((w) => (
          <Pill key={w} tone="warn">
            {w.replaceAll("_", " ")}
          </Pill>
        ))}
      </div>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  confidence,
  small,
}: {
  label: string;
  value: string;
  confidence: number;
  small?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--muted-2)]">
          {label}
        </span>
      </div>
      <div
        className={`mt-1 font-semibold text-[var(--foreground)] ${
          small ? "text-[13px] leading-snug" : "text-lg"
        }`}
      >
        {value}
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-3)]">
          <div
            className="h-full rounded-full bg-[var(--visible)]"
            style={{ width: `${Math.round(confidence * 100)}%` }}
          />
        </div>
        <span className="font-mono text-[11px] text-[var(--muted)]">
          {Math.round(confidence * 100)}%
        </span>
      </div>
    </div>
  );
}
