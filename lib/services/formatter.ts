import type { ImageMetrics } from "@/lib/imageMetrics";
import {
  type AnalysisResult,
  type LabeledResult,
  type MorphologyLabel,
  type GramLabel,
  type PipelineStatus,
  type ResultInput,
} from "@/lib/taxonomy";
import { getEducationCard } from "@/lib/content/education";
import { classifySupport } from "./supportClassifier";
import { checkQuality } from "./qualityChecker";
import { runInference } from "./inference";
import { selectColorTheme, selectTemplate } from "./templateSelector";
import type { ModelPrediction } from "./modelClient";

export interface PipelineOutput {
  status: PipelineStatus;
  result?: AnalysisResult;
  input: ResultInput;
  message?: string;
}

export interface PipelineOptions {
  /** Optional model prediction; overrides heuristic morphology + Gram. */
  model?: ModelPrediction | null;
}

// Orchestrates the full analysis pipeline and assembles the spec section 10
// JSON. Gating rules (spec steps 4-5): unsupported -> stop; not_usable -> stop.
// When a model prediction is provided, morphology + Gram come from the trained
// model; arrangement and segmentation remain heuristic (DIBaS has no labels for
// those).
export function runPipeline(
  fileName: string,
  metrics: ImageMetrics,
  options: PipelineOptions = {}
): PipelineOutput {
  const support = classifySupport(metrics);
  const quality = checkQuality(metrics);

  const input: ResultInput = {
    file_name: fileName,
    image_type: support.label === "supported" ? "gram_stain_bacteria" : "unsupported",
    supported: support.label === "supported",
    support_confidence: support.confidence,
    quality: quality.label,
    quality_score: quality.score,
    quality_warnings: quality.warnings,
  };

  // Gate 1: image outside MVP scope.
  if (support.label !== "supported") {
    return {
      status: "unsupported",
      input,
      message:
        "This MVP currently supports Gram-stained bacterial microscope images only.",
    };
  }

  // Gate 2: image quality too poor to analyze.
  if (quality.label === "not_usable") {
    return {
      status: "not_usable",
      input,
      message:
        "This image is too low quality to analyze. Try a sharper, well-exposed Gram-stained field.",
    };
  }

  const heuristic = runInference(metrics);

  let morphology: LabeledResult<MorphologyLabel> = heuristic.morphology;
  let gram = heuristic.gram;
  let modelUsed = false;
  if (options.model) {
    morphology = options.model.morphology;
    gram = options.model.gram_appearance;
    modelUsed = true;
  }
  const arrangement = heuristic.arrangement;
  const morphologyLabel = morphology.label;
  const arrangementLabel = arrangement.label;
  const gramLabel = gram.label;

  const result: AnalysisResult = {
    status: "success",
    input,
    segmentation: {
      mode: heuristic.segmentation.mode,
      mask_url: null, // overlay is rendered client-side from the original image
      confidence: heuristic.segmentation.confidence,
    },
    classification: {
      morphology,
      arrangement,
      gram_appearance: gram,
    },
    viewer: {
      template_id: selectTemplate(morphologyLabel, arrangementLabel),
      color_theme: selectColorTheme(gramLabel),
    },
    education: getEducationCard(morphologyLabel, arrangementLabel, gramLabel),
    _source: modelUsed ? "model" : "heuristic",
  };

  return { status: "success", input, result };
}

// Re-export for type usage in the route.
export type { GramLabel, MorphologyLabel };
