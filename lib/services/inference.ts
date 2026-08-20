import type { ImageMetrics } from "@/lib/imageMetrics";
import {
  type AcidFastLabel,
  type ArrangementLabel,
  type CapsulePresenceLabel,
  type GramLabel,
  type LabeledResult,
  type MorphologyLabel,
  type ResultClassification,
  type SegmentationMode,
  type SporePositionLabel,
  type SporePresenceLabel,
  type StainKind,
} from "@/lib/taxonomy";
import { confidenceFrom, mulberry32, weightedPick } from "./rng";

export interface InferenceResult {
  classification: ResultClassification;
  segmentation: { mode: SegmentationMode; confidence: number };
}

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

  const ratio = purple / total;
  const margin = Math.abs(ratio - 0.5) * 2;

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

function classifyAcidFast(
  m: ImageMetrics,
  rng: () => number
): LabeledResult<AcidFastLabel> {
  const red = m.pinkRedFraction;
  const blue = m.blueFraction;
  const total = red + blue;

  if (total < 0.1) {
    return { label: "indeterminate", confidence: confidenceFrom(rng, 0.3, 0.4, 0.65) };
  }

  const redShare = red / total;
  if (redShare > 0.38 && red > 0.08) {
    return {
      label: "acid_fast_positive_like",
      confidence: confidenceFrom(rng, 0.58 + Math.min(0.3, red * 0.5)),
      alternatives: [
        { label: "acid_fast_negative_like", confidence: confidenceFrom(rng, 0.18, 0.1, 0.35) },
      ],
    };
  }
  if (blue > red * 1.4) {
    return {
      label: "acid_fast_negative_like",
      confidence: confidenceFrom(rng, 0.52 + Math.min(0.28, blue * 0.4)),
      alternatives: [
        { label: "acid_fast_positive_like", confidence: confidenceFrom(rng, 0.18, 0.1, 0.35) },
      ],
    };
  }
  return { label: "indeterminate", confidence: confidenceFrom(rng, 0.38, 0.4, 0.68) };
}

function classifySporePresence(
  m: ImageMetrics,
  rng: () => number
): LabeledResult<SporePresenceLabel> {
  const green = m.greenFraction;
  const pink = m.pinkRedFraction;
  if (green > 0.16 && pink > 0.06) {
    return {
      label: "present",
      confidence: confidenceFrom(rng, 0.6 + Math.min(0.28, green * 0.5)),
      alternatives: [{ label: "absent", confidence: confidenceFrom(rng, 0.15, 0.08, 0.3) }],
    };
  }
  if (green < 0.06) {
    return {
      label: "absent",
      confidence: confidenceFrom(rng, 0.5, 0.4, 0.75),
    };
  }
  return { label: "indeterminate", confidence: confidenceFrom(rng, 0.4, 0.38, 0.65) };
}

function classifySporePosition(
  presence: SporePresenceLabel,
  rng: () => number
): LabeledResult<SporePositionLabel> {
  if (presence !== "present") {
    return { label: "unknown", confidence: confidenceFrom(rng, 0.35, 0.35, 0.6) };
  }
  const label = weightedPick<SporePositionLabel>(rng, [
    ["central", 0.42],
    ["terminal", 0.28],
    ["subterminal", 0.18],
    ["unknown", 0.12],
  ]);
  return {
    label,
    confidence: confidenceFrom(rng, label === "unknown" ? 0.32 : 0.58),
  };
}

function classifyCapsule(
  m: ImageMetrics,
  rng: () => number
): LabeledResult<CapsulePresenceLabel> {
  const dark =
    m.underexposedFraction > 0.32 && m.brightness < 0.42 && m.contrast > 0.1;
  if (dark && m.foregroundFraction > 0.04 && m.foregroundFraction < 0.55) {
    return {
      label: "present",
      confidence: confidenceFrom(rng, 0.52 + Math.min(0.22, m.underexposedFraction * 0.3), 0.45, 0.82),
      alternatives: [
        { label: "indeterminate", confidence: confidenceFrom(rng, 0.22, 0.12, 0.4) },
      ],
    };
  }
  return {
    label: "indeterminate",
    confidence: confidenceFrom(rng, 0.36, 0.35, 0.6),
  };
}

