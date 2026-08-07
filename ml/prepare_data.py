"""
Prepare the DIBaS dataset for training.

Discovers species folders, derives (morphology, gram) labels via labels.py,
and writes a manifest CSV with a stratified train/val split.

Usage:
  # Auto-download from Kaggle (needs kaggle credentials) then prepare:
  python prepare_data.py

  # Or point at an already-downloaded dataset root:
  python prepare_data.py --data-dir "C:/path/to/dibas"

Outputs:
  ml/artifacts/manifest.csv     one row per usable image
  ml/artifacts/summary.txt      class counts + skipped folders
"""

from __future__ import annotations

import argparse
import csv
import os
import random
from collections import Counter, defaultdict
from pathlib import Path

from labels import labels_for, normalize

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".tif", ".tiff", ".bmp", ".webp"}
ARTIFACTS = Path(__file__).parent / "artifacts"


def download_with_kagglehub() -> str:
    import kagglehub  # imported lazily so the script runs without it when --data-dir is given

    path = kagglehub.dataset_download("samaarashidaarbi/dibas-bacterial-colony-dataset")
    print(f"Downloaded dataset to: {path}")
    return path


def find_species_dirs(root: Path) -> dict[str, list[Path]]:
    """Return {folder_name: [readable image paths]} for every dir with images.

    Unreadable files (some DIBaS .tif variants) are filtered out here so neither
    training nor inference ever hits them.
    """
    from PIL import Image  # imported lazily

    species: dict[str, list[Path]] = defaultdict(list)
    unreadable: list[str] = []
    for dirpath, _dirnames, filenames in os.walk(root):
        imgs = [
            Path(dirpath) / f
            for f in filenames
            if Path(f).suffix.lower() in IMAGE_EXTS
        ]
        if not imgs:
            continue
        folder = Path(dirpath).name
        for img in imgs:
            try:
                with Image.open(img) as im:
                    im.convert("RGB")
            except Exception:
                unreadable.append(str(img))
                continue
            species[folder].append(img)
    if unreadable:
        print(f"Skipped {len(unreadable)} unreadable image(s), e.g. {unreadable[:3]}")
    return species


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--data-dir", default=None, help="Path to DIBaS root (skips download)")
    ap.add_argument("--val-frac", type=float, default=0.2)
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()

    root = Path(args.data_dir) if args.data_dir else Path(download_with_kagglehub())
    if not root.exists():
        raise SystemExit(f"Data dir does not exist: {root}")

    species = find_species_dirs(root)
    if not species:
        raise SystemExit(f"No image folders found under {root}")

    random.seed(args.seed)
    ARTIFACTS.mkdir(parents=True, exist_ok=True)

    rows: list[dict[str, str]] = []
    morph_counts: Counter[str] = Counter()
    gram_counts: Counter[str] = Counter()
    used_species: Counter[str] = Counter()
    skipped: list[str] = []

    for folder, images in sorted(species.items()):
        labs = labels_for(folder)
        if labs is None:
            skipped.append(f"{folder} (excluded/unknown, {len(images)} imgs)")
            continue

        images = sorted(set(images))
        random.shuffle(images)
        n_val = max(1, int(round(len(images) * args.val_frac)))
        val_set = set(images[:n_val])

        for img in images:
            split = "val" if img in val_set else "train"
            rows.append(
                {
                    "image_path": str(img.resolve()),
                    "species": normalize(folder),
                    "morphology": labs["morphology"],
                    "gram": labs["gram"],
                    "split": split,
                }
            )
            morph_counts[labs["morphology"]] += 1
            gram_counts[labs["gram"]] += 1
            used_species[normalize(folder)] += 1

    if not rows:
        raise SystemExit("No usable labeled images found. Check labels.py aliases.")

    manifest = ARTIFACTS / "manifest.csv"
    with manifest.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f, fieldnames=["image_path", "species", "morphology", "gram", "split"]
        )
        writer.writeheader()
        writer.writerows(rows)

    skipped_lines = [f"  {s}" for s in skipped] or ["  (none)"]
    summary_lines = [
        f"Dataset root: {root}",
        f"Total usable images: {len(rows)}",
        f"Species used: {len(used_species)}",
        "",
        "Morphology counts: " + ", ".join(f"{k}={v}" for k, v in morph_counts.items()),
        "Gram counts:       " + ", ".join(f"{k}={v}" for k, v in gram_counts.items()),
        "",
        "Per-species counts:",
        *[f"  {k}: {v}" for k, v in sorted(used_species.items())],
        "",
        "Skipped folders:",
        *skipped_lines,
    ]
    summary = "\n".join(summary_lines)
    (ARTIFACTS / "summary.txt").write_text(summary, encoding="utf-8")
    print(summary)
    print(f"\nWrote {manifest}")


if __name__ == "__main__":
    main()
