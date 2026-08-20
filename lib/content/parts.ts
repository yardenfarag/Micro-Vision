import type { ColorTheme, TemplateId } from "@/lib/taxonomy";

/** Clickable regions on the procedural 3D reference model. */
export const VIEWER_PART_IDS = [
  "cell_body",
  "cell_envelope",
  "arrangement",
  "endospore",
  "capsule",
  "filament_branch",
] as const;
export type ViewerPartId = (typeof VIEWER_PART_IDS)[number];

export interface ViewerPart {
  id: ViewerPartId;
  label: string;
  description: string;
  notes?: string;
}

const MULTI_CELL_TEMPLATES: TemplateId[] = [
  "cocci_pair",
  "cocci_chain",
  "cocci_cluster",
  "bacillus_cluster",
  "mixed_bacteria_scene",
  "generic_bacteria",
];

function envelopeCopy(theme: ColorTheme): Pick<ViewerPart, "description" | "notes"> {
  if (theme === "purple_blue") {
    return {
      description:
        "A Gram-positive-like envelope usually means a thick peptidoglycan cell wall that retains crystal violet, so cells look purple/blue under the microscope.",
      notes:
        "This translucent shell is a teaching overlay — not a measured wall thickness from your image.",
    };
  }
  if (theme === "pink_red") {
    return {
      description:
        "A Gram-negative-like envelope usually means a thin peptidoglycan layer plus an outer membrane. Crystal violet washes out and safranin leaves cells pink/red.",
      notes:
        "This translucent shell is a teaching overlay — not a measured membrane from your image.",
    };
  }
  if (theme === "acid_fast_red") {
    return {
      description:
        "An acid-fast-positive-like envelope is lipid-rich (mycolic acids). That waxy wall retains carbol fuchsin after acid-alcohol, so cells look red/magenta.",
      notes:
        "The extra-thick shell is a teaching cue for a waxy wall — not a measured mycolic-acid layer.",
    };
  }
  if (theme === "spore_green") {
    return {
      description:
        "The vegetative-cell envelope here is the pink-staining outer body. The endospore inside has its own, much tougher coat.",
      notes:
        "Safranin colors the vegetative cell; malachite green is trapped in the spore.",
    };
  }
  if (theme === "capsule_halo") {
    return {
      description:
        "Under the capsule halo is the cell envelope (wall, and sometimes an outer membrane). The halo itself is a separate extracellular layer.",
      notes:
        "Click the outer halo to read about the capsule; this shell is the cell boundary.",
    };
  }
  return {
    description:
      "Bacterial envelopes include a cell wall (and sometimes an outer membrane or capsule). Appearance was indeterminate on this image, so the shell is shown in a neutral theme.",
    notes:
      "Re-staining a thinner smear often clarifies stain appearance.",
  };
}

function bodyCopy(templateId: TemplateId): Pick<ViewerPart, "description" | "notes"> {
  switch (templateId) {
    case "cocci_single":
    case "cocci_pair":
    case "cocci_chain":
    case "cocci_cluster":
    case "encapsulated_coccus":
      return {
        description:
          "The cell body here is coccus-shaped — roughly spherical. Shape classifies morphology only; it does not identify a species.",
        notes:
          "Real cocci vary slightly in size and may look oval when dividing.",
      };
    case "bacillus_single":
    case "bacillus_cluster":
    case "acid_fast_bacillus":
    case "bacillus_endospore_central":
    case "bacillus_endospore_terminal":
    case "encapsulated_bacillus":
      return {
        description:
          "The cell body here is bacillus-shaped — a straight rod with rounded ends. Rod length and width vary widely across bacterial groups.",
        notes:
          "Shape alone never determines species; many unrelated rods look similar on a stained field.",
      };
    case "vibrio_single":
      return {
        description:
          "The cell body is vibrio-shaped — a short curved (comma-like) rod. The gentle bend is what distinguishes it from a straight bacillus.",
        notes:
          "Curved rods are often linked with aquatic environments, but habitat is not diagnosed from morphology alone.",
      };
    case "spirillum_single":
      return {
        description:
          "The cell body is spirillum-shaped — a helical / corkscrew form. The spiral axis is the defining visual feature.",
        notes:
          "Helical bacteria can look like wavy rods if the focus plane clips only part of the coil.",
      };
    case "filamentous_branching":
      return {
        description:
          "The cell body here is a long filament. Filamentous bacteria grow as threads rather than short rods or spheres.",
        notes:
          "Filaments can fragment into shorter rods in a smear — that still does not identify a species.",
      };
    case "mixed_bacteria_scene":
      return {
        description:
          "This reference scene shows more than one morphology (round and rod-shaped cells) to illustrate a mixed field.",
        notes:
          "A mixed field can mean a polymicrobial sample or simply overlapping cells — it is not a species call.",
      };
    case "generic_bacteria":
    default:
      return {
        description:
          "This is a generic bacterial reference body used when morphology was unclear. Treat it as a placeholder, not a classification.",
        notes:
          "A clearer, well-focused stained field usually yields a more specific shape template.",
      };
  }
}

