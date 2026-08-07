"use client";

import type { AnalysisResult } from "@/lib/taxonomy";
import { ConfidenceBar, SectionTitle } from "@/components/ui";

// Exposes every confidence field (spec 7.10) so users can judge reliability.
export function ConfidencePanel({ result }: { result: AnalysisResult }) {
  const rows: { label: string; value: number }[] = [
    { label: "Support classifier", value: result.input.support_confidence },
    { label: "Image quality score", value: result.input.quality_score },
    { label: "Segmentation", value: result.segmentation.confidence },
    { label: "Morphology", value: result.classification.morphology.confidence },
    { label: "Arrangement", value: result.classification.arrangement.confidence },
    { label: "Gram appearance", value: result.classification.gram_appearance.confidence },
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
        Confidence values reflect heuristic estimates from a Phase-1 educational
        pipeline, not a clinically validated model. Low values mean the image was
        ambiguous.
      </p>
    </div>
  );
}
