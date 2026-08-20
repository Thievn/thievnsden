import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { userId, username } = await req.json();

    if (!userId || !username) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const trimmed = username.trim();
    if (trimmed.length < 3) {
      return NextResponse.json({ error: "Username must be at least 3 characters." }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Case-insensitive uniqueness check
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .ilike("username", trimmed)
      .maybeSingle();

    if (existing && existing.id !== userId) {
      return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ username: trimmed, display_name: trimmed })
      .eq("id", userId);

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Update auth metadata too
    const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { username: trimmed },
    });

    if (authError) {
      console.error("Auth metadata update error:", authError);
    }

    return NextResponse.json({ success: true, username: trimmed });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Update failed" }, { status: 500 });
  }
}
