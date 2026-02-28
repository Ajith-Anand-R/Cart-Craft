import { NextRequest, NextResponse } from "next/server";

const FLASK_BASE_URL = process.env.FLASK_API_URL ?? "http://localhost:5000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params;
  const path = slug.join("/");
  try {
    const response = await fetch(`${FLASK_BASE_URL}/v1/dashboard/${path}`, {
      cache: "no-store",
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        data: null,
        error: {
          code: "PROXY_ERROR",
          message:
            "Could not reach the Flask backend. Ensure it is running on port 5000.",
        },
      },
      { status: 502 },
    );
  }
}
