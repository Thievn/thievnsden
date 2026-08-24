import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("den_thoughts")
      .select("slug, title, excerpt, cover_url, created_at")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) return NextResponse.json({ rows: [], error: error.message });
    return NextResponse.json({ rows: data || [] });
  } catch (err: any) {
    return NextResponse.json({ rows: [], error: err.message });
  }
}
