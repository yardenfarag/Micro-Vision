import {
  GRAM_DISPLAY,
  MORPHOLOGY_DISPLAY,
  SPORE_POSITION_DISPLAY,
  type ArrangementLabel,
  type GramLabel,
  type MorphologyLabel,
  type ResultClassification,
  type ResultEducation,
} from "@/lib/taxonomy";

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
  filamentous: {
    explanation:
      "Filamentous bacteria form long, thread-like cells that may branch. Branching filaments are a morphology class, not a species call.",
    habitat:
      "Filamentous forms occur in soil, decaying organic matter, and some host-associated niches.",
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

const gramInfo: Record<GramLabel, { explanation: string; tests: string[] }> = {
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
    "filamentous|gram_positive_like": ["Branching Gram-positive filamentous rods (class example)"],
    "filamentous|gram_negative_like": ["Filamentous rods with a Gram-negative-like appearance (class example)"],
    "filamentous|indeterminate": ["Filamentous / branching bacterial forms (class example)"],
  };
  if (map[key]) return map[key];

  const byMorph: Record<MorphologyLabel, string[]> = {
    cocci: ["Round-celled groups such as staphylococci and streptococci"],
    bacilli: ["Rod-shaped groups such as enteric bacteria and Bacillus"],
    vibrio: ["Curved rods such as Vibrio"],
    spirillum: ["Spiral forms such as Spirillum"],
    filamentous: ["Branching filamentous bacterial forms"],
    mixed: ["A combination of round and rod-shaped groups"],
    unknown: ["Cannot list class examples without a clearer morphology"],
  };
  return byMorph[morphology];
}

function gramClassFeatures(
  morphology: MorphologyLabel,
  arrangement: ArrangementLabel
): string[] {
  const features: string[] = [];
  if (morphology === "cocci") features.push("spherical cells");
  if (morphology === "bacilli") features.push("straight rods");
  if (morphology === "vibrio") features.push("comma-shaped curve");
  if (morphology === "spirillum") features.push("helical / corkscrew axis");
  if (morphology === "filamentous") features.push("long branching filaments");
  if (arrangement === "cluster") features.push("irregular clumps");
  if (arrangement === "chain") features.push("end-to-end chains");
  if (arrangement === "pair") features.push("cells in twos");
  if (features.length === 0) features.push("stained bacterial cells");
  return features;
}

