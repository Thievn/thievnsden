import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { isUsernameTaken } from "@/lib/usernames";

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
    const taken = await isUsernameTaken(supabase, trimmed, excludeUserId || null);

    return NextResponse.json({ available: !taken, username: trimmed });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Check failed" }, { status: 500 });
  }
}
