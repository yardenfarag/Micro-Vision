"use client";

import type { ViewerPart, ViewerPartId } from "@/lib/content/parts";

export function PartPanel({
  parts,
  selected,
  onSelect,
}: {
  parts: ViewerPart[];
  selected: ViewerPartId | null;
  onSelect: (id: ViewerPartId | null) => void;
}) {
  const active = selected ? (parts.find((p) => p.id === selected) ?? null) : null;

  return (
    <div className="flex h-full flex-col">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-2)]">
        Interactive
      </p>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {parts.map((part) => {
          const isOn = selected === part.id;
          return (
            <button
              key={part.id}
              type="button"
              onClick={() => onSelect(isOn ? null : part.id)}
              className={`rounded-md border px-2 py-1 text-[11px] transition-colors ${
                isOn
                  ? "border-[rgba(238,186,48,0.55)] bg-[rgba(238,186,48,0.15)] text-[#eeba30]"
                  : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)]"
              }`}
            >
              {part.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
        {!active ? (
          <div className="flex h-full flex-col items-center justify-center px-2 text-center">
            <p className="text-[13px] text-[var(--muted)]">Click a region to learn more</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--muted-2)]">
              Click the glowing envelope or arrangement ring on the model, or pick a part
              above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#eeba30]" />
              <h3 className="text-[13px] font-semibold tracking-wide text-[#eeba30]">
                {active.label}
              </h3>
            </div>
            <p className="text-[12.5px] leading-relaxed text-[var(--foreground)]">
              {active.description}
            </p>
            {active.notes ? (
              <p className="border-l-2 border-[rgba(238,186,48,0.35)] pl-3 text-[11.5px] leading-relaxed text-[var(--muted)]">
                {active.notes}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
