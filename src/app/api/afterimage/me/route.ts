import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const userId = new URL(req.url).searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "Need account" }, { status: 400 });
    const supabase = createServiceClient();
    const { data: wallet } = await supabase
      .from("afterimage_wallets")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    const { data: prints } = await supabase
      .from("afterimage_prints")
      .select("id, image_url, want, style_id, heat, finish, is_public, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(40);
    return NextResponse.json({
      wallet: wallet || { user_id: userId, credits: 0, preview_used: false },
      prints: prints || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
