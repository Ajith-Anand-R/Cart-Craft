import { NextResponse } from "next/server";

const FLASK_BASE_URL = process.env.FLASK_API_URL ?? "http://localhost:5000";

export async function GET() {
  try {
    const response = await fetch(`${FLASK_BASE_URL}/health`, {
      cache: "no-store",
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { ok: false, data: null, error: { code: "PROXY_ERROR", message } },
      { status: 502 },
    );
  }
}
