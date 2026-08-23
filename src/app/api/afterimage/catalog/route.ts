import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { catalogSeed } from "@/lib/afterimage-catalog-seed";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const kind = req.nextUrl.searchParams.get("kind") || "series";
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  const parent = req.nextUrl.searchParams.get("parent") || "";
  try {
    const supabase = createServiceClient();
    let query = supabase.from("afterimage_catalog").select("slug,label,hint,parent_slug,prompt").eq("kind", kind).order("sort_order").limit(30);
    if (parent) query = query.eq("parent_slug", parent);
    if (q) query = query.or(`label.ilike.%${q}%,aliases.ilike.%${q}%`);
    const { data, error } = await query;
    if (error) {
      const fallback = catalogSeed()
        .filter((r) => r.kind === kind)
        .filter((r) => !parent || r.parent_slug === parent)
        .filter((r) => !q || r.label.toLowerCase().includes(q.toLowerCase()))
        .slice(0, 30);
      return NextResponse.json({ rows: fallback, source: "seed" });
    }
    return NextResponse.json({ rows: data || [], source: "db" });
  } catch {
    return NextResponse.json({ rows: [], source: "empty" });
  }
}
