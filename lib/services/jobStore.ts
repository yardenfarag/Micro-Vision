import type { AnalysisResult } from "@/lib/taxonomy";

// In-memory job store for the MVP (single process). Results reset on server
// restart, which is acceptable for a Phase-1 prototype with no accounts.
// `globalThis` keeps the map stable across Next.js hot-reloads in dev.

interface StoredJob {
  result: AnalysisResult;
  createdAt: number;
}

const globalForJobs = globalThis as unknown as {
  __microVisionJobs?: Map<string, StoredJob>;
};

const jobs: Map<string, StoredJob> =
  globalForJobs.__microVisionJobs ?? new Map<string, StoredJob>();

if (!globalForJobs.__microVisionJobs) {
  globalForJobs.__microVisionJobs = jobs;
}

// Light TTL/size guard so memory does not grow unbounded.
const MAX_JOBS = 200;
const TTL_MS = 1000 * 60 * 60; // 1 hour

function prune() {
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (now - job.createdAt > TTL_MS) jobs.delete(id);
  }
  while (jobs.size > MAX_JOBS) {
    const oldest = jobs.keys().next().value;
    if (oldest === undefined) break;
    jobs.delete(oldest);
  }
}

export function saveJob(id: string, result: AnalysisResult): void {
  prune();
  jobs.set(id, { result, createdAt: Date.now() });
}

export function getJob(id: string): AnalysisResult | null {
  return jobs.get(id)?.result ?? null;
}

export function newJobId(): string {
  // Prefer crypto.randomUUID when available.
  try {
    return globalThis.crypto.randomUUID();
  } catch {
    return `job_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }
}
