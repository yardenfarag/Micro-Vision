import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "micro-vision",
    time: new Date().toISOString(),
  });
}
