"""
Optional: export the trained model to ONNX for lighter serving
(onnxruntime is much smaller than full torch at inference time).

Usage:
  python export.py

Output: ml/artifacts/model/model.onnx
"""

from __future__ import annotations

import json
from pathlib import Path

import torch

from model_def import IMG_SIZE, MultiTaskNet

MODEL_DIR = Path(__file__).parent / "artifacts" / "model"


def main() -> None:
    config = json.loads((MODEL_DIR / "config.json").read_text())
    model = MultiTaskNet(
        len(config["morphology_classes"]), len(config["gram_classes"]), pretrained=False
    )
    model.load_state_dict(torch.load(MODEL_DIR / "weights.pt", map_location="cpu"))
    model.eval()

    dummy = torch.randn(1, 3, IMG_SIZE, IMG_SIZE)
    out = MODEL_DIR / "model.onnx"
    torch.onnx.export(
        model,
        dummy,
        str(out),
        input_names=["input"],
        output_names=["morphology_logits", "gram_logits"],
        dynamic_axes={"input": {0: "batch"}},
        opset_version=17,
    )
    print(f"Exported {out}")


if __name__ == "__main__":
    main()
