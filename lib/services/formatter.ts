import type { ImageMetrics } from "@/lib/imageMetrics";
import {
  type AnalysisResult,
  type MorphologyLabel,
  type PipelineStatus,
  type ResultClassification,
  type ResultInput,
  type StainKind,
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
  /** Optional model prediction; overrides heuristic morphology + Gram on Gram stains only. */
  model?: ModelPrediction | null;
}

function applyGramModel(
  classification: ResultClassification,
  model: ModelPrediction
): ResultClassification {
  if (classification.stain !== "gram") return classification;
  return {
    ...classification,
    morphology: {
      label: model.morphology.label,
      confidence: model.morphology.confidence,
    },
    gram_appearance: {
      label: model.gram_appearance.label,
      confidence: model.gram_appearance.confidence,
    },
  };
}

// Orchestrates the full analysis pipeline and assembles the result JSON.
// Gating: unsupported -> stop; not_usable -> stop.
// The trained model is Gram-only (DIBaS); other stains stay heuristic.
export function runPipeline(
  fileName: string,
  metrics: ImageMetrics,
  options: PipelineOptions = {}
): PipelineOutput {
  const support = classifySupport(metrics);
  const quality = checkQuality(metrics);
  const stain: StainKind | undefined = support.stain;

  const input: ResultInput = {
    file_name: fileName,
    image_type: support.imageType,
    supported: support.label === "supported",
    support_confidence: support.confidence,
    quality: quality.label,
    quality_score: quality.score,
    quality_warnings: quality.warnings,
  };

  if (support.label !== "supported" || !stain) {
    return {
      status: "unsupported",
      input,
      message:
        "This tool currently supports bacterial light-microscopy stains (Gram, acid-fast, endospore, or capsule). Drawings, EM/fluorescence, fungi, parasites, and regular photos are out of scope.",
    };
  }

  if (quality.label === "not_usable") {
    return {
      status: "not_usable",
      input,
      message:
        "This image is too low quality to analyze. Try a sharper, well-exposed stained microscopy field.",
    };
  }

  const heuristic = runInference(metrics, stain);
  let classification = heuristic.classification;
  let modelUsed = false;
  if (stain === "gram" && options.model) {
    classification = applyGramModel(classification, options.model);
    modelUsed = true;
  }

  const result: AnalysisResult = {
    status: "success",
    input,
    segmentation: {
      mode: heuristic.segmentation.mode,
      mask_url: null,
      confidence: heuristic.segmentation.confidence,
    },
    classification,
    viewer: {
      template_id: selectTemplate(classification),
      color_theme: selectColorTheme(classification),
    },
    education: getEducationCard(classification),
    _source: modelUsed ? "model" : "heuristic",
  };

  return { status: "success", input, result };
}

export type { MorphologyLabel };
