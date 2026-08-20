import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const publicOnly = searchParams.get("public") === "1";

    const supabase = createServiceClient();

    if (publicOnly) {
      const { data, error } = await supabase
        .from("judgments")
        .select(
          "id, user_id, style, focus, filthy_mode, score, rarity, verdict, image_url, is_public, is_demo, likes, dislikes, created_at"
        )
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const userIds = [...new Set((data || []).map((j) => j.user_id).filter(Boolean))];
      let nameMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", userIds as string[]);
        (profiles || []).forEach((p) => {
          nameMap[p.id] = p.username || "Anonymous";
        });
      }

      const judgments = (data || []).map((j) => ({
        ...j,
        username: j.user_id ? nameMap[j.user_id] || "Anonymous" : "Anonymous",
      }));

      return NextResponse.json({ judgments });
    }

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("judgments")
      .select(
        "id, style, focus, filthy_mode, score, rarity, verdict, image_url, is_public, is_demo, likes, dislikes, created_at"
      )
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
      imageUrl = null,
      isDemo = false,
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
        image_url: imageUrl || null,
        is_demo: !!isDemo,
        likes: 0,
        dislikes: 0,
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

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { judgmentId, userId, is_public } = body;

    if (!judgmentId || !userId) {
      return NextResponse.json({ error: "judgmentId and userId required" }, { status: 400 });
    }

    if (typeof is_public !== "boolean") {
      return NextResponse.json({ error: "is_public boolean required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Only owner can toggle
    const { data: existing, error: findError } = await supabase
      .from("judgments")
      .select("id, user_id")
      .eq("id", judgmentId)
      .maybeSingle();

    if (findError || !existing) {
      return NextResponse.json({ error: "Judgment not found" }, { status: 404 });
    }

    if (existing.user_id !== userId) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("judgments")
      .update({ is_public })
      .eq("id", judgmentId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, judgment: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { judgmentId, userId } = body;

    if (!judgmentId || !userId) {
      return NextResponse.json({ error: "judgmentId and userId required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: existing } = await supabase
      .from("judgments")
      .select("id, user_id")
      .eq("id", judgmentId)
      .maybeSingle();

    if (!existing || existing.user_id !== userId) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const { error } = await supabase.from("judgments").delete().eq("id", judgmentId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}
