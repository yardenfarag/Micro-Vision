import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[rgba(6,9,18,0.72)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/" className="group flex items-center gap-3">
          <LogoMark />
          <div className="leading-tight">
            <div className="text-[15px] font-semibold tracking-tight text-[var(--foreground)]">
              Micro Vision
            </div>
            <div className="text-[11px] text-[var(--muted-2)]">
              Microbe segmentation &amp; 3D educational viewer
            </div>
          </div>
        </Link>
        <span className="hidden items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-[11px] text-[var(--muted)] sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--ok)]" />
          Educational MVP · bacteria only
        </span>
      </div>
    </header>
  );
}

function LogoMark() {
  return (
    <span className="relative grid h-9 w-9 place-items-center rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)]">
      <span className="absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_30%_30%,rgba(76,194,255,0.35),transparent_60%)]" />
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        className="relative"
        aria-hidden
      >
        <circle cx="12" cy="12" r="7" stroke="var(--visible)" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="3" fill="var(--reference)" opacity="0.85" />
        <path
          d="M12 2v2M12 20v2M2 12h2M20 12h2"
          stroke="var(--accent)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
