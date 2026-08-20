import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();

    if (!username || typeof username !== "string") {
      return NextResponse.json({ error: "Username required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Find profile by username (case-insensitive)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, username")
      .ilike("username", username.trim())
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({ error: "No account found with that username." }, { status: 404 });
    }

    // Look up the auth user to get their email
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
      profile.id
    );

    if (userError || !userData?.user?.email) {
      return NextResponse.json({ error: "Could not resolve that account." }, { status: 500 });
    }

    return NextResponse.json({ email: userData.user.email });
  } catch (err) {
    console.error("resolve-username error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
