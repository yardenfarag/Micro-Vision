import { DISCLAIMER_TEXT } from "@/lib/taxonomy";

export function DisclaimerFooter() {
  return (
    <footer className="mt-12 border-t border-[var(--border)] bg-[rgba(6,9,18,0.6)]">
      <div className="mx-auto max-w-6xl px-5 py-6">
        <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            className="mt-0.5 shrink-0"
            aria-hidden
          >
            <circle cx="12" cy="12" r="9" stroke="var(--warn)" strokeWidth="1.6" />
            <path
              d="M12 8v5"
              stroke="var(--warn)"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <circle cx="12" cy="16.2" r="1" fill="var(--warn)" />
          </svg>
          <p className="text-[12.5px] leading-relaxed text-[var(--muted)]">
            {DISCLAIMER_TEXT}
          </p>
        </div>
        <p className="mt-3 text-center text-[11px] text-[var(--muted-2)]">
          Micro Vision · educational use · reference 3D models · not species-level
          identification
        </p>
      </div>
    </footer>
  );
}
