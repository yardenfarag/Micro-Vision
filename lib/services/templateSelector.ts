import {
  type ArrangementLabel,
  type ColorTheme,
  type MorphologyLabel,
  type ResultClassification,
  type TemplateId,
} from "@/lib/taxonomy";

function gramTemplate(
  morphology: MorphologyLabel,
  arrangement: ArrangementLabel
): TemplateId {
  if (morphology === "filamentous") return "filamentous_branching";
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

  switch (arrangement) {
    case "cluster":
      return "bacillus_cluster";
    case "single":
    default:
      return "bacillus_single";
  }
}

export function selectTemplate(classification: ResultClassification): TemplateId {
  const morph = classification.morphology.label;

  switch (classification.stain) {
    case "acid_fast":
      if (morph === "filamentous") return "filamentous_branching";
      return "acid_fast_bacillus";
    case "spore": {
      if (classification.spore_presence.label !== "present") {
        return morph === "filamentous" ? "filamentous_branching" : "bacillus_single";
      }
      return classification.spore_position.label === "terminal"
        ? "bacillus_endospore_terminal"
        : "bacillus_endospore_central";
    }
    case "capsule":
      if (classification.capsule_presence.label !== "present") {
        return gramTemplate(morph, classification.arrangement.label);
      }
      return morph === "cocci" ? "encapsulated_coccus" : "encapsulated_bacillus";
    case "gram":
      return gramTemplate(morph, classification.arrangement.label);
  }
}

export function selectColorTheme(classification: ResultClassification): ColorTheme {
  switch (classification.stain) {
    case "acid_fast":
      return classification.acid_fast_appearance.label === "acid_fast_negative_like"
        ? "neutral_gray"
        : "acid_fast_red";
    case "spore":
      return "spore_green";
    case "capsule":
      return "capsule_halo";
    case "gram":
      switch (classification.gram_appearance.label) {
        case "gram_positive_like":
          return "purple_blue";
        case "gram_negative_like":
          return "pink_red";
        default:
          return "neutral_gray";
      }
  }
}
