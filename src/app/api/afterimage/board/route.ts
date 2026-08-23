import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("afterimage_prints")
      .select("id, image_url, want, style_id, heat, phone_id, finish, username, created_at")
      .eq("is_public", true)
      .eq("rejected", false)
      .order("created_at", { ascending: false })
      .limit(80);
    if (error) {
      return NextResponse.json({ prints: [], error: error.message, hint: "Run docs/afterimage-sql.md" });
    }
    return NextResponse.json({ prints: data || [] });
  } catch (err: any) {
    return NextResponse.json({ prints: [], error: err.message });
  }
}
