import { NextRequest, NextResponse } from "next/server";
import { generateGrokCover, persistItemCover } from "@/lib/gaming-art";

export const runtime = "nodejs";
export const maxDuration = 60;

function jsonError(msg: string, status = 500) {
  return NextResponse.json({ error: msg.slice(0, 280) }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = String(body.id || "").trim();
    const title = String(body.title || "").trim();
    const note = String(body.note || "").trim();
    const article = String(body.body || "").trim();
    if (!title) return jsonError("Title first", 400);

    const cover = await generateGrokCover({ title, note, body: article });
    let items = null;
    if (id) {
      items = await persistItemCover(id, cover);
    }
    return NextResponse.json({ cover, items, saved: Boolean(id) });
  } catch (err: any) {
    return jsonError(err?.message || "Cover failed");
  }
}
