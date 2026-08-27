import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { DEFAULT_GAMING_CONFIG, type GamingConfig } from "@/lib/gaming-data";
import { lookupGameCover } from "@/lib/gaming-covers";
import { mirrorCover } from "@/lib/gaming-pull";
import { persistItemCover } from "@/lib/gaming-art";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = String(body.id || "").trim();
    const title = String(body.title || "").trim();
    if (!title) return NextResponse.json({ error: "Title first" }, { status: 400 });

    const supabase = createServiceClient();
    const { data } = await supabase
      .from("site_settings")
      .select("gaming_config")
      .eq("id", 1)
      .maybeSingle();
    const config: GamingConfig = { ...DEFAULT_GAMING_CONFIG, ...(data?.gaming_config || {}) };
    const found = await lookupGameCover(title, config.rawg_api_key || "");
    if (!found) {
      return NextResponse.json(
        { error: "RAWG/Steam didn’t return a cover for that title." },
        { status: 404 }
      );
    }
    const cover = await mirrorCover(found);
    let items = null;
    if (id) items = await persistItemCover(id, cover);
    return NextResponse.json({
      cover,
      items,
      saved: Boolean(id),
      source: found.includes("rawg") ? "rawg" : "lookup",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Cover lookup failed" }, { status: 500 });
  }
}
