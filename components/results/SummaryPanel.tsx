"use client";

import {
  ACID_FAST_DISPLAY,
  ARRANGEMENT_DISPLAY,
  CAPSULE_PRESENCE_DISPLAY,
  GRAM_DISPLAY,
  IMAGE_TYPE_DISPLAY,
  MORPHOLOGY_DISPLAY,
  QUALITY_DISPLAY,
  SPORE_POSITION_DISPLAY,
  SPORE_PRESENCE_DISPLAY,
  type AnalysisResult,
  type ResultClassification,
} from "@/lib/taxonomy";
import { Pill, SectionTitle } from "@/components/ui";

function arrangementTile(c: ResultClassification): {
  label: string;
  value: string;
  confidence: number;
} {
  if (c.stain === "spore") {
    return {
      label: "Spore position",
      value: SPORE_POSITION_DISPLAY[c.spore_position.label],
      confidence: c.spore_position.confidence,
    };
  }
  return {
    label: "Arrangement",
    value: ARRANGEMENT_DISPLAY[c.arrangement.label],
    confidence: c.arrangement.confidence,
  };
}

function appearanceTile(c: ResultClassification): {
  label: string;
  value: string;
  confidence: number;
} {
  switch (c.stain) {
    case "gram":
      return {
        label: "Gram appearance",
        value: GRAM_DISPLAY[c.gram_appearance.label],
        confidence: c.gram_appearance.confidence,
      };
    case "acid_fast":
      return {
        label: "Acid-fast appearance",
        value: ACID_FAST_DISPLAY[c.acid_fast_appearance.label],
        confidence: c.acid_fast_appearance.confidence,
      };
    case "spore":
      return {
        label: "Endospore",
        value: SPORE_PRESENCE_DISPLAY[c.spore_presence.label],
        confidence: c.spore_presence.confidence,
      };
    case "capsule":
      return {
        label: "Capsule",
        value: CAPSULE_PRESENCE_DISPLAY[c.capsule_presence.label],
        confidence: c.capsule_presence.confidence,
      };
  }
}

export function SummaryPanel({ result }: { result: AnalysisResult }) {
  const { classification, input } = result;
  const qualityTone =
    input.quality === "usable"
      ? "ok"
      : input.quality === "usable_with_warning"
        ? "warn"
        : "danger";
  const mid = arrangementTile(classification);
  const appearance = appearanceTile(classification);
  const stainName = IMAGE_TYPE_DISPLAY[input.image_type];

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
          label={mid.label}
          value={mid.value}
          confidence={mid.confidence}
        />
        <SummaryTile
          label={appearance.label}
          value={appearance.value}
          confidence={appearance.confidence}
          small
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Pill tone="neutral">{stainName}</Pill>
        <Pill tone={result._source === "model" ? "ok" : "neutral"}>
          {result._source === "model"
            ? "Morphology & Gram: trained model"
            : "Labels: heuristic estimate"}
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
