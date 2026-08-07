"use client";

import { useCallback, useRef, useState } from "react";
import { ACCEPTED_EXT, humanFileSize, MAX_FILE_BYTES } from "@/lib/clientConfig";

export function UploadZone({
  onFile,
}: {
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      onFile(files[0]); // one image per request (spec 7.1)
    },
    [onFile]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
        dragging
          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
          : "border-[var(--border-strong)] bg-[var(--surface)] hover:border-[var(--accent)]"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <span
        className={`grid h-14 w-14 place-items-center rounded-2xl border transition-colors ${
          dragging
            ? "border-[var(--accent)] bg-[var(--surface-2)]"
            : "border-[var(--border-strong)] bg-[var(--surface-2)] group-hover:border-[var(--accent)]"
        }`}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 16V5m0 0l-4 4m4-4l4 4"
            stroke="var(--accent)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5 15v2.5A2.5 2.5 0 0 0 7.5 20h9a2.5 2.5 0 0 0 2.5-2.5V15"
            stroke="var(--muted)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </span>

      <div className="mt-4 text-[15px] font-semibold text-[var(--foreground)]">
        {dragging ? "Drop your image here" : "Drag & drop or click to upload"}
      </div>
      <div className="mt-1 text-[12.5px] text-[var(--muted)]">
        Upload a Gram-stained bacterial microscope image
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[11px] text-[var(--muted-2)]">
        <span className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5">
          {ACCEPTED_EXT.join(" · ")}
        </span>
        <span className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5">
          max {humanFileSize(MAX_FILE_BYTES)}
        </span>
        <span className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5">
          512×512+ preferred
        </span>
      </div>
    </div>
  );
}
