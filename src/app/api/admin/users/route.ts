import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = createServiceClient();

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, username, display_name, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Judgment counts per user
    const { data: judgments } = await supabase
      .from("judgments")
      .select("user_id");

    const counts: Record<string, number> = {};
    (judgments || []).forEach((j) => {
      if (j.user_id) counts[j.user_id] = (counts[j.user_id] || 0) + 1;
    });

    // Auth emails via admin API
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

    // Delete their judgments first
    await supabase.from("judgments").delete().eq("user_id", userId);
    await supabase.from("profiles").delete().eq("id", userId);
    await supabase.auth.admin.deleteUser(userId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Delete failed" }, { status: 500 });
  }
}
