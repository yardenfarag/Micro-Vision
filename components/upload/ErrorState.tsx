"use client";

export type ErrorKind = "unsupported" | "not_usable" | "validation" | "failed";

const META: Record<
  ErrorKind,
  { title: string; tone: string; icon: "scope" | "quality" | "warn" }
> = {
  unsupported: {
    title: "Unsupported image",
    tone: "var(--reference)",
    icon: "scope",
  },
  not_usable: {
    title: "Image quality too low",
    tone: "var(--warn)",
    icon: "quality",
  },
  validation: {
    title: "Can't use this file",
    tone: "var(--danger)",
    icon: "warn",
  },
  failed: {
    title: "Analysis failed",
    tone: "var(--danger)",
    icon: "warn",
  },
};

export function ErrorState({
  kind,
  message,
  onRetry,
}: {
  kind: ErrorKind;
  message: string;
  onRetry: () => void;
}) {
  const meta = META[kind];
  return (
    <div className="mx-auto max-w-md">
      <div
        className="card mv-rise p-6 text-center"
        style={{ borderColor: meta.tone }}
      >
        <div
          className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border"
          style={{ borderColor: meta.tone, background: "var(--surface-2)" }}
        >
          <ErrorIcon icon={meta.icon} color={meta.tone} />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-[var(--foreground)]">
          {meta.title}
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted)]">{message}</p>

        {kind === "unsupported" && (
          <p className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3 text-[12px] text-[var(--muted-2)]">
            Supported: bacterial light-microscopy stains (Gram, acid-fast,
            endospore, or capsule). Not supported: drawings, EM/fluorescence
            images, fungi/parasites/viruses, or regular photos.
          </p>
        )}

        <button
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 12a8 8 0 1 1 2.3 5.6M4 20v-4h4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Try another image
        </button>
      </div>
    </div>
  );
}

function ErrorIcon({ icon, color }: { icon: "scope" | "quality" | "warn"; color: string }) {
  if (icon === "scope") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="11" cy="11" r="6.5" stroke={color} strokeWidth="1.8" />
        <path d="M16 16l4 4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M8.5 11h5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (icon === "quality") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" stroke={color} strokeWidth="1.8" />
        <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8" />
        <path d="M6 9.5h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 4l8.5 15H3.5L12 4z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M12 10v4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="0.9" fill={color} />
    </svg>
  );
}
