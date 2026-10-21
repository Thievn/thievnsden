import { NextRequest, NextResponse } from "next/server";
import { handleLab } from "@/lib/attic/handle";
import { hasOwnerSession } from "@/lib/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MISSING = { error: "Not found" };

function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === req.nextUrl.host;
  } catch {
    return false;
  }
}

export async function GET() {
  return NextResponse.json(MISSING, { status: 404 });
}

export async function POST(req: NextRequest) {
  if (!(await hasOwnerSession())) return NextResponse.json(MISSING, { status: 404 });
  if (!sameOrigin(req)) return NextResponse.json(MISSING, { status: 404 });
  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > 4_200_000) {
    return NextResponse.json({ error: "That file is too big." }, { status: 413 });
  }
  const text = await req.text();
  if (text.length > 4_200_000) return NextResponse.json({ error: "That file is too big." }, { status: 413 });
  let body: Record<string, unknown> | null = null;
  try {
    const parsed = text ? JSON.parse(text) : null;
    body = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    body = null;
  }
  if (!body) return NextResponse.json({ error: "That didn't go through." }, { status: 400 });
  const result = await handleLab(body);
  return NextResponse.json(result.json, { status: result.status });
}
