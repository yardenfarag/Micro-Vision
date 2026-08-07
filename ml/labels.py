"""
DIBaS species -> (morphology, Gram) label mapping.

DIBaS is labeled by species, not by morphology. Every species has a well-known
shape and Gram type, so we derive training labels from the species folder name.
Species themselves never leave training (species-level ID is a product non-goal).

Important dataset facts:
  * DIBaS has 33 classes (32 bacteria + 1 fungus, Candida albicans).
  * It contains ONLY cocci and bacilli morphologies -- no vibrio / spirillum.
  * Candida albicans is a fungus and is EXCLUDED (app is bacteria-only).

So the model learns two binary tasks:
  morphology: cocci | bacilli
  gram:       gram_positive_like | gram_negative_like
"""

from __future__ import annotations

# Product enums (must match lib/taxonomy.ts on the TypeScript side).
MORPHOLOGY_CLASSES = ["cocci", "bacilli"]
GRAM_CLASSES = ["gram_positive_like", "gram_negative_like"]

# Species that are not bacteria / out of scope -> skipped during data prep.
EXCLUDED_SPECIES = {"candida_albicans"}

# species_key -> {"morphology": ..., "gram": ...}
# species_key is normalized: lowercase, non-alphanumerics collapsed to "_".
SPECIES_LABELS: dict[str, dict[str, str]] = {
    # --- Gram-negative bacilli / coccobacilli ---
    "acinetobacter_baumannii": {"morphology": "bacilli", "gram": "gram_negative_like"},
    "bacteroides_fragilis": {"morphology": "bacilli", "gram": "gram_negative_like"},
    "escherichia_coli": {"morphology": "bacilli", "gram": "gram_negative_like"},
    "fusobacterium": {"morphology": "bacilli", "gram": "gram_negative_like"},
    "porphyromonas_gingivalis": {"morphology": "bacilli", "gram": "gram_negative_like"},
    "proteus": {"morphology": "bacilli", "gram": "gram_negative_like"},
    "pseudomonas_aeruginosa": {"morphology": "bacilli", "gram": "gram_negative_like"},
    # --- Gram-negative cocci ---
    "neisseria_gonorrhoeae": {"morphology": "cocci", "gram": "gram_negative_like"},
    "veillonella": {"morphology": "cocci", "gram": "gram_negative_like"},
    # --- Gram-positive bacilli ---
    "actinomyces_israelii": {"morphology": "bacilli", "gram": "gram_positive_like"},
    "bifidobacterium_spp": {"morphology": "bacilli", "gram": "gram_positive_like"},
    "clostridium_perfringens": {"morphology": "bacilli", "gram": "gram_positive_like"},
    "lactobacillus_casei": {"morphology": "bacilli", "gram": "gram_positive_like"},
    "lactobacillus_crispatus": {"morphology": "bacilli", "gram": "gram_positive_like"},
    "lactobacillus_delbrueckii": {"morphology": "bacilli", "gram": "gram_positive_like"},
    "lactobacillus_gasseri": {"morphology": "bacilli", "gram": "gram_positive_like"},
    "lactobacillus_jensenii": {"morphology": "bacilli", "gram": "gram_positive_like"},
    "lactobacillus_johnsonii": {"morphology": "bacilli", "gram": "gram_positive_like"},
    "lactobacillus_paracasei": {"morphology": "bacilli", "gram": "gram_positive_like"},
    "lactobacillus_plantarum": {"morphology": "bacilli", "gram": "gram_positive_like"},
    "lactobacillus_reuteri": {"morphology": "bacilli", "gram": "gram_positive_like"},
    "lactobacillus_rhamnosus": {"morphology": "bacilli", "gram": "gram_positive_like"},
    "lactobacillus_salivarius": {"morphology": "bacilli", "gram": "gram_positive_like"},
    "listeria_monocytogenes": {"morphology": "bacilli", "gram": "gram_positive_like"},
    "propionibacterium_acnes": {"morphology": "bacilli", "gram": "gram_positive_like"},
    # --- Gram-positive cocci ---
    "enterococcus_faecalis": {"morphology": "cocci", "gram": "gram_positive_like"},
    "enterococcus_faecium": {"morphology": "cocci", "gram": "gram_positive_like"},
    "micrococcus_spp": {"morphology": "cocci", "gram": "gram_positive_like"},
    "staphylococcus_aureus": {"morphology": "cocci", "gram": "gram_positive_like"},
    "staphylococcus_epidermidis": {"morphology": "cocci", "gram": "gram_positive_like"},
    "staphylococcus_saprophyticus": {"morphology": "cocci", "gram": "gram_positive_like"},
    "streptococcus_agalactiae": {"morphology": "cocci", "gram": "gram_positive_like"},
}

# Aliases for folder names that differ from the canonical key above. Keys and
# values are both normalized. Built from the real Kaggle upload's folder names
# (note several misspellings in the original dataset, aliased here).
ALIASES: dict[str, str] = {
    "bifidobacterium": "bifidobacterium_spp",
    "micrococcus": "micrococcus_spp",
    # misspellings in the DIBaS upload:
    "acinetobacter_baumanii": "acinetobacter_baumannii",
    "actinomyces_israeli": "actinomyces_israelii",
    "lactobacillus_jehnsenii": "lactobacillus_jensenii",
    "staphylococcus_saprophiticus": "staphylococcus_saprophyticus",
    "porfyromonas_gingivalis": "porphyromonas_gingivalis",
    "veionella": "veillonella",
    "fusobacterium_": "fusobacterium",
    "proteus_": "proteus",
}

import re


def normalize(name: str) -> str:
    """Normalize a folder/species name to a lookup key."""
    key = name.strip().lower()
    key = re.sub(r"[^a-z0-9]+", "_", key)
    key = re.sub(r"_+", "_", key).strip("_")
    return key


def resolve_species(folder_name: str) -> str | None:
    """Map a dataset folder name to a canonical species key, or None if unknown."""
    key = normalize(folder_name)
    if key in ALIASES:
        key = ALIASES[key]
    if key in SPECIES_LABELS or key in EXCLUDED_SPECIES:
        return key
    # Try a loose genus_species match (first two tokens).
    tokens = key.split("_")
    if len(tokens) >= 2:
        guess = f"{tokens[0]}_{tokens[1]}"
        if guess in ALIASES:
            guess = ALIASES[guess]
        if guess in SPECIES_LABELS:
            return guess
        # genus-only fallback (e.g. "proteus_mirabilis" -> "proteus")
        if tokens[0] in SPECIES_LABELS:
            return tokens[0]
    if tokens and tokens[0] in SPECIES_LABELS:
        return tokens[0]
    return None


def labels_for(folder_name: str) -> dict[str, str] | None:
    """Return {'morphology','gram'} for a folder, or None if excluded/unknown."""
    key = resolve_species(folder_name)
    if key is None or key in EXCLUDED_SPECIES:
        return None
    return SPECIES_LABELS.get(key)
