"use client";

const STEPS = [
  { id: "validate", label: "Validating image", detail: "Checking format, size & readability" },
  { id: "quality", label: "Checking quality", detail: "Blur, contrast & exposure" },
  { id: "morphology", label: "Analyzing morphology", detail: "Shape, arrangement & Gram appearance" },
  { id: "result", label: "Generating result", detail: "Selecting 3D model & info card" },
] as const;

export type ProcessingStepId = (typeof STEPS)[number]["id"];

export function ProcessingSteps({
  activeIndex,
  thumbnail,
}: {
  activeIndex: number;
  thumbnail: string | null;
}) {
  return (
    <div className="mx-auto max-w-md">
      <div className="card glow-ring overflow-hidden p-5">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[var(--border-strong)] bg-[var(--surface-3)]">
            {thumbnail && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbnail} alt="Uploaded preview" className="h-full w-full object-cover" />
            )}
            <span className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(76,194,255,0.18))]" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[var(--foreground)]">
              Analyzing your image
            </div>
            <div className="text-[12px] text-[var(--muted-2)]">
              This usually takes a few seconds
            </div>
          </div>
        </div>

        <div className="relative mt-3 h-1 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
          <span className="mv-indeterminate absolute inset-0 block" />
        </div>

        <ol className="mt-5 space-y-3">
          {STEPS.map((step, i) => {
            const state =
              i < activeIndex ? "done" : i === activeIndex ? "active" : "todo";
            return (
              <li key={step.id} className="flex items-center gap-3">
                <StepIcon state={state} />
                <div className="flex-1">
                  <div
                    className={`text-[13px] font-medium ${
                      state === "todo"
                        ? "text-[var(--muted-2)]"
                        : "text-[var(--foreground)]"
                    }`}
                  >
                    {step.label}
                  </div>
                  <div className="text-[11px] text-[var(--muted-2)]">{step.detail}</div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function StepIcon({ state }: { state: "done" | "active" | "todo" }) {
  if (state === "done") {
    return (
      <span className="grid h-6 w-6 place-items-center rounded-full border border-[rgba(56,211,159,0.4)] bg-[rgba(56,211,159,0.14)]">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M5 12.5l4 4 10-10"
            stroke="var(--ok)"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }
  if (state === "active") {
    return (
      <span className="grid h-6 w-6 place-items-center rounded-full border border-[var(--accent)] bg-[var(--accent-soft)]">
        <span className="mv-spin h-3 w-3 rounded-full border-2 border-[var(--accent)] border-t-transparent" />
      </span>
    );
  }
  return (
    <span className="grid h-6 w-6 place-items-center rounded-full border border-[var(--border-strong)] bg-[var(--surface-3)]">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--muted-2)]" />
    </span>
  );
}