function arrangementCopy(templateId: TemplateId): Pick<ViewerPart, "description" | "notes"> | null {
  switch (templateId) {
    case "cocci_pair":
      return {
        description:
          "A pair (diplo-) arrangement means two cells remain attached after dividing. You often see this when division has just finished.",
        notes:
          "Pairs are a visual arrangement cue — not proof of a particular genus.",
      };
    case "cocci_chain":
      return {
        description:
          "A chain arrangement means cells stay linked end-to-end after dividing along one axis. Long chains are a classic teaching look for streptococcal morphology — as a class example only.",
        notes:
          "Crowding can fake chains; look for true end-to-end attachments.",
      };
    case "cocci_cluster":
      return {
        description:
          "A cluster arrangement means cells form irregular grape-like clumps, typical when division planes vary. Staphylococcal groups are a common class example — not an ID of your sample.",
        notes:
          "Thick smears can look clustered even when cells are only overlapping.",
      };
    case "bacillus_cluster":
      return {
        description:
          "Rods here are grouped rather than isolated. Clusters of bacilli can reflect how the smear dried or true multicellular groupings.",
        notes:
          "Arrangement of rods is often harder to call than for cocci.",
      };
    case "mixed_bacteria_scene":
    case "generic_bacteria":
      return {
        description:
          "No single arrangement dominates in this reference scene — useful when a real field also looks mixed or ambiguous.",
        notes:
          "Re-spreading a thinner smear often clarifies arrangement.",
      };
    default:
      return null;
  }
}

/**
 * Educational parts available for a given 3D template + color theme.
 * Geometry IDs in the viewer must match these part ids.
 */
export function getViewerParts(
  templateId: TemplateId,
  colorTheme: ColorTheme
): ViewerPart[] {
  const body = bodyCopy(templateId);
  const envelope = envelopeCopy(colorTheme);
  const parts: ViewerPart[] = [
    {
      id: "cell_body",
      label: "Cell body",
      description: body.description,
      notes: body.notes,
    },
    {
      id: "cell_envelope",
      label:
        colorTheme === "acid_fast_red"
          ? "Waxy envelope"
          : colorTheme === "pink_red"
            ? "Outer envelope"
            : "Cell wall / envelope",
      description: envelope.description,
      notes: envelope.notes,
    },
  ];

  if (templateId === "filamentous_branching") {
    parts.push({
      id: "filament_branch",
      label: "Branching",
      description:
        "A branch is a side filament growing from the main thread. Branching is a morphology class used in teaching — it is not a species identification.",
      notes:
        "True branches stay attached; overlapping separate filaments can mimic branching on a 2D smear.",
    });
  }

  if (
    templateId === "bacillus_endospore_central" ||
    templateId === "bacillus_endospore_terminal"
  ) {
    parts.push({
      id: "endospore",
      label: templateId === "bacillus_endospore_terminal" ? "Terminal endospore" : "Central endospore",
      description:
        "An endospore is a highly resistant, dormant oval inside the vegetative cell. On a spore stain it often looks green against a pink rod. Position (central vs terminal) is a teaching class, not an ID.",
      notes:
        "The oval here is a reference inclusion — not a measured spore from your photo.",
    });
  }

  if (templateId === "encapsulated_coccus" || templateId === "encapsulated_bacillus") {
    parts.push({
      id: "capsule",
      label: "Capsule halo",
      description:
        "A capsule is an extracellular layer that excludes stain, so it appears as a clear halo around the cell. Presence of a halo is a class feature, not a species call.",
      notes:
        "Debris, shrinkage, and thick smears can fake a halo. This overlay is a teaching shape.",
    });
  }

  if (MULTI_CELL_TEMPLATES.includes(templateId)) {
    const arr = arrangementCopy(templateId);
    if (arr) {
      parts.push({
        id: "arrangement",
        label: "Arrangement",
        description: arr.description,
        notes: arr.notes,
      });
    }
  }

  return parts;
}

export function hasArrangementPart(templateId: TemplateId): boolean {
  return MULTI_CELL_TEMPLATES.includes(templateId);
}
