import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("loot_covers").select("id, image_url");
    if (error) return NextResponse.json({ covers: {}, hint: error.message });
    const covers: Record<string, string> = {};
    (data || []).forEach((row) => {
      covers[row.id] = row.image_url;
    });
    return NextResponse.json({ covers });
  } catch {
    return NextResponse.json({ covers: {} });
  }
}
