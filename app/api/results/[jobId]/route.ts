import { NextResponse } from "next/server";
import { getJob } from "@/lib/services/jobStore";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const result = getJob(jobId);

  if (!result) {
    return NextResponse.json(
      { status: "error", message: "Result not found or expired." },
      { status: 404 }
    );
  }

  return NextResponse.json(result);
}
