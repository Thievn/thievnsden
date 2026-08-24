import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { inferPack } from "@/lib/thoughts-packs";

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("den_thoughts")
      .select("slug, title, excerpt, cover_url, created_at, topic, outlook")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(80);
    if (error) return NextResponse.json({ rows: [], error: error.message });
    const rows = (data || []).map((r: any) => ({
      ...r,
      pack: inferPack(r.topic, r.slug),
    }));
    return NextResponse.json({ rows });
  } catch (err: any) {
    return NextResponse.json({ rows: [], error: err.message });
  }
}
