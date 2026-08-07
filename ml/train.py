"""
Train the multi-task morphology + Gram classifier on the DIBaS manifest.

Prereqs: run prepare_data.py first (creates ml/artifacts/manifest.csv).

Usage:
  python train.py --epochs 25 --batch-size 16

Outputs (ml/artifacts/model/):
  weights.pt      best model state_dict
  config.json     class lists, img size, normalization, metrics
"""

from __future__ import annotations

import argparse
import csv
import json
from collections import Counter
from pathlib import Path

import torch
import torch.nn as nn
from PIL import Image
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms

from labels import GRAM_CLASSES, MORPHOLOGY_CLASSES
from model_def import IMG_SIZE, NORM_MEAN, NORM_STD, MultiTaskNet

ARTIFACTS = Path(__file__).parent / "artifacts"
MODEL_DIR = ARTIFACTS / "model"


class DibasDataset(Dataset):
    def __init__(self, rows: list[dict], train: bool):
        self.rows = rows
        self.morph_idx = {c: i for i, c in enumerate(MORPHOLOGY_CLASSES)}
        self.gram_idx = {c: i for i, c in enumerate(GRAM_CLASSES)}
        if train:
            # NOTE: no hue/saturation jitter -- Gram classification depends on
            # stain color, so we only vary geometry and brightness/contrast.
            self.tf = transforms.Compose(
                [
                    transforms.Resize((IMG_SIZE + 32, IMG_SIZE + 32)),
                    transforms.RandomCrop(IMG_SIZE),
                    transforms.RandomHorizontalFlip(),
                    transforms.RandomVerticalFlip(),
                    transforms.RandomRotation(20),
                    transforms.ColorJitter(brightness=0.2, contrast=0.2),
                    transforms.ToTensor(),
                    transforms.Normalize(NORM_MEAN, NORM_STD),
                ]
            )
        else:
            self.tf = transforms.Compose(
                [
                    transforms.Resize((IMG_SIZE, IMG_SIZE)),
                    transforms.ToTensor(),
                    transforms.Normalize(NORM_MEAN, NORM_STD),
                ]
            )

    def __len__(self) -> int:
        return len(self.rows)

    def __getitem__(self, i: int):
        r = self.rows[i]
        try:
            img = Image.open(r["image_path"]).convert("RGB")
        except Exception as exc:  # noqa: BLE001
            raise RuntimeError(f"unreadable image {r['image_path']}: {exc}") from exc
        x = self.tf(img)
        return x, self.morph_idx[r["morphology"]], self.gram_idx[r["gram"]]


def load_rows(split: str) -> list[dict]:
    with (ARTIFACTS / "manifest.csv").open(encoding="utf-8") as f:
        return [r for r in csv.DictReader(f) if r["split"] == split]


def class_weights(rows: list[dict], key: str, classes: list[str]) -> torch.Tensor:
    counts = Counter(r[key] for r in rows)
    total = sum(counts.values())
    # Inverse-frequency weights, normalized to mean 1.
    w = [total / (len(classes) * max(1, counts.get(c, 0))) for c in classes]
    return torch.tensor(w, dtype=torch.float32)


@torch.no_grad()
def evaluate(model, loader, device) -> tuple[float, float]:
    model.eval()
    m_correct = g_correct = n = 0
    for x, ym, yg in loader:
        x = x.to(device)
        pm, pg = model(x)
        m_correct += (pm.argmax(1).cpu() == ym).sum().item()
        g_correct += (pg.argmax(1).cpu() == yg).sum().item()
        n += x.size(0)
    return m_correct / n, g_correct / n


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--epochs", type=int, default=25)
    ap.add_argument("--batch-size", type=int, default=16)
    ap.add_argument("--lr", type=float, default=3e-4)
    ap.add_argument("--workers", type=int, default=0)
    args = ap.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}", flush=True)

    train_rows = load_rows("train")
    val_rows = load_rows("val")
    print(f"train={len(train_rows)} val={len(val_rows)}", flush=True)

    train_loader = DataLoader(
        DibasDataset(train_rows, train=True),
        batch_size=args.batch_size,
        shuffle=True,
        num_workers=args.workers,
    )
    val_loader = DataLoader(
        DibasDataset(val_rows, train=False),
        batch_size=args.batch_size,
        shuffle=False,
        num_workers=args.workers,
    )

    model = MultiTaskNet(len(MORPHOLOGY_CLASSES), len(GRAM_CLASSES)).to(device)

    morph_w = class_weights(train_rows, "morphology", MORPHOLOGY_CLASSES).to(device)
    gram_w = class_weights(train_rows, "gram", GRAM_CLASSES).to(device)
    morph_loss = nn.CrossEntropyLoss(weight=morph_w)
    gram_loss = nn.CrossEntropyLoss(weight=gram_w)

    opt = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=1e-4)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=args.epochs)

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    best = 0.0

    for epoch in range(1, args.epochs + 1):
        model.train()
        running = 0.0
        for x, ym, yg in train_loader:
            x, ym, yg = x.to(device), ym.to(device), yg.to(device)
            opt.zero_grad()
            pm, pg = model(x)
            loss = morph_loss(pm, ym) + gram_loss(pg, yg)
            loss.backward()
            opt.step()
            running += loss.item() * x.size(0)
        sched.step()

        m_acc, g_acc = evaluate(model, val_loader, device)
        mean_acc = (m_acc + g_acc) / 2
        print(
            f"epoch {epoch:02d}  loss={running/len(train_rows):.4f}  "
            f"val_morph={m_acc:.3f}  val_gram={g_acc:.3f}  mean={mean_acc:.3f}",
            flush=True,
        )

        if mean_acc >= best:
            best = mean_acc
            torch.save(model.state_dict(), MODEL_DIR / "weights.pt")
            config = {
                "backbone": "resnet18",
                "img_size": IMG_SIZE,
                "norm_mean": NORM_MEAN,
                "norm_std": NORM_STD,
                "morphology_classes": MORPHOLOGY_CLASSES,
                "gram_classes": GRAM_CLASSES,
                "val_morph_acc": round(m_acc, 4),
                "val_gram_acc": round(g_acc, 4),
                "val_mean_acc": round(mean_acc, 4),
            }
            (MODEL_DIR / "config.json").write_text(json.dumps(config, indent=2))

    print(f"\nBest mean val accuracy: {best:.3f}")
    print(f"Saved model to {MODEL_DIR}")


if __name__ == "__main__":
    main()
