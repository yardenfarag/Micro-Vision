import {
  GRAM_DISPLAY,
  MORPHOLOGY_DISPLAY,
  type ArrangementLabel,
  type GramLabel,
  type MorphologyLabel,
  type ResultEducation,
} from "@/lib/taxonomy";

// Curated, hand-written educational content (spec section 7.9 + 16).
// Content is tied to morphology / arrangement / Gram class, never species.
// No LLM is used at runtime.

const GENERIC_DISCLAIMER =
  "This is educational interpretation only and not species-level identification.";

const morphologyInfo: Record<
  MorphologyLabel,
  { explanation: string; habitat: string }
> = {
  cocci: {
    explanation:
      "Cocci are spherical (round) bacteria. Their shape alone does not identify a species, but it narrows the morphology class.",
    habitat:
      "Cocci are widespread across skin, mucosal surfaces, soil, and water, and include both harmless and clinically relevant groups.",
  },
  bacilli: {
    explanation:
      "Bacilli are rod-shaped bacteria. Rod length and width vary, and shape alone does not determine the species.",
    habitat:
      "Rod-shaped bacteria are extremely common in soil, water, and the gut, spanning many unrelated groups.",
  },
  vibrio: {
    explanation:
      "Vibrio-type cells are short, curved (comma-shaped) rods. The gentle curve distinguishes them from straight bacilli.",
    habitat:
      "Curved rods are often associated with aquatic and marine environments.",
  },
  spirillum: {
    explanation:
      "Spirillum-type cells are spiral or helical in shape. The corkscrew form is the defining visual feature.",
    habitat:
      "Spiral bacteria occur in aquatic environments and some host-associated niches.",
  },
  mixed: {
    explanation:
      "The field appears to contain more than one obvious morphology (for example both round and rod-shaped cells).",
    habitat:
      "Mixed morphologies can reflect a polymicrobial sample or overlapping fields and usually warrant a fresh, well-spread preparation.",
  },
  unknown: {
    explanation:
      "A confident morphology could not be determined from this image. This is common with crowding, debris, or borderline quality.",
    habitat:
      "Re-imaging a thinner, well-stained smear at higher magnification often resolves ambiguous fields.",
  },
};

const arrangementInfo: Record<ArrangementLabel, string> = {
  single:
    "Cells appear mostly isolated rather than grouped, suggesting a single/dispersed arrangement.",
  pair:
    "Cells appear largely in twos (pairs / diplo- arrangement), where cells stay attached after dividing.",
  chain:
    "Cells appear linked end-to-end in line-like chains, typical of division along a single axis.",
  cluster:
    "Cells appear grouped in grape-like clumps or dense clusters rather than ordered lines.",
  mixed:
    "No single arrangement dominates; cells appear in a mix of singles, pairs, and groups.",
  unknown:
    "A confident arrangement could not be determined, often due to crowding or overlap.",
};

const gramInfo: Record<
  GramLabel,
  { explanation: string; tests: string[] }
> = {
  gram_positive_like: {
    explanation:
      "A Gram-positive-like appearance means the cells retain the crystal-violet stain and look purple/blue. This reflects a thick peptidoglycan cell wall.",
    tests: ["Gram stain", "culture", "catalase test", "coagulase test", "biochemical identification panels"],
  },
  gram_negative_like: {
    explanation:
      "A Gram-negative-like appearance means the cells lose the crystal violet and take up the safranin counterstain, looking pink/red. This reflects a thin peptidoglycan layer and an outer membrane.",
    tests: ["Gram stain", "culture", "oxidase test", "lactose fermentation", "biochemical identification panels"],
  },
  indeterminate: {
    explanation:
      "The stain color was not decisive enough to call Gram-positive-like vs Gram-negative-like from this image.",
    tests: ["Repeat Gram stain", "fresh smear preparation", "culture", "biochemical identification panels"],
  },
};

