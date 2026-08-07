# Micro Vision — ML (Path B: real model)

Trains a **real** classifier for the two most important labels — **morphology
(cocci vs bacilli)** and **Gram appearance (positive vs negative)** — from the
public **DIBaS** dataset, and serves it via a FastAPI backend.

## What this does and does NOT cover

DIBaS is labeled by *species*. We map `species -> {morphology, gram}` (see
`labels.py`) and train on those derived labels. Species never appears in the
product.

- Real (model-driven): **morphology cocci/bacilli**, **Gram +/-**.
- Not learnable from DIBaS: **vibrio, spirillum** (no such species in the data),
  and **arrangement** / **segmentation** (no labels/masks). Those stay as the
  app's existing computer-vision / heuristic logic.
- `Candida albicans` (a fungus) is excluded — the app is bacteria-only.

## Layout

```
ml/
  labels.py         species -> morphology/gram mapping + folder-name normalizer
  prepare_data.py   download/discover DIBaS -> artifacts/manifest.csv (+ split)
  model_def.py      shared ResNet18 multi-task architecture
  train.py          transfer-learning trainer -> artifacts/model/{weights.pt,config.json}
  infer.py          quick single-image sanity check
  export.py         optional ONNX export
  requirements.txt
backend/
  main.py           FastAPI: /health, /predict
  model.py          loads artifacts/model, runs inference
  requirements.txt
```

## Setup

Create one virtual environment shared by training and the backend:

```bash
cd ml
python -m venv .venv
.\.venv\Scripts\Activate.ps1      # Windows PowerShell
pip install -r requirements.txt
pip install -r ..\backend\requirements.txt
```

> **CPU-only, smaller/faster torch install:**
> `pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu`

> **If pip fails with SSL / certificate errors** (this machine has a
> TLS-inspecting antivirus), add:
> `--trusted-host pypi.org --trusted-host files.pythonhosted.org --trusted-host download.pytorch.org`

## Kaggle credentials (for auto-download)

`prepare_data.py` uses `kagglehub`, which needs Kaggle API creds:

1. Kaggle → Account → *Create New API Token* → downloads `kaggle.json`.
2. Put it at `%USERPROFILE%\.kaggle\kaggle.json` (or set `KAGGLE_USERNAME` /
   `KAGGLE_KEY` env vars).

Or skip auth: download the dataset manually and pass `--data-dir`.

## Run it end-to-end

```bash
# 1. Prepare data (auto-download, or --data-dir "C:/path/to/dibas")
python prepare_data.py
#    -> ml/artifacts/manifest.csv + summary.txt (check the class counts!)

# 2. Train (CPU is fine for ~660 images; GPU auto-used if present)
python train.py --epochs 25 --batch-size 16
#    -> ml/artifacts/model/weights.pt + config.json (prints val accuracy)

# 3. Sanity check on one image
python infer.py "C:/path/to/some_gram_image.jpg"
```

## Serve

```bash
cd ..\backend
uvicorn main:app --host 127.0.0.1 --port 8000
# GET http://127.0.0.1:8000/health   -> {"model_ready": true, ...}
```

The Next.js app calls this backend for morphology + Gram when
`MICROVISION_MODEL_URL` is set (see the main app's integration), and falls back
to the built-in heuristic if the backend is offline.
