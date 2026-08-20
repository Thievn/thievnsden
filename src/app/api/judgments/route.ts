import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      style,
      focus,
      filthyMode,
      score,
      rarity,
      verdict,
      isPublic = false,
      userId = null,
    } = body;

    if (!style || !focus || score == null || !rarity || !verdict) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("judgments")
      .insert({
        style,
        focus,
        filthy_mode: filthyMode || null,
        score,
        rarity,
        verdict,
        is_public: isPublic,
        user_id: userId || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, judgment: data });
  } catch (err) {
    console.error("Judgment save error:", err);
    return NextResponse.json({ error: "Failed to save judgment" }, { status: 500 });
  }
}
