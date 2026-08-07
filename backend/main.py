"""
Micro Vision inference backend (FastAPI).

Endpoints:
  GET  /health          liveness + whether a trained model is loaded
  POST /predict         multipart image -> morphology + Gram prediction

Run:
  uvicorn main:app --host 127.0.0.1 --port 8000
"""

from __future__ import annotations

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from model import get_predictor

app = FastAPI(title="Micro Vision Inference", version="0.1")

# Allow the Next.js dev server to call the backend directly if needed.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_BYTES = 12 * 1024 * 1024


@app.get("/health")
def health() -> dict:
    model_ready = True
    detail = "ok"
    try:
        get_predictor()
    except Exception as exc:  # noqa: BLE001
        model_ready = False
        detail = str(exc)
    return {"status": "ok", "model_ready": model_ready, "detail": detail}


@app.post("/predict")
async def predict(file: UploadFile = File(...)) -> dict:
    if file.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(status_code=415, detail="Unsupported image type")

    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="Image too large")

    try:
        predictor = get_predictor()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    try:
        return predictor.predict(data)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Inference failed: {exc}") from exc
