"""Shared multi-task model architecture (used by train.py and the backend)."""

from __future__ import annotations

import torch
import torch.nn as nn
import torchvision


IMG_SIZE = 224
# ImageNet normalization (ResNet was pretrained with these).
NORM_MEAN = [0.485, 0.456, 0.406]
NORM_STD = [0.229, 0.224, 0.225]


class MultiTaskNet(nn.Module):
    """ResNet18 backbone with two classification heads: morphology and Gram."""

    def __init__(self, n_morph: int, n_gram: int, pretrained: bool = True):
        super().__init__()
        weights = (
            torchvision.models.ResNet18_Weights.IMAGENET1K_V1 if pretrained else None
        )
        backbone = torchvision.models.resnet18(weights=weights)
        in_features = backbone.fc.in_features
        backbone.fc = nn.Identity()
        self.backbone = backbone
        self.dropout = nn.Dropout(0.3)
        self.morph_head = nn.Linear(in_features, n_morph)
        self.gram_head = nn.Linear(in_features, n_gram)

    def forward(self, x: torch.Tensor):
        feats = self.dropout(self.backbone(x))
        return self.morph_head(feats), self.gram_head(feats)
