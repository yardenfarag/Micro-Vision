import type { ImageMetrics } from "@/lib/imageMetrics";
import {
  stainKindToImageType,
  type ImageType,
  type StainKind,
  type SupportLabel,
} from "@/lib/taxonomy";

export interface SupportResult {
  label: SupportLabel;
  confidence: number;
  reason: string;
  stain?: StainKind;
  imageType: ImageType;
}

function looksLikeBacterialField(m: ImageMetrics): {
  ok: boolean;
  score: number;
  reason: string;
  darkField: boolean;
} {
  const stainFraction =
    m.purpleBlueFraction + m.pinkRedFraction + m.greenFraction + m.blueFraction;
  const hasStainColor = stainFraction > 0.12;
  const hasForeground = m.foregroundFraction > 0.04 && m.foregroundFraction < 0.97;
  const bigEnough = Math.min(m.width, m.height) >= 200;
  const looksFlat = m.saturation < 0.06;
  const darkField =
    m.underexposedFraction > 0.32 &&
    m.brightness < 0.42 &&
    m.contrast > 0.1 &&
    m.foregroundFraction > 0.03;

  let score = 0;
  if (hasStainColor) score += 0.5;
  else if (darkField) score += 0.35;
  if (hasForeground) score += 0.25;
  if (bigEnough) score += 0.15;
  if (!looksFlat) score += 0.1;
  if (m.purpleBlueFraction > 0.06 && m.pinkRedFraction > 0.06) score += 0.1;
  if (m.greenFraction > 0.08 && m.pinkRedFraction > 0.08) score += 0.08;
  if (m.pinkRedFraction > 0.08 && m.blueFraction > 0.1) score += 0.08;
  score = Math.max(0, Math.min(1, score));

  if (!bigEnough) {
    return { ok: false, score, reason: "Image resolution is too low to look like microscopy.", darkField };
  }
  if (looksFlat && !darkField) {
    return {
      ok: false,
      score,
      reason: "Image lacks the stained color profile of a bacterial microscopy field.",
      darkField,
    };
  }
  if (!hasStainColor && !darkField) {
    return {
      ok: false,
      score,
      reason: "Image lacks the stained color profile of a bacterial microscopy field.",
      darkField,
    };
  }

  return { ok: true, score, reason: "", darkField };
}

/**
 * Pick a stain class from hue bands. Order: spore (green is distinctive),
 * acid-fast (red on blue), capsule (dark field, weak chromatic stain), else Gram.
 * Capsule is conservative — only when the dark-field pattern is strong.
 */
export function classifyStainType(
  m: ImageMetrics,
  darkField: boolean
): { stain: StainKind; confidence: number } {
  const green = m.greenFraction;
  const pink = m.pinkRedFraction;
  const blue = m.blueFraction;
  const purple = m.purpleBlueFraction;
  const gramStain = purple + pink;

  // Schaeffer–Fulton: green spores on pink vegetative cells.
  if (green > 0.14 && pink > 0.08 && green > purple * 0.7) {
    const conf = Math.min(0.92, 0.62 + green * 0.5 + pink * 0.2);
    return { stain: "spore", confidence: round(conf) };
  }

  // Ziehl–Neelsen / Kinyoun: magenta/red rods on a blue counterstain.
  // Prefer this over Gram when true blue (not violet) is a major band.
  if (pink > 0.1 && blue > 0.12 && blue >= purple * 0.55) {
    const conf = Math.min(0.93, 0.6 + pink * 0.35 + blue * 0.3);
    return { stain: "acid_fast", confidence: round(conf) };
  }

  // India-ink / dark-field capsule: dark background, some cells, weak Gram hues.
  if (darkField && gramStain < 0.28 && green < 0.12) {
    return { stain: "capsule", confidence: round(0.55 + Math.min(0.25, m.underexposedFraction * 0.4)) };
  }

  return {
    stain: "gram",
    confidence: round(0.7 + Math.min(0.22, gramStain * 0.35)),
  };
}

// Heuristic support + stain-type classifier.
// A supported field is stained (or dark-field) bacterial light microscopy —
// Gram, acid-fast, endospore, or capsule stains. Photos, drawings, and
// screenshots usually fail the color / foreground checks.
export function classifySupport(m: ImageMetrics): SupportResult {
  const field = looksLikeBacterialField(m);

  if (!field.ok) {
    return {
      label: "unsupported",
      confidence: round(0.6 + (1 - field.score) * 0.35),
      reason: field.reason,
      imageType: "unsupported",
    };
  }

  const stain = classifyStainType(m, field.darkField);

  if (field.score >= 0.78) {
    return {
      label: "supported",
      confidence: round(Math.max(stain.confidence, 0.78 + field.score * 0.12)),
      reason: `Detected stained foreground consistent with ${stainLabel(stain.stain)} bacterial microscopy.`,
      stain: stain.stain,
      imageType: stainKindToImageType(stain.stain),
    };
  }

  return {
    label: "low_confidence",
    confidence: round(0.5 + field.score * 0.2),
    reason: "Some stain-like features detected, but the image may be borderline.",
    stain: stain.stain,
    imageType: stainKindToImageType(stain.stain),
  };
}

function stainLabel(stain: StainKind): string {
  switch (stain) {
    case "gram":
      return "Gram-stained";
    case "acid_fast":
      return "acid-fast-stained";
    case "spore":
      return "endospore-stained";
    case "capsule":
      return "capsule-stained";
  }
}

function round(x: number): number {
  return Math.round(Math.max(0, Math.min(0.99, x)) * 100) / 100;
}
