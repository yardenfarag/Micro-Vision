import type { ImageMetrics } from "@/lib/imageMetrics";
import type { SupportLabel } from "@/lib/taxonomy";

export interface SupportResult {
  label: SupportLabel;
  confidence: number;
  reason: string;
}

// MVP heuristic support classifier (spec 7.2 / 13.1).
// A Gram-stained bacterial microscopy field typically has: meaningful stained
// color (purple/violet and/or pink/red), a non-trivial colored foreground over
// a brighter background, and enough resolution. Photos of objects, line
// drawings, and screenshots usually fail one of these.
export function classifySupport(m: ImageMetrics): SupportResult {
  const stainFraction = m.purpleBlueFraction + m.pinkRedFraction;
  const hasStainColor = stainFraction > 0.12;
  const hasForeground = m.foregroundFraction > 0.04 && m.foregroundFraction < 0.97;
  const bigEnough = Math.min(m.width, m.height) >= 200;

  // Count concentration of hues into the stain bands; flat/cartoon images tend
  // to have very few dominant hues or near-zero saturation.
  const looksFlat = m.saturation < 0.06;

  let score = 0;
  if (hasStainColor) score += 0.5;
  if (hasForeground) score += 0.25;
  if (bigEnough) score += 0.15;
  if (!looksFlat) score += 0.1;

  // Strong pink+purple presence is the most discriminative signal.
  if (m.purpleBlueFraction > 0.06 && m.pinkRedFraction > 0.06) score += 0.1;

  score = Math.max(0, Math.min(1, score));

  if (!hasStainColor || looksFlat || !bigEnough) {
    return {
      label: "unsupported",
      confidence: round(0.6 + (1 - score) * 0.35),
      reason: !bigEnough
        ? "Image resolution is too low to look like microscopy."
        : "Image lacks the stained color profile of a Gram-stained microscopy field.",
    };
  }

  if (score >= 0.78) {
    return {
      label: "supported",
      confidence: round(0.78 + score * 0.18),
      reason: "Detected stained foreground consistent with Gram-stained bacterial microscopy.",
    };
  }

  return {
    label: "low_confidence",
    confidence: round(0.5 + score * 0.2),
    reason: "Some stain-like features detected, but the image may be borderline.",
  };
}

function round(x: number): number {
  return Math.round(Math.max(0, Math.min(0.99, x)) * 100) / 100;
}
