"use client";

import type { AnalysisResult, ResultClassification } from "@/lib/taxonomy";
import { ConfidenceBar, SectionTitle } from "@/components/ui";

function stainRows(c: ResultClassification): { label: string; value: number }[] {
  switch (c.stain) {
    case "gram":
      return [
        { label: "Arrangement", value: c.arrangement.confidence },
        { label: "Gram appearance", value: c.gram_appearance.confidence },
      ];
    case "acid_fast":
      return [
        { label: "Arrangement", value: c.arrangement.confidence },
        { label: "Acid-fast appearance", value: c.acid_fast_appearance.confidence },
      ];
    case "spore":
      return [
        { label: "Endospore presence", value: c.spore_presence.confidence },
        { label: "Spore position", value: c.spore_position.confidence },
      ];
    case "capsule":
      return [
        { label: "Arrangement", value: c.arrangement.confidence },
        { label: "Capsule appearance", value: c.capsule_presence.confidence },
      ];
  }
}

export function ConfidencePanel({ result }: { result: AnalysisResult }) {
  const rows: { label: string; value: number }[] = [
    { label: "Support classifier", value: result.input.support_confidence },
    { label: "Image quality score", value: result.input.quality_score },
    { label: "Segmentation", value: result.segmentation.confidence },
    { label: "Morphology", value: result.classification.morphology.confidence },
    ...stainRows(result.classification),
  ];

  return (
    <div className="card card-hover p-4">
      <SectionTitle source="visible" hint="How confident each step is">
        Confidence &amp; transparency
      </SectionTitle>
      <div className="space-y-3">
        {rows.map((r) => (
          <ConfidenceBar key={r.label} value={r.value} label={r.label} />
        ))}
      </div>
      <p className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3 text-[11.5px] leading-relaxed text-[var(--muted-2)]">
        Confidence values reflect heuristic estimates from an educational
        pipeline, not a clinically validated model. Low values mean the image was
        ambiguous.
      </p>
    </div>
  );
}
