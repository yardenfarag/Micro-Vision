import { UploadFlow } from "@/components/upload/UploadFlow";
import { MicroscopyExample } from "@/components/MicroscopyExample";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
      <div className="grid items-start gap-10 lg:grid-cols-2">
        {/* Left: pitch */}
        <div className="mv-rise">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-[11px] text-[var(--muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--visible)]" />
            Educational MVP · bacteria only
          </span>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight text-[var(--foreground)] sm:text-5xl">
            See bacteria in{" "}
            <span className="bg-gradient-to-r from-[var(--visible)] via-[var(--accent)] to-[var(--reference)] bg-clip-text text-transparent">
              2D and 3D
            </span>
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[var(--muted)]">
            Upload a stained bacterial microscope image to get a segmentation
            overlay, morphology labels, a stain-appearance estimate,
            and a rotatable 3D reference model with a short educational card.
          </p>

          <ul className="mt-6 space-y-2.5">
            {[
              "Segmentation overlay of visible bacteria",
              "Shape, arrangement & stain-appearance estimates",
              "Rotatable 3D reference model",
              "Curated, species-free educational info",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2.5 text-[13.5px] text-[var(--muted)]">
                <CheckDot />
                {t}
              </li>
            ))}
          </ul>

          <div className="mt-7 max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-2)]">
              Example supported image
            </div>
            <div className="flex items-center gap-4">
              <MicroscopyExample className="h-20 w-28 shrink-0 rounded-lg border border-[var(--border)]" />
              <p className="text-[12px] leading-relaxed text-[var(--muted)]">
                A stained light-microscopy field showing bacterial cells (Gram,
                acid-fast, endospore, or capsule stains). Drawings,
                EM/fluorescence images, fungi, parasites, and regular photos are not
                supported.
              </p>
            </div>
          </div>
        </div>

        {/* Right: uploader */}
        <div className="lg:pt-10">
          <UploadFlow />
          <p className="mt-4 text-center text-[12px] text-[var(--muted-2)]">
            One image at a time · this educational MVP supports bacteria only
          </p>
        </div>
      </div>
    </div>
  );
}

function CheckDot() {
  return (
    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-[rgba(56,225,214,0.35)] bg-[var(--visible-soft)]">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M5 12.5l4 4 10-10"
          stroke="var(--visible)"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
