import {
  type ArrangementLabel,
  type ColorTheme,
  type GramLabel,
  type MorphologyLabel,
  type TemplateId,
} from "@/lib/taxonomy";

// Map morphology + arrangement to a 3D template id (spec section 17).
export function selectTemplate(
  morphology: MorphologyLabel,
  arrangement: ArrangementLabel
): TemplateId {
  if (morphology === "mixed") return "mixed_bacteria_scene";
  if (morphology === "unknown") return "generic_bacteria";
  if (morphology === "vibrio") return "vibrio_single";
  if (morphology === "spirillum") return "spirillum_single";

  if (morphology === "cocci") {
    switch (arrangement) {
      case "single":
        return "cocci_single";
      case "pair":
        return "cocci_pair";
      case "chain":
        return "cocci_chain";
      case "cluster":
        return "cocci_cluster";
      default:
        return "cocci_cluster";
    }
  }

  // bacilli
  switch (arrangement) {
    case "cluster":
      return "bacillus_cluster";
    case "single":
    default:
      return "bacillus_single";
  }
}

// Map Gram appearance to a color theme (spec section 17).
export function selectColorTheme(gram: GramLabel): ColorTheme {
  switch (gram) {
    case "gram_positive_like":
      return "purple_blue";
    case "gram_negative_like":
      return "pink_red";
    default:
      return "neutral_gray";
  }
}
