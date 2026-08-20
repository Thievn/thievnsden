import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(150);

    if (error) {
      return NextResponse.json({ entries: [], error: error.message });
    }

    return NextResponse.json({ entries: data || [] });
  } catch (err: any) {
    return NextResponse.json({ entries: [], error: err.message });
  }
}
