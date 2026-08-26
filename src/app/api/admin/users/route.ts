import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const kind = new URL(req.url).searchParams.get("kind") || "real";
    const supabase = createServiceClient();

    let query = supabase
      .from("profiles")
      .select("id, username, display_name, created_at, is_demo, avatar_url")
      .order("created_at", { ascending: false });

    if (kind === "real") query = query.eq("is_demo", false);
    if (kind === "house" || kind === "demo") query = query.eq("is_demo", true);

    const { data: profiles, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: judgments } = await supabase
      .from("judgments")
      .select("user_id, is_public, image_url");

    const counts: Record<string, number> = {};
    const publicCounts: Record<string, number> = {};
    const thumbs: Record<string, string> = {};
    (judgments || []).forEach((j) => {
      if (!j.user_id) return;
      counts[j.user_id] = (counts[j.user_id] || 0) + 1;
      if (j.is_public) publicCounts[j.user_id] = (publicCounts[j.user_id] || 0) + 1;
      if (j.image_url && !thumbs[j.user_id]) thumbs[j.user_id] = j.image_url;
    });

    const users = await Promise.all(
      (profiles || []).map(async (p) => {
        let email = "";
        try {
          const { data } = await supabase.auth.admin.getUserById(p.id);
          email = data?.user?.email || "";
        } catch {
          // ignore
        }
        return {
          id: p.id,
          username: p.username || p.display_name || "—",
          email,
          created_at: p.created_at,
          judgment_count: counts[p.id] || 0,
          public_count: publicCounts[p.id] || 0,
          avatar_url: p.avatar_url || thumbs[p.id] || null,
          is_demo: !!p.is_demo,
        };
      })
    );

    return NextResponse.json({ users });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    await supabase.from("judgments").delete().eq("user_id", userId);
    await supabase.from("profiles").delete().eq("id", userId);
    await supabase.auth.admin.deleteUser(userId);

    await writeAudit({
      action: "delete_user",
      target: userId,
      details: "User and judgments removed",
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Delete failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, action } = body;
    if (!userId || !action) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const supabase = createServiceClient();

    if (action === "hide_cards") {
      const { error } = await supabase
        .from("judgments")
        .update({ is_public: false })
        .eq("user_id", userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await writeAudit({
        action: "house_hide_cards",
        target: userId,
        details: "Unpublished house cards",
      });
      return NextResponse.json({ success: true });
    }

    if (action !== "reset_password") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !userData?.user?.email) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { error } = await supabase.auth.resetPasswordForEmail(userData.user.email, {
      redirectTo: "https://thievnsden.com/login",
    });

    if (error) {
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "recovery",
        email: userData.user.email,
      });
      if (linkError) {
        return NextResponse.json({ error: linkError.message }, { status: 500 });
      }
      await writeAudit({
        action: "force_password_reset",
        target: userId,
        details: `Recovery link generated for ${userData.user.email}`,
      });
      return NextResponse.json({
        success: true,
        message: "Recovery link generated",
        link: linkData?.properties?.action_link || null,
      });
    }

    await writeAudit({
      action: "force_password_reset",
      target: userId,
      details: `Reset email sent to ${userData.user.email}`,
    });

    return NextResponse.json({ success: true, message: "Password reset email sent" });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}
