import type { ImageMetrics } from "@/lib/imageMetrics";
import {
  type ArrangementLabel,
  type GramLabel,
  type LabeledResult,
  type MorphologyLabel,
  type SegmentationMode,
} from "@/lib/taxonomy";
import { confidenceFrom, mulberry32, weightedPick } from "./rng";

export interface InferenceResult {
  morphology: LabeledResult<MorphologyLabel>;
  arrangement: LabeledResult<ArrangementLabel>;
  gram: LabeledResult<GramLabel>;
  segmentation: { mode: SegmentationMode; confidence: number };
}

// Gram appearance is the one genuinely image-derived label: it comes from the
// dominant stain hue (spec 7.7). Purple/violet -> positive-like, pink/red ->
// negative-like, ambiguous -> indeterminate.
function classifyGram(
  m: ImageMetrics,
  rng: () => number
): LabeledResult<GramLabel> {
  const purple = m.purpleBlueFraction;
  const pink = m.pinkRedFraction;
  const total = purple + pink;

  if (total < 0.08) {
    return { label: "indeterminate", confidence: confidenceFrom(rng, 0.3, 0.45, 0.7) };
  }

  const ratio = purple / total; // 1 => fully purple, 0 => fully pink
  const margin = Math.abs(ratio - 0.5) * 2; // 0 (tie) .. 1 (decisive)

  if (margin < 0.18) {
    return {
      label: "indeterminate",
      confidence: confidenceFrom(rng, 0.35, 0.45, 0.7),
    };
  }

  if (ratio > 0.5) {
    return {
      label: "gram_positive_like",
      confidence: confidenceFrom(rng, 0.55 + margin * 0.4),
      alternatives: [
        { label: "gram_negative_like", confidence: confidenceFrom(rng, 0.2, 0.1, 0.4) },
      ],
    };
  }
  return {
    label: "gram_negative_like",
    confidence: confidenceFrom(rng, 0.55 + margin * 0.4),
    alternatives: [
      { label: "gram_positive_like", confidence: confidenceFrom(rng, 0.2, 0.1, 0.4) },
    ],
  };
}

// Morphology + arrangement are mock for Phase 1: deterministic from the image
// signature so a given image is stable, lightly steered by simple metrics
// (e.g. dense foreground biases toward cluster). Not a trained model.
function classifyMorphology(
  rng: () => number
): LabeledResult<MorphologyLabel> {
  const label = weightedPick<MorphologyLabel>(rng, [
    ["cocci", 0.34],
    ["bacilli", 0.34],
    ["vibrio", 0.1],
    ["spirillum", 0.08],
    ["mixed", 0.08],
    ["unknown", 0.06],
  ]);

  const base = label === "unknown" ? 0.25 : 0.7;
  const main = confidenceFrom(rng, base);

  const others = (
    ["cocci", "bacilli", "vibrio", "spirillum"] as MorphologyLabel[]
  ).filter((l) => l !== label);
  const alt = others[Math.floor(rng() * others.length)];

  return {
    label,
    confidence: main,
    alternatives: [{ label: alt, confidence: confidenceFrom(rng, 0.25, 0.08, Math.max(0.1, main - 0.1)) }],
  };
}

function classifyArrangement(
  m: ImageMetrics,
  morphology: MorphologyLabel,
  rng: () => number
): LabeledResult<ArrangementLabel> {
  const dense = m.foregroundFraction > 0.45;

  // Bias arrangement weights using density and morphology.
  let weights: [ArrangementLabel, number][];
  if (morphology === "cocci") {
    weights = [
      ["single", dense ? 0.12 : 0.28],
      ["pair", 0.2],
      ["chain", 0.2],
      ["cluster", dense ? 0.34 : 0.22],
      ["mixed", 0.06],
      ["unknown", 0.04],
    ];
  } else if (morphology === "bacilli") {
    weights = [
      ["single", dense ? 0.22 : 0.42],
      ["pair", 0.12],
      ["chain", 0.16],
      ["cluster", dense ? 0.3 : 0.16],
      ["mixed", 0.08],
      ["unknown", 0.04],
    ];
  } else {
    weights = [
      ["single", 0.5],
      ["pair", 0.08],
      ["chain", 0.08],
      ["cluster", 0.14],
      ["mixed", 0.1],
      ["unknown", 0.1],
    ];
  }

  const label = weightedPick<ArrangementLabel>(rng, weights);
  const base = label === "unknown" ? 0.28 : 0.62;
  return { label, confidence: confidenceFrom(rng, base) };
}

function segmentationFor(
  m: ImageMetrics,
  rng: () => number
): { mode: SegmentationMode; confidence: number } {
  // Dense fields are segmented as clusters/regions; sparser ones as instances
  // (spec 7.4).
  const mode: SegmentationMode = m.foregroundFraction > 0.4 ? "cluster" : "instance";
  const base = mode === "cluster" ? 0.72 : 0.66;
  return { mode, confidence: confidenceFrom(rng, base) };
}

export function runInference(m: ImageMetrics): InferenceResult {
  const rng = mulberry32(m.signature || 1);
  const gram = classifyGram(m, rng);
  const morphology = classifyMorphology(rng);
  const arrangement = classifyArrangement(m, morphology.label, rng);
  const segmentation = segmentationFor(m, rng);
  return { morphology, arrangement, gram, segmentation };
}
