import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const userId = new URL(req.url).searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("judgments")
      .select("id, style, focus, filthy_mode, score, rarity, verdict, is_public, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ judgments: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}

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

    if (!userId) {
      return NextResponse.json(
        { error: "You need an account to save judgments. Log in first." },
        { status: 401 }
      );
    }

    if (!style || !focus || score == null || !rarity || !verdict) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Confirm user exists in auth
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !userData?.user) {
      return NextResponse.json({ error: "Invalid account. Log in again." }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("judgments")
      .insert({
        style,
        focus,
        filthy_mode: filthyMode || null,
        score,
        rarity,
        verdict,
        is_public: !!isPublic,
        user_id: userId,
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
