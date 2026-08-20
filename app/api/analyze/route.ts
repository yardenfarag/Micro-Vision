import { NextResponse } from "next/server";
import type { ImageMetrics } from "@/lib/imageMetrics";
import type { AnalyzeResponse } from "@/lib/taxonomy";
import { runPipeline } from "@/lib/services/formatter";
import { newJobId, saveJob } from "@/lib/services/jobStore";
import { isModelReachable, predictWithModel } from "@/lib/services/modelClient";
import { classifySupport } from "@/lib/services/supportClassifier";

interface AnalyzeBody {
  fileName?: string;
  metrics?: Partial<ImageMetrics>;
  /** Optional downscaled image data URL for model inference. */
  image?: string;
}

function isValidMetrics(m: Partial<ImageMetrics> | undefined): m is ImageMetrics {
  if (!m) return false;
  const requiredNumbers: (keyof ImageMetrics)[] = [
    "width",
    "height",
    "brightness",
    "contrast",
    "sharpness",
    "saturation",
    "purpleBlueFraction",
    "pinkRedFraction",
    "greenFraction",
    "blueFraction",
    "elongationScore",
    "overexposedFraction",
    "underexposedFraction",
    "foregroundFraction",
    "signature",
  ];
  return (
    requiredNumbers.every((k) => typeof m[k] === "number" && !Number.isNaN(m[k] as number)) &&
    Array.isArray(m.hueHistogram)
  );
}

export async function POST(req: Request): Promise<NextResponse<AnalyzeResponse>> {
  let body: AnalyzeBody;
  try {
    body = (await req.json()) as AnalyzeBody;
  } catch {
    return NextResponse.json(
      { status: "error", message: "Invalid request body." },
      { status: 400 }
    );
  }

  const fileName = (body.fileName ?? "image").toString().slice(0, 200);

  if (!isValidMetrics(body.metrics)) {
    return NextResponse.json(
      { status: "error", message: "Missing or malformed image metrics." },
      { status: 400 }
    );
  }

  // Optional model backend: Gram stains only (DIBaS). Other stain types skip
  // the model and stay on the heuristic pipeline.
  let modelPrediction = null;
  const supportPreview = classifySupport(body.metrics);
  if (
    supportPreview.stain === "gram" &&
    body.image &&
    (await isModelReachable())
  ) {
    modelPrediction = await predictWithModel(body.image, fileName);
  }

  try {
    const out = runPipeline(fileName, body.metrics, { model: modelPrediction });

    if (out.status === "success" && out.result) {
      const jobId = newJobId();
      saveJob(jobId, out.result);
      return NextResponse.json({
        status: "success",
        job_id: jobId,
        result: out.result,
        input: out.input,
      });
    }

    return NextResponse.json({
      status: out.status,
      message: out.message,
      input: out.input,
    });
  } catch (err) {
    console.error("Pipeline error:", err);
    return NextResponse.json(
      { status: "error", message: "Analysis failed unexpectedly." },
      { status: 500 }
    );
  }
}
