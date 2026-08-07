// Exact label taxonomy from MVP spec section 15.
// These enums are the single source of truth across the whole app.

export const SUPPORTED_IMAGE_TYPES = ["gram_stain_bacteria", "unsupported"] as const;
export type ImageType = (typeof SUPPORTED_IMAGE_TYPES)[number];

export const SUPPORT_LABELS = ["supported", "unsupported", "low_confidence"] as const;
export type SupportLabel = (typeof SUPPORT_LABELS)[number];

export const QUALITY_LABELS = ["usable", "usable_with_warning", "not_usable"] as const;
export type QualityLabel = (typeof QUALITY_LABELS)[number];

export const MORPHOLOGY_LABELS = [
  "cocci",
  "bacilli",
  "vibrio",
  "spirillum",
  "mixed",
  "unknown",
] as const;
export type MorphologyLabel = (typeof MORPHOLOGY_LABELS)[number];

export const ARRANGEMENT_LABELS = [
  "single",
  "pair",
  "chain",
  "cluster",
  "mixed",
  "unknown",
] as const;
export type ArrangementLabel = (typeof ARRANGEMENT_LABELS)[number];

export const GRAM_LABELS = [
  "gram_positive_like",
  "gram_negative_like",
  "indeterminate",
] as const;
export type GramLabel = (typeof GRAM_LABELS)[number];

export const SEGMENTATION_MODES = ["instance", "cluster"] as const;
export type SegmentationMode = (typeof SEGMENTATION_MODES)[number];

export const COLOR_THEMES = ["purple_blue", "pink_red", "neutral_gray"] as const;
export type ColorTheme = (typeof COLOR_THEMES)[number];

// 3D template ids (spec section 17).
export const TEMPLATE_IDS = [
  "cocci_single",
  "cocci_pair",
  "cocci_chain",
  "cocci_cluster",
  "bacillus_single",
  "bacillus_cluster",
  "vibrio_single",
  "spirillum_single",
  "mixed_bacteria_scene",
  "generic_bacteria",
] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

// ---------- Human-readable display helpers ----------

export const MORPHOLOGY_DISPLAY: Record<MorphologyLabel, string> = {
  cocci: "Cocci",
  bacilli: "Bacilli",
  vibrio: "Vibrio",
  spirillum: "Spirillum",
  mixed: "Mixed",
  unknown: "Unknown",
};

export const ARRANGEMENT_DISPLAY: Record<ArrangementLabel, string> = {
  single: "Single",
  pair: "Pair",
  chain: "Chain",
  cluster: "Cluster",
  mixed: "Mixed",
  unknown: "Unknown",
};

export const GRAM_DISPLAY: Record<GramLabel, string> = {
  gram_positive_like: "Gram-positive-like appearance",
  gram_negative_like: "Gram-negative-like appearance",
  indeterminate: "Indeterminate Gram appearance",
};

export const QUALITY_DISPLAY: Record<QualityLabel, string> = {
  usable: "Usable",
  usable_with_warning: "Usable (with warning)",
  not_usable: "Not usable",
};

// ---------- Result payload shape (spec section 10) ----------

export type PipelineStatus = "success" | "unsupported" | "not_usable" | "error";

export interface ResultInput {
  file_name: string;
  image_type: ImageType;
  supported: boolean;
  support_confidence: number;
  quality: QualityLabel;
  quality_score: number;
  quality_warnings: string[];
}

export interface ResultSegmentation {
  mode: SegmentationMode;
  mask_url: string | null;
  confidence: number;
}

export interface LabeledResult<T extends string> {
  label: T;
  confidence: number;
  alternatives?: { label: T; confidence: number }[];
}

export interface ResultClassification {
  morphology: LabeledResult<MorphologyLabel>;
  arrangement: LabeledResult<ArrangementLabel>;
  gram_appearance: LabeledResult<GramLabel>;
}

export interface ResultViewer {
  template_id: TemplateId;
  color_theme: ColorTheme;
}

export interface ResultEducation {
  title: string;
  summary: string;
  morphology_explanation: string;
  arrangement_explanation: string;
  gram_explanation: string;
  common_examples: string[];
  common_tests: string[];
  habitat_notes: string;
  disclaimer: string;
}

export interface AnalysisResult {
  status: "success";
  input: ResultInput;
  segmentation: ResultSegmentation;
  classification: ResultClassification;
  viewer: ResultViewer;
  education: ResultEducation;
  /** Non-spec: which engine produced morphology + Gram. */
  _source?: "model" | "heuristic";
}

// Response from /api/analyze
export interface AnalyzeResponse {
  status: PipelineStatus;
  job_id?: string;
  result?: AnalysisResult;
  message?: string;
  input?: ResultInput;
}

export const DISCLAIMER_TEXT =
  "This tool is for educational visualization only. It analyzes visible image features and shows a reference 3D model based on detected morphology. It does not provide species-level identification or medical diagnosis.";
