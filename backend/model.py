"""
Model loading + inference for the Micro Vision backend.

Loads the trained multi-task morphology + Gram classifier. The architecture is
duplicated from ml/model_def.py on purpose so the backend has no dependency on
the training package.
"""

from __future__ import annotations

import io
import json
import os
from functools import lru_cache
from pathlib import Path

import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision
from PIL import Image
from torchvision import transforms

DEFAULT_MODEL_DIR = (
    Path(__file__).resolve().parent.parent / "ml" / "artifacts" / "model"
)
MODEL_DIR = Path(os.environ.get("MICROVISION_MODEL_DIR", DEFAULT_MODEL_DIR))


class MultiTaskNet(nn.Module):
    def __init__(self, n_morph: int, n_gram: int):
        super().__init__()
        backbone = torchvision.models.resnet18(weights=None)
        in_features = backbone.fc.in_features
        backbone.fc = nn.Identity()
        self.backbone = backbone
        self.dropout = nn.Dropout(0.3)
        self.morph_head = nn.Linear(in_features, n_morph)
        self.gram_head = nn.Linear(in_features, n_gram)

    def forward(self, x):
        feats = self.dropout(self.backbone(x))
        return self.morph_head(feats), self.gram_head(feats)


class Predictor:
    def __init__(self, model_dir: Path):
        self.config = json.loads((model_dir / "config.json").read_text())
        self.model = MultiTaskNet(
            len(self.config["morphology_classes"]),
            len(self.config["gram_classes"]),
        )
        self.model.load_state_dict(
            torch.load(model_dir / "weights.pt", map_location="cpu")
        )
        self.model.eval()
        self.tf = transforms.Compose(
            [
                transforms.Resize((self.config["img_size"], self.config["img_size"])),
                transforms.ToTensor(),
                transforms.Normalize(self.config["norm_mean"], self.config["norm_std"]),
            ]
        )

    def predict(self, image_bytes: bytes) -> dict:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        x = self.tf(img).unsqueeze(0)
        with torch.no_grad():
            pm, pg = self.model(x)
        pm = F.softmax(pm, dim=1)[0]
        pg = F.softmax(pg, dim=1)[0]
        m_i = int(pm.argmax())
        g_i = int(pg.argmax())
        return {
            "morphology": {
                "label": self.config["morphology_classes"][m_i],
                "confidence": round(float(pm[m_i]), 3),
                "scores": {
                    c: round(float(pm[i]), 3)
                    for i, c in enumerate(self.config["morphology_classes"])
                },
            },
            "gram_appearance": {
                "label": self.config["gram_classes"][g_i],
                "confidence": round(float(pg[g_i]), 3),
                "scores": {
                    c: round(float(pg[i]), 3)
                    for i, c in enumerate(self.config["gram_classes"])
                },
            },
            "model_version": self.config.get("val_mean_acc", "unknown"),
        }


@lru_cache(maxsize=1)
def get_predictor() -> Predictor:
    if not (MODEL_DIR / "weights.pt").exists():
        raise FileNotFoundError(
            f"No trained model at {MODEL_DIR}. Run ml/train.py first."
        )
    return Predictor(MODEL_DIR)
