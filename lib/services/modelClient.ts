// Client for the optional Python inference backend.
// When the backend is reachable, morphology + Gram come from the trained model
// (Gram stains only). Otherwise the caller falls back to the heuristic pipeline.

import type { GramLabel, MorphologyLabel } from "@/lib/taxonomy";

const MODEL_URL = process.env.MICROVISION_MODEL_URL ?? "http://127.0.0.1:8000";

export interface ModelPrediction {
  morphology: { label: MorphologyLabel; confidence: number; scores: Record<string, number> };
  gram_appearance: { label: GramLabel; confidence: number; scores: Record<string, number> };
  model_version: number | string;
}

// The model only knows cocci/bacilli and gram_positive_like/gram_negative_like.
// Map model outputs onto the product taxonomy (which adds vibrio/spirillum/
// mixed/unknown and indeterminate).
function coerceModelLabels(raw: unknown): ModelPrediction | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const m = r.morphology as Record<string, unknown> | undefined;
  const g = r.gram_appearance as Record<string, unknown> | undefined;
  if (!m || !g) return null;
  const mLabel = String(m.label);
  const gLabel = String(g.label);
  const mConf = typeof m.confidence === "number" ? m.confidence : null;
  const gConf = typeof g.confidence === "number" ? g.confidence : null;
  if (mConf === null || gConf === null) return null;

  const validMorph: MorphologyLabel[] = ["cocci", "bacilli"];
  const validGram: GramLabel[] = ["gram_positive_like", "gram_negative_like"];
  if (!validMorph.includes(mLabel as MorphologyLabel)) return null;
  if (!validGram.includes(gLabel as GramLabel)) return null;

  const scores = (obj: Record<string, unknown>): Record<string, number> => {
    const s = obj.scores;
    if (s && typeof s === "object") {
      return Object.fromEntries(
        Object.entries(s as Record<string, unknown>).map(([k, v]) => [
          k,
          typeof v === "number" ? v : 0,
        ])
      );
    }
    return {};
  };

  return {
    morphology: {
      label: mLabel as MorphologyLabel,
      confidence: mConf,
      scores: scores(m),
    },
    gram_appearance: {
      label: gLabel as GramLabel,
      confidence: gConf,
      scores: scores(g),
    },
    model_version: (r.model_version as number | string | undefined) ?? "unknown",
  };
}

/**
 * Check if the model backend is reachable + has a loaded model.
 * Cached for a short time so we don't ping it on every request.
 */
let cachedReachable: { value: boolean; at: number } | null = null;
const REACHABLE_TTL_MS = 15_000;

export async function isModelReachable(): Promise<boolean> {
  const now = Date.now();
  if (cachedReachable && now - cachedReachable.at < REACHABLE_TTL_MS) {
    return cachedReachable.value;
  }
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2000);
    const res = await fetch(`${MODEL_URL}/health`, { signal: ctrl.signal });
    clearTimeout(t);
    const data = (await res.json()) as { model_ready?: boolean };
    const value = res.ok && data.model_ready === true;
    cachedReachable = { value, at: now };
    return value;
  } catch {
    cachedReachable = { value: false, at: now };
    return false;
  }
}

/**
 * Ask the model backend to classify an image.
 * `imageDataUrl` is a downscaled JPEG/PNG data URL the client sends alongside
 * its metrics. Returns null if the backend can't be reached or errors.
 */
export async function predictWithModel(
  imageDataUrl: string,
  fileName: string
): Promise<ModelPrediction | null> {
  try {
    // Convert the data URL to a Blob/File for multipart upload.
    const res = await fetch(imageDataUrl);
    const blob = await res.blob();

    const form = new FormData();
    form.append("file", blob, fileName);

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 20000);
    const resp = await fetch(`${MODEL_URL}/predict`, {
      method: "POST",
      body: form,
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!resp.ok) return null;
    const data = await resp.json();
    return coerceModelLabels(data);
  } catch {
    return null;
  }
}