// Common, morphology+Gram-tied examples (kept general, taught as 'examples of
// this class', never as an identification of the uploaded sample).
function commonExamples(
  morphology: MorphologyLabel,
  gram: GramLabel
): string[] {
  const key = `${morphology}|${gram}`;
  const map: Record<string, string[]> = {
    "cocci|gram_positive_like": ["Staphylococcus spp.", "Streptococcus spp.", "Enterococcus spp."],
    "cocci|gram_negative_like": ["Neisseria spp.", "Moraxella spp."],
    "bacilli|gram_positive_like": ["Bacillus spp.", "Clostridium spp.", "Listeria spp."],
    "bacilli|gram_negative_like": ["Escherichia coli", "Salmonella spp.", "Pseudomonas spp."],
    "vibrio|gram_negative_like": ["Vibrio spp.", "Campylobacter spp. (curved)"],
    "spirillum|gram_negative_like": ["Spirillum spp.", "Helicobacter spp. (helical)"],
  };
  if (map[key]) return map[key];

  const byMorph: Record<MorphologyLabel, string[]> = {
    cocci: ["Round-celled groups such as staphylococci and streptococci"],
    bacilli: ["Rod-shaped groups such as enteric bacteria and Bacillus"],
    vibrio: ["Curved rods such as Vibrio"],
    spirillum: ["Spiral forms such as Spirillum"],
    mixed: ["A combination of round and rod-shaped groups"],
    unknown: ["Cannot list class examples without a clearer morphology"],
  };
  return byMorph[morphology];
}

function titleFor(
  morphology: MorphologyLabel,
  gram: GramLabel
): string {
  if (morphology === "unknown" && gram === "indeterminate") {
    return "Bacteria (morphology and Gram appearance unclear)";
  }
  const gramAdj =
    gram === "gram_positive_like"
      ? "Gram-positive-like"
      : gram === "gram_negative_like"
        ? "Gram-negative-like"
        : "Gram-indeterminate";
  return `${gramAdj} ${MORPHOLOGY_DISPLAY[morphology].toLowerCase()}`;
}

// A few fully-curated cards for the exact spec example keys take priority.
const SPECIFIC_CARDS: Record<string, Partial<ResultEducation>> = {
  "bacilli|single|gram_negative_like": {
    summary:
      "Rod-shaped bacteria with a Gram-negative-like staining appearance, mostly appearing as single rods.",
  },
  "cocci|cluster|gram_positive_like": {
    summary:
      "Round bacteria in grape-like clusters with a Gram-positive-like staining appearance.",
  },
  "cocci|chain|gram_positive_like": {
    summary:
      "Round bacteria arranged in chains with a Gram-positive-like staining appearance.",
  },
  "spirillum|unknown|indeterminate": {
    summary:
      "Spiral-shaped bacteria; arrangement and Gram appearance could not be confidently determined.",
  },
};

/**
 * Build an educational card using the fallback chain from spec section 16:
 *  1. exact morphology|arrangement|gram
 *  2. broader morphology|gram
 *  3. broader morphology
 *  4. generic bacteria fallback
 * In practice every level composes from the same curated parts, so the card is
 * always complete and never empty.
 */
export function getEducationCard(
  morphology: MorphologyLabel,
  arrangement: ArrangementLabel,
  gram: GramLabel
): ResultEducation {
  const exactKey = `${morphology}|${arrangement}|${gram}`;
  const morph = morphologyInfo[morphology];
  const gramData = gramInfo[gram];

  const summary =
    SPECIFIC_CARDS[exactKey]?.summary ??
    `${MORPHOLOGY_DISPLAY[morphology]} with a ${GRAM_DISPLAY[gram].toLowerCase()}.`;

  return {
    title: titleFor(morphology, gram),
    summary,
    morphology_explanation: morph.explanation,
    arrangement_explanation: arrangementInfo[arrangement],
    gram_explanation: gramData.explanation,
    common_examples: commonExamples(morphology, gram),
    common_tests: gramData.tests,
    habitat_notes: morph.habitat,
    disclaimer: GENERIC_DISCLAIMER,
  };
}