function classifyMorphology(
  m: ImageMetrics,
  stain: StainKind,
  rng: () => number
): LabeledResult<MorphologyLabel> {
  const elongated = m.elongationScore > 0.55;
  let weights: [MorphologyLabel, number][];

  if (stain === "acid_fast") {
    weights = [
      ["bacilli", elongated ? 0.48 : 0.62],
      ["filamentous", elongated ? 0.32 : 0.16],
      ["mixed", 0.08],
      ["unknown", 0.08],
      ["cocci", 0.06],
      ["vibrio", 0],
      ["spirillum", 0],
    ];
  } else if (stain === "spore") {
    weights = [
      ["bacilli", 0.78],
      ["filamentous", 0.06],
      ["mixed", 0.06],
      ["unknown", 0.1],
      ["cocci", 0],
      ["vibrio", 0],
      ["spirillum", 0],
    ];
  } else if (stain === "capsule") {
    weights = [
      ["cocci", 0.42],
      ["bacilli", 0.38],
      ["mixed", 0.08],
      ["unknown", 0.08],
      ["filamentous", 0.04],
      ["vibrio", 0],
      ["spirillum", 0],
    ];
  } else {
    weights = [
      ["cocci", 0.3],
      ["bacilli", 0.3],
      ["filamentous", elongated ? 0.16 : 0.06],
      ["vibrio", 0.1],
      ["spirillum", 0.08],
      ["mixed", 0.08],
      ["unknown", 0.06],
    ];
  }

  const label = weightedPick<MorphologyLabel>(rng, weights);
  const base = label === "unknown" ? 0.25 : elongated && label === "filamentous" ? 0.62 : 0.7;
  const main = confidenceFrom(rng, base);

  const others = (
    ["cocci", "bacilli", "vibrio", "spirillum", "filamentous"] as MorphologyLabel[]
  ).filter((l) => l !== label);
  const alt = others[Math.floor(rng() * others.length)];

  return {
    label,
    confidence: label === "filamentous" && !elongated ? Math.min(main, 0.58) : main,
    alternatives: [{ label: alt, confidence: confidenceFrom(rng, 0.25, 0.08, Math.max(0.1, main - 0.1)) }],
  };
}

function classifyArrangement(
  m: ImageMetrics,
  morphology: MorphologyLabel,
  rng: () => number
): LabeledResult<ArrangementLabel> {
  const dense = m.foregroundFraction > 0.45;

  let weights: [ArrangementLabel, number][];
  if (morphology === "filamentous") {
    weights = [
      ["single", 0.22],
      ["cluster", dense ? 0.28 : 0.16],
      ["mixed", 0.22],
      ["unknown", 0.22],
      ["chain", 0.08],
      ["pair", 0.04],
    ];
  } else if (morphology === "cocci") {
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
  const mode: SegmentationMode = m.foregroundFraction > 0.4 ? "cluster" : "instance";
  const base = mode === "cluster" ? 0.72 : 0.66;
  return { mode, confidence: confidenceFrom(rng, base) };
}

export function runInference(m: ImageMetrics, stain: StainKind): InferenceResult {
  const rng = mulberry32(m.signature || 1);
  const morphology = classifyMorphology(m, stain, rng);
  const arrangement = classifyArrangement(m, morphology.label, rng);
  const segmentation = segmentationFor(m, rng);

  if (stain === "acid_fast") {
    return {
      classification: {
        stain: "acid_fast",
        morphology,
        arrangement,
        acid_fast_appearance: classifyAcidFast(m, rng),
      },
      segmentation,
    };
  }

  if (stain === "spore") {
    const spore_presence = classifySporePresence(m, rng);
    return {
      classification: {
        stain: "spore",
        morphology,
        spore_presence,
        spore_position: classifySporePosition(spore_presence.label, rng),
      },
      segmentation,
    };
  }

  if (stain === "capsule") {
    return {
      classification: {
        stain: "capsule",
        morphology,
        arrangement,
        capsule_presence: classifyCapsule(m, rng),
      },
      segmentation,
    };
  }

  return {
    classification: {
      stain: "gram",
      morphology,
      arrangement,
      gram_appearance: classifyGram(m, rng),
    },
    segmentation,
  };
}
