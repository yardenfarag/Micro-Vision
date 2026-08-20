import type { ImageMetrics } from "@/lib/imageMetrics";
import type { QualityLabel } from "@/lib/taxonomy";

export interface QualityResult {
  label: QualityLabel;
  score: number;
  warnings: string[];
}

// Rule-based quality checker (spec 7.3 / 13.2). Returns a 0..1 score plus a
// list of warning tags. Hard failures push the label to not_usable.
export function checkQuality(m: ImageMetrics): QualityResult {
  const warnings: string[] = [];
  let score = 1;

  // --- Blur / sharpness ---
  if (m.sharpness < 0.06) {
    warnings.push("severe_blur");
    score -= 0.45;
  } else if (m.sharpness < 0.16) {
    warnings.push("slight_blur");
    score -= 0.18;
  }

  // --- Contrast ---
  if (m.contrast < 0.08) {
    warnings.push("low_contrast");
    score -= 0.3;
  } else if (m.contrast < 0.16) {
    warnings.push("slightly_low_contrast");
    score -= 0.1;
  }

  // --- Exposure ---
  if (m.brightness > 0.9 || m.overexposedFraction > 0.45) {
    warnings.push("overexposed");
    score -= 0.3;
  } else if (m.overexposedFraction > 0.2) {
    warnings.push("slightly_overexposed");
    score -= 0.1;
  }

  // Dark-field / India-ink capsule stains are supposed to look dark; treat
  // them as a background warning instead of a hard exposure failure.
  const darkField =
    m.contrast > 0.12 && m.foregroundFraction > 0.04 && m.brightness < 0.42;

  if (m.brightness < 0.12 || m.underexposedFraction > 0.55) {
    if (darkField) {
      warnings.push("dark_field_background");
      score -= 0.1;
    } else {
      warnings.push("underexposed");
      score -= 0.3;
    }
  } else if (m.underexposedFraction > 0.3) {
    warnings.push("slightly_underexposed");
    score -= 0.1;
  }

  // --- Resolution ---
  const minDim = Math.min(m.width, m.height);
  if (minDim < 256) {
    warnings.push("low_resolution");
    score -= 0.25;
  } else if (minDim < 512) {
    warnings.push("below_preferred_resolution");
    score -= 0.08;
  }

  score = Math.max(0, Math.min(1, score));

  const hardFail =
    warnings.includes("severe_blur") ||
    warnings.includes("low_contrast") ||
    warnings.includes("overexposed") ||
    warnings.includes("underexposed") ||
    score < 0.4;

  let label: QualityLabel;
  if (hardFail) label = "not_usable";
  else if (warnings.length > 0 || score < 0.85) label = "usable_with_warning";
  else label = "usable";

  return { label, score: Math.round(score * 100) / 100, warnings };
}
