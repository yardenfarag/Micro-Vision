// Exact label taxonomy from MVP spec section 15, extended for special stains.
// These enums are the single source of truth across the whole app.

export const SUPPORTED_IMAGE_TYPES = [
  "gram_stain_bacteria",
  "acid_fast_stain",
  "spore_stain",
  "capsule_stain",
  "unsupported",
] as const;
export type ImageType = (typeof SUPPORTED_IMAGE_TYPES)[number];

export const STAIN_KINDS = ["gram", "acid_fast", "spore", "capsule"] as const;
export type StainKind = (typeof STAIN_KINDS)[number];

export const SUPPORT_LABELS = ["supported", "unsupported", "low_confidence"] as const;
export type SupportLabel = (typeof SUPPORT_LABELS)[number];

export const QUALITY_LABELS = ["usable", "usable_with_warning", "not_usable"] as const;
export type QualityLabel = (typeof QUALITY_LABELS)[number];

export const MORPHOLOGY_LABELS = [
  "cocci",
  "bacilli",
  "vibrio",
  "spirillum",
  "filamentous",
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

export const ACID_FAST_LABELS = [
  "acid_fast_positive_like",
  "acid_fast_negative_like",
  "indeterminate",
] as const;
export type AcidFastLabel = (typeof ACID_FAST_LABELS)[number];

export const SPORE_PRESENCE_LABELS = ["present", "absent", "indeterminate"] as const;
export type SporePresenceLabel = (typeof SPORE_PRESENCE_LABELS)[number];

export const SPORE_POSITION_LABELS = [
  "central",
  "terminal",
  "subterminal",
  "unknown",
] as const;
export type SporePositionLabel = (typeof SPORE_POSITION_LABELS)[number];

export const CAPSULE_PRESENCE_LABELS = ["present", "absent", "indeterminate"] as const;
export type CapsulePresenceLabel = (typeof CAPSULE_PRESENCE_LABELS)[number];

export const SEGMENTATION_MODES = ["instance", "cluster"] as const;
export type SegmentationMode = (typeof SEGMENTATION_MODES)[number];

export const COLOR_THEMES = [
  "purple_blue",
  "pink_red",
  "neutral_gray",
  "acid_fast_red",
  "spore_green",
  "capsule_halo",
] as const;
export type ColorTheme = (typeof COLOR_THEMES)[number];

// 3D template ids (spec section 17 + special-stain templates).
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
  "acid_fast_bacillus",
  "filamentous_branching",
  "bacillus_endospore_central",
  "bacillus_endospore_terminal",
  "encapsulated_coccus",
  "encapsulated_bacillus",
] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

// ---------- Human-readable display helpers ----------

export const IMAGE_TYPE_DISPLAY: Record<ImageType, string> = {
  gram_stain_bacteria: "Gram stain",
  acid_fast_stain: "Acid-fast stain",
  spore_stain: "Endospore stain",
  capsule_stain: "Capsule stain",
  unsupported: "Unsupported",
};

export const STAIN_DISPLAY: Record<StainKind, string> = {
  gram: "Gram stain",
  acid_fast: "Acid-fast stain",
  spore: "Endospore stain",
  capsule: "Capsule stain",
};

export const MORPHOLOGY_DISPLAY: Record<MorphologyLabel, string> = {
  cocci: "Cocci",
  bacilli: "Bacilli",
  vibrio: "Vibrio",
  spirillum: "Spirillum",
  filamentous: "Filamentous",
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

export const ACID_FAST_DISPLAY: Record<AcidFastLabel, string> = {
  acid_fast_positive_like: "Acid-fast-positive-like appearance",
  acid_fast_negative_like: "Acid-fast-negative-like appearance",
  indeterminate: "Indeterminate acid-fast appearance",
};

export const SPORE_PRESENCE_DISPLAY: Record<SporePresenceLabel, string> = {
  present: "Endospores present",
  absent: "Endospores not seen",
  indeterminate: "Endospore presence unclear",
};

export const SPORE_POSITION_DISPLAY: Record<SporePositionLabel, string> = {
  central: "Central",
  terminal: "Terminal",
  subterminal: "Subterminal",
  unknown: "Unknown",
};

export const CAPSULE_PRESENCE_DISPLAY: Record<CapsulePresenceLabel, string> = {
  present: "Capsule-like halo present",
  absent: "No capsule halo seen",
  indeterminate: "Capsule appearance unclear",
};

export const QUALITY_DISPLAY: Record<QualityLabel, string> = {
  usable: "Usable",
  usable_with_warning: "Usable (with warning)",
  not_usable: "Not usable",
};

// ---------- Result payload shape (spec section 10, stain-discriminated) ----------

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

interface ClassificationBase {
  stain: StainKind;
  morphology: LabeledResult<MorphologyLabel>;
}

export interface GramClassification extends ClassificationBase {
  stain: "gram";
  arrangement: LabeledResult<ArrangementLabel>;
  gram_appearance: LabeledResult<GramLabel>;
}

export interface AcidFastClassification extends ClassificationBase {
  stain: "acid_fast";
  arrangement: LabeledResult<ArrangementLabel>;
  acid_fast_appearance: LabeledResult<AcidFastLabel>;
}

export interface SporeClassification extends ClassificationBase {
  stain: "spore";
  spore_presence: LabeledResult<SporePresenceLabel>;
  spore_position: LabeledResult<SporePositionLabel>;
}

export interface CapsuleClassification extends ClassificationBase {
  stain: "capsule";
  arrangement: LabeledResult<ArrangementLabel>;
  capsule_presence: LabeledResult<CapsulePresenceLabel>;
}

export type ResultClassification =
  | GramClassification
  | AcidFastClassification
  | SporeClassification
  | CapsuleClassification;

export interface ResultViewer {
  template_id: TemplateId;
  color_theme: ColorTheme;
}

export interface ResultEducation {
  title: string;
  summary: string;
  morphology_explanation: string;
  arrangement_explanation: string;
  appearance_title: string;
  appearance_explanation: string;
  /** Extra structure (endospore, capsule, branching) when the stain/class shows one. */
  structure_explanation?: string;
  class_features: string[];
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
  /** Non-spec: which engine produced morphology + stain appearance. */
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

export function stainKindToImageType(stain: StainKind): ImageType {
  switch (stain) {
    case "gram":
      return "gram_stain_bacteria";
    case "acid_fast":
      return "acid_fast_stain";
    case "spore":
      return "spore_stain";
    case "capsule":
      return "capsule_stain";
  }
}

export const DISCLAIMER_TEXT =
  "This tool is for educational visualization only. It analyzes visible image features and shows a reference 3D model based on detected morphology. It does not provide species-level identification or medical diagnosis.";
