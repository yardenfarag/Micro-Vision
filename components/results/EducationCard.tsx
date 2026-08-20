"use client";

import type { ResultEducation } from "@/lib/taxonomy";
import { SectionTitle } from "@/components/ui";

export function EducationCard({ education }: { education: ResultEducation }) {
  return (
    <div className="card card-hover p-5">
      <SectionTitle source="reference" hint="Curated learning content, tied to morphology class">
        Educational info
      </SectionTitle>

      <h3 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
        {education.title}
      </h3>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--muted)]">
        {education.summary}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <InfoBlock title="Morphology" body={education.morphology_explanation} />
        <InfoBlock title="Arrangement" body={education.arrangement_explanation} />
        <InfoBlock title={education.appearance_title} body={education.appearance_explanation} />
        <InfoBlock title="Habitat / notes" body={education.habitat_notes} />
        {education.structure_explanation ? (
          <InfoBlock title="Special structure" body={education.structure_explanation} />
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {education.class_features.length > 0 ? (
          <ListBlock title="Class features" items={education.class_features} />
        ) : null}
        {education.common_examples.length > 0 ? (
          <ListBlock title="Common examples" items={education.common_examples} />
        ) : null}
        <ListBlock title="Common follow-up tests" items={education.common_tests} />
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-[rgba(167,139,250,0.3)] bg-[var(--reference-soft)] p-3">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="var(--reference)" strokeWidth="1.6" />
          <path d="M12 11v5" stroke="var(--reference)" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="7.8" r="1" fill="var(--reference)" />
        </svg>
        <p className="text-[11.5px] leading-relaxed text-[var(--reference)]">
          {education.disclaimer}
        </p>
      </div>
    </div>
  );
}

function InfoBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-2)]">
        {title}
      </div>
      <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--muted)]">{body}</p>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-2)]">
        {title}
      </div>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-md border border-[var(--border)] bg-[var(--surface-3)] px-2 py-1 text-[11.5px] text-[var(--muted)]"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
