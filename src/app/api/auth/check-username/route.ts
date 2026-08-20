import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { username, excludeUserId } = await req.json();

    if (!username || typeof username !== "string") {
      return NextResponse.json({ error: "Username required" }, { status: 400 });
    }

    const trimmed = username.trim();
    if (trimmed.length < 3) {
      return NextResponse.json({ available: false, error: "Too short" });
    }

    const supabase = createServiceClient();

    let query = supabase
      .from("profiles")
      .select("id, username")
      .ilike("username", trimmed);

    const { data, error } = await query.maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error(error);
      return NextResponse.json({ error: "Check failed" }, { status: 500 });
    }

    // Available if no match, or the only match is the current user
    const available = !data || (excludeUserId && data.id === excludeUserId);

    return NextResponse.json({ available, username: data?.username || null });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Check failed" }, { status: 500 });
  }
}
