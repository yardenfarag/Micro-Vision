import type { ColorTheme } from "@/lib/taxonomy";

export interface ViewerColors {
  cell: string;
  emissive: string;
  rim: string;
  /** CSS gradient for the canvas backdrop */
  backdrop: string;
  label: string;
}

export const VIEWER_THEMES: Record<ColorTheme, ViewerColors> = {
  purple_blue: {
    cell: "#8b7bff",
    emissive: "#4a32c4",
    rim: "#b9a8ff",
    backdrop:
      "radial-gradient(120% 120% at 50% 0%, rgba(139,123,255,0.22), rgba(8,10,22,0.0) 60%)",
    label: "Gram-positive-like theme",
  },
  pink_red: {
    cell: "#ff6fa5",
    emissive: "#c0345f",
    rim: "#ffa6c6",
    backdrop:
      "radial-gradient(120% 120% at 50% 0%, rgba(255,111,165,0.22), rgba(8,10,22,0.0) 60%)",
    label: "Gram-negative-like theme",
  },
  neutral_gray: {
    cell: "#9fb0cc",
    emissive: "#4a5670",
    rim: "#c4d0e6",
    backdrop:
      "radial-gradient(120% 120% at 50% 0%, rgba(159,176,204,0.18), rgba(8,10,22,0.0) 60%)",
    label: "Indeterminate (neutral) theme",
  },
  acid_fast_red: {
    cell: "#e23d4a",
    emissive: "#8b1520",
    rim: "#ff8a94",
    backdrop:
      "radial-gradient(120% 120% at 50% 0%, rgba(226,61,74,0.22), rgba(8,10,22,0.0) 60%)",
    label: "Acid-fast-positive-like theme",
  },
  spore_green: {
    cell: "#e07a9a",
    emissive: "#8a3048",
    rim: "#8fd9a8",
    backdrop:
      "radial-gradient(120% 120% at 50% 0%, rgba(111,201,140,0.2), rgba(8,10,22,0.0) 60%)",
    label: "Endospore stain theme",
  },
  capsule_halo: {
    cell: "#c4b5fd",
    emissive: "#5b4aa8",
    rim: "#e9d5ff",
    backdrop:
      "radial-gradient(120% 120% at 50% 0%, rgba(196,181,253,0.18), rgba(8,10,22,0.0) 60%)",
    label: "Capsule stain theme",
  },
};
