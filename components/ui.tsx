import type { ReactNode } from "react";

// The "Visible in image" vs "Reference educational content" split is a core
// transparency requirement (spec 7.10). These badges enforce it visually.
export function SourceBadge({ kind }: { kind: "visible" | "reference" }) {
  if (kind === "visible") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(56,225,214,0.35)] bg-[var(--visible-soft)] px-2.5 py-1 text-[10.5px] font-medium uppercase tracking-wide text-[var(--visible)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--visible)]" />
        Visible in image
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(167,139,250,0.35)] bg-[var(--reference-soft)] px-2.5 py-1 text-[10.5px] font-medium uppercase tracking-wide text-[var(--reference)]">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--reference)]" />
      Reference content
    </span>
  );
}

function confidenceColor(v: number): string {
  if (v >= 0.75) return "var(--ok)";
  if (v >= 0.55) return "var(--warn)";
  return "var(--danger)";
}

export function ConfidenceBar({
  value,
  label,
  sublabel,
}: {
  value: number;
  label?: string;
  sublabel?: string;
}) {
  const pct = Math.round(value * 100);
  const color = confidenceColor(value);
  return (
    <div className="w-full">
      {(label || sublabel) && (
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-[12px] text-[var(--muted)]">{label}</span>
          <span className="font-mono text-[12px] font-semibold" style={{ color }}>
            {pct}%
          </span>
        </div>
      )}
      <div
        className="relative h-2 w-full overflow-hidden rounded-full bg-[var(--surface-3)]"
        role="meter"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "confidence"}
      >
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      {sublabel && (
        <div className="mt-1 text-[11px] text-[var(--muted-2)]">{sublabel}</div>
      )}
    </div>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "ok" | "warn" | "danger";
}) {
  const map: Record<string, string> = {
    neutral: "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)]",
    ok: "border-[rgba(56,211,159,0.35)] bg-[rgba(56,211,159,0.12)] text-[var(--ok)]",
    warn: "border-[rgba(245,196,83,0.35)] bg-[rgba(245,196,83,0.12)] text-[var(--warn)]",
    danger: "border-[rgba(255,107,107,0.35)] bg-[rgba(255,107,107,0.12)] text-[var(--danger)]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${map[tone]}`}
    >
      {children}
    </span>
  );
}

export function SectionTitle({
  children,
  source,
  hint,
}: {
  children: ReactNode;
  source?: "visible" | "reference";
  hint?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div>
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[var(--muted)]">
          {children}
        </h2>
        {hint && <p className="mt-0.5 text-[11px] text-[var(--muted-2)]">{hint}</p>}
      </div>
      {source && <SourceBadge kind={source} />}
    </div>
  );
}
