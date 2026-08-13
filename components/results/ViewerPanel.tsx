"use client";

import dynamic from "next/dynamic";
import type { ResultViewer } from "@/lib/taxonomy";
import { SectionTitle } from "@/components/ui";

// 3D viewer is client-only (WebGL); load it without SSR.
const MicrobeViewer = dynamic(
  () => import("@/components/viewer/MicrobeViewer").then((m) => m.MicrobeViewer),
  {
    ssr: false,
    loading: () => (
      <div className="grid aspect-[16/10] min-h-[320px] w-full place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface-3)]">
        <div className="flex flex-col items-center gap-3 text-[12px] text-[var(--muted-2)]">
          <span className="mv-spin h-6 w-6 rounded-full border-2 border-[var(--accent)] border-t-transparent" />
          Loading 3D model…
        </div>
      </div>
    ),
  }
);

export function ViewerPanel({ viewer }: { viewer: ResultViewer }) {
  return (
    <div className="card card-hover p-4">
      <SectionTitle source="reference" hint="Template model selected from detected morphology">
        3D reference model
      </SectionTitle>

      <MicrobeViewer templateId={viewer.template_id} colorTheme={viewer.color_theme} />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 text-[11px] text-[var(--muted)]">
          template: <span className="font-mono text-[var(--foreground)]">{viewer.template_id}</span>
        </span>
        <span className="text-[11px] text-[var(--muted-2)]">
          Click regions to learn about structure
        </span>
      </div>

      <p className="mt-3 rounded-lg border border-[rgba(167,139,250,0.3)] bg-[var(--reference-soft)] p-3 text-[11.5px] leading-relaxed text-[var(--reference)]">
        Reference 3D model based on detected morphology, not an exact reconstruction
        from the image. Highlighted parts are teaching overlays, not measured features.
      </p>
    </div>
  );
}
