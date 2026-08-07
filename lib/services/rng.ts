// Tiny deterministic PRNG (mulberry32). Seeded from an image signature so the
// same image always produces the same mock classification.

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Weighted pick from a list of [value, weight] pairs using rng() in [0,1). */
export function weightedPick<T>(rng: () => number, choices: [T, number][]): T {
  const total = choices.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [value, weight] of choices) {
    r -= weight;
    if (r <= 0) return value;
  }
  return choices[choices.length - 1][0];
}

/** Map a 0..1 value into a confidence band with small deterministic jitter. */
export function confidenceFrom(
  rng: () => number,
  base: number,
  min = 0.55,
  max = 0.97
): number {
  const jitter = (rng() - 0.5) * 0.06;
  const v = min + (max - min) * base + jitter;
  return Math.round(Math.max(min, Math.min(max, v)) * 100) / 100;
}
