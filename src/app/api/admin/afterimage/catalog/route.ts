import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { catalogSeed } from "@/lib/afterimage-catalog-seed";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const supabase = createServiceClient();
    if (body.action === "add") {
      const row = {
        kind: String(body.kind || "series"),
        slug: String(body.slug || body.label || "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
        label: String(body.label || ""),
        hint: String(body.hint || ""),
        parent_slug: String(body.parent_slug || ""),
        prompt: String(body.prompt || body.label || ""),
        aliases: String(body.aliases || body.label || ""),
        sort_order: Number(body.sort_order) || 0,
      };
      if (!row.label) return NextResponse.json({ error: "Need a name" }, { status: 400 });
      const { error } = await supabase.from("afterimage_catalog").upsert(row, { onConflict: "kind,slug" });
      if (error) throw new Error(error.message);
      return NextResponse.json({ success: true, row });
    }
    const rows = catalogSeed();
    const { error } = await supabase.from("afterimage_catalog").upsert(rows, { onConflict: "kind,slug" });
    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true, count: rows.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Catalog failed" }, { status: 500 });
  }
}