function titleForGram(morphology: MorphologyLabel, gram: GramLabel): string {
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

const SPECIFIC_CARDS: Record<string, string> = {
  "bacilli|single|gram_negative_like":
    "Rod-shaped bacteria with a Gram-negative-like staining appearance, mostly appearing as single rods.",
  "cocci|cluster|gram_positive_like":
    "Round bacteria in grape-like clusters with a Gram-positive-like staining appearance.",
  "cocci|chain|gram_positive_like":
    "Round bacteria arranged in chains with a Gram-positive-like staining appearance.",
  "spirillum|unknown|indeterminate":
    "Spiral-shaped bacteria; arrangement and Gram appearance could not be confidently determined.",
  "filamentous|unknown|gram_positive_like":
    "Filamentous / branching bacteria with a Gram-positive-like staining appearance.",
};

function gramCard(
  morphology: MorphologyLabel,
  arrangement: ArrangementLabel,
  gram: GramLabel
): ResultEducation {
  const morph = morphologyInfo[morphology];
  const gramData = gramInfo[gram];
  const exactKey = `${morphology}|${arrangement}|${gram}`;
  const summary =
    SPECIFIC_CARDS[exactKey] ??
    `${MORPHOLOGY_DISPLAY[morphology]} with a ${GRAM_DISPLAY[gram].toLowerCase()}.`;

  return {
    title: titleForGram(morphology, gram),
    summary,
    morphology_explanation: morph.explanation,
    arrangement_explanation: arrangementInfo[arrangement],
    appearance_title: "Gram stain",
    appearance_explanation: gramData.explanation,
    structure_explanation:
      morphology === "filamentous"
        ? "Branching is a visible growth form: cells stay linked in threads that may fork. It is a class feature, not an identification."
        : undefined,
    class_features: gramClassFeatures(morphology, arrangement),
    common_examples: commonExamples(morphology, gram),
    common_tests: gramData.tests,
    habitat_notes: morph.habitat,
    disclaimer: GENERIC_DISCLAIMER,
  };
}

function acidFastCard(c: Extract<ResultClassification, { stain: "acid_fast" }>): ResultEducation {
  const morph = morphologyInfo[c.morphology.label];
  const af = c.acid_fast_appearance.label;
  const appearance =
    af === "acid_fast_positive_like"
      ? "Acid-fast-positive-like cells retain carbol fuchsin and look bright red/magenta against a blue counterstain. This reflects a lipid-rich (mycolic-acid) cell envelope that resists decolorization."
      : af === "acid_fast_negative_like"
        ? "Acid-fast-negative-like cells lose carbol fuchsin and take up the blue counterstain, so they look blue rather than red."
        : "Red vs blue contrast was not decisive enough to call acid-fast-positive-like vs negative-like from this image.";

  const title =
    af === "indeterminate"
      ? `${MORPHOLOGY_DISPLAY[c.morphology.label]} (acid-fast appearance unclear)`
      : `${af === "acid_fast_positive_like" ? "Acid-fast-positive-like" : "Acid-fast-negative-like"} ${MORPHOLOGY_DISPLAY[c.morphology.label].toLowerCase()}`;

  const features =
    af === "acid_fast_positive_like"
      ? ["red/magenta rods on a blue field", "waxy, lipid-rich envelope class", "often slender or slightly beaded"]
      : af === "acid_fast_negative_like"
        ? ["blue-counterstained cells", "did not retain carbol fuchsin"]
        : ["acid-fast stain field", "red vs blue contrast inconclusive"];

  if (c.morphology.label === "filamentous") {
    features.push("branching filaments");
  }

  return {
    title,
    summary: `${MORPHOLOGY_DISPLAY[c.morphology.label]} on an acid-fast stain field. Labels describe stain behavior and shape class only.`,
    morphology_explanation: morph.explanation,
    arrangement_explanation: arrangementInfo[c.arrangement.label],
    appearance_title: "Acid-fast stain",
    appearance_explanation: appearance,
    structure_explanation:
      c.morphology.label === "filamentous"
        ? "Some acid-fast fields show branching filaments. Partial acid-fastness plus branching is still a visual class, not an identification."
        : "A mycolic-acid-rich envelope is why some rods retain the primary stain after acid-alcohol. The 3D shell is a teaching overlay, not a measured wall.",
    class_features: features,
    common_examples: [],
    common_tests: [
      "Acid-fast stain (Ziehl–Neelsen or Kinyoun)",
      "Repeat smear if decolorization looks uneven",
      "Culture where appropriate",
    ],
    habitat_notes: morph.habitat,
    disclaimer: GENERIC_DISCLAIMER,
  };
}

function sporeCard(c: Extract<ResultClassification, { stain: "spore" }>): ResultEducation {
  const morph = morphologyInfo[c.morphology.label];
  const present = c.spore_presence.label;
  const pos = c.spore_position.label;

  const appearance =
    present === "present"
      ? "An endospore-stain field typically shows green, refractile internal ovals (malachite green) inside pink vegetative rods (safranin). Endospores are dormant survival structures, not a species label."
      : present === "absent"
        ? "Green internal ovals were not a dominant feature. Vegetative cells may still be present without visible endospores."
        : "Green vs pink contrast was not decisive enough to call endospores present or absent.";

  const structure =
    present === "present"
      ? `Spore position class: ${SPORE_POSITION_DISPLAY[pos].toLowerCase()}. Central, terminal, and subterminal are teaching categories for where the oval sits inside the rod — they are not identifications.`
      : "Endospore position is only scored when spores are visible.";

  return {
    title:
      present === "present"
        ? `Endospore-forming ${MORPHOLOGY_DISPLAY[c.morphology.label].toLowerCase()}`
        : `Spore stain · ${MORPHOLOGY_DISPLAY[c.morphology.label].toLowerCase()}`,
    summary:
      present === "present"
        ? "Rod-shaped cells with visible endospore-like inclusions on a spore stain. Class-level structure only."
        : "Endospore-stain field; spore-like inclusions were not clearly seen.",
    morphology_explanation: morph.explanation,
    arrangement_explanation:
      "Arrangement is a secondary cue on spore stains; the teaching focus is the internal spore versus the vegetative cell.",
    appearance_title: "Endospore stain",
    appearance_explanation: appearance,
    structure_explanation: structure,
    class_features:
      present === "present"
        ? ["refractile endospore", "green spore / pink vegetative contrast", `${SPORE_POSITION_DISPLAY[pos].toLowerCase()} position class`]
        : ["spore-stain color contrast", "no clear internal oval"],
    common_examples: [],
    common_tests: ["Schaeffer–Fulton (malachite green) spore stain", "fresh smear", "culture where appropriate"],
    habitat_notes:
      "Endospore-forming rods are common in soil and dust; habitat is not diagnosed from a stain field.",
    disclaimer: GENERIC_DISCLAIMER,
  };
}

function capsuleCard(c: Extract<ResultClassification, { stain: "capsule" }>): ResultEducation {
  const morph = morphologyInfo[c.morphology.label];
  const cap = c.capsule_presence.label;
  const appearance =
    cap === "present"
      ? "A capsule-like halo is an unstained or pale zone around the cell, often against a dark (India-ink) background. The halo is an extracellular layer that excludes stain — a class feature, not an identification."
      : cap === "absent"
        ? "No clear unstained halo was seen around cells on this field."
        : "Halo vs debris vs background was not decisive enough to call a capsule present or absent. Capsule stains are easy to over-call from crowding.";

  return {
    title:
      cap === "present"
        ? `Encapsulated ${MORPHOLOGY_DISPLAY[c.morphology.label].toLowerCase()}`
        : `Capsule stain · ${MORPHOLOGY_DISPLAY[c.morphology.label].toLowerCase()}`,
    summary:
      cap === "present"
        ? "Cells with a capsule-like halo on a capsule or negative stain. Visual class only."
        : "Capsule-stain field; a halo could not be called confidently.",
    morphology_explanation: morph.explanation,
    arrangement_explanation: arrangementInfo[c.arrangement.label],
    appearance_title: "Capsule stain",
    appearance_explanation: appearance,
    structure_explanation:
      "A true capsule is a polysaccharide (or polypeptide) layer outside the cell wall. The 3D halo is a teaching overlay, not a measured capsule thickness.",
    class_features:
      cap === "present"
        ? ["clear halo around the cell", "stain-excluding extracellular layer"]
        : ["capsule stain / negative stain field", "halo not confidently seen"],
    common_examples: [],
    common_tests: ["Negative stain (India ink)", "Anthony capsule stain", "repeat with a thinner smear"],
    habitat_notes: morph.habitat,
    disclaimer: GENERIC_DISCLAIMER,
  };
}

/**
 * Build an educational card from the stain-discriminated classification.
 * Gram cards keep the existing morphology / arrangement / class-example chain.
 * Special stains use class features only — no genus or species as IDs.
 */
export function getEducationCard(classification: ResultClassification): ResultEducation {
  switch (classification.stain) {
    case "acid_fast":
      return acidFastCard(classification);
    case "spore":
      return sporeCard(classification);
    case "capsule":
      return capsuleCard(classification);
    case "gram":
      return gramCard(
        classification.morphology.label,
        classification.arrangement.label,
        classification.gram_appearance.label
      );
  }
}
