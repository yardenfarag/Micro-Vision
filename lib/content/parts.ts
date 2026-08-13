import type { ColorTheme, TemplateId } from "@/lib/taxonomy";

/** Clickable regions on the procedural 3D reference model. */
export const VIEWER_PART_IDS = [
  "cell_body",
  "cell_envelope",
  "arrangement",
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
  return {
    description:
      "Bacterial envelopes include a cell wall (and sometimes an outer membrane or capsule). Gram appearance was indeterminate on this image, so the shell is shown in a neutral theme.",
    notes:
      "Re-staining a thinner smear often clarifies Gram appearance.",
  };
}

function bodyCopy(templateId: TemplateId): Pick<ViewerPart, "description" | "notes"> {
  switch (templateId) {
    case "cocci_single":
    case "cocci_pair":
    case "cocci_chain":
    case "cocci_cluster":
      return {
        description:
          "The cell body here is coccus-shaped — roughly spherical. Shape classifies morphology only; it does not identify a species.",
        notes:
          "Real cocci vary slightly in size and may look oval when dividing.",
      };
    case "bacillus_single":
    case "bacillus_cluster":
      return {
        description:
          "The cell body here is bacillus-shaped — a straight rod with rounded ends. Rod length and width vary widely across bacterial groups.",
        notes:
          "Shape alone never determines species; many unrelated rods look similar in a Gram field.",
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
          "A clearer, well-focused Gram field usually yields a more specific shape template.",
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
 * Educational parts available for a given 3D template + Gram color theme.
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
      label: colorTheme === "pink_red" ? "Outer envelope" : "Cell wall / envelope",
      description: envelope.description,
      notes: envelope.notes,
    },
  ];

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
