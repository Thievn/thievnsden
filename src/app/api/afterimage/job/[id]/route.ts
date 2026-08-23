import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("afterimage_jobs").select("*").eq("id", id).maybeSingle();
    if (error || !data) return NextResponse.json({ status: "missing" });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ status: "missing", error: err.message });
  }
}
