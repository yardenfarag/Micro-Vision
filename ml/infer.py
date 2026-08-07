"""
Quick local inference sanity check.

Usage:
  python infer.py path/to/image.jpg
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import torch
import torch.nn.functional as F
from PIL import Image
from torchvision import transforms

from model_def import MultiTaskNet

MODEL_DIR = Path(__file__).parent / "artifacts" / "model"


def load_model():
    config = json.loads((MODEL_DIR / "config.json").read_text())
    model = MultiTaskNet(
        len(config["morphology_classes"]), len(config["gram_classes"]), pretrained=False
    )
    model.load_state_dict(torch.load(MODEL_DIR / "weights.pt", map_location="cpu"))
    model.eval()
    tf = transforms.Compose(
        [
            transforms.Resize((config["img_size"], config["img_size"])),
            transforms.ToTensor(),
            transforms.Normalize(config["norm_mean"], config["norm_std"]),
        ]
    )
    return model, tf, config


def predict(path: str):
    model, tf, config = load_model()
    img = Image.open(path).convert("RGB")
    x = tf(img).unsqueeze(0)
    with torch.no_grad():
        pm, pg = model(x)
    pm = F.softmax(pm, dim=1)[0]
    pg = F.softmax(pg, dim=1)[0]
    m_i = int(pm.argmax())
    g_i = int(pg.argmax())
    return {
        "morphology": {
            "label": config["morphology_classes"][m_i],
            "confidence": round(float(pm[m_i]), 3),
        },
        "gram": {
            "label": config["gram_classes"][g_i],
            "confidence": round(float(pg[g_i]), 3),
        },
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit("Usage: python infer.py path/to/image.jpg")
    print(json.dumps(predict(sys.argv[1]), indent=2))
