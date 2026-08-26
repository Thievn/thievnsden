import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/server";
import { claimUsername, isUsernameTaken } from "@/lib/usernames";

export async function POST(req: NextRequest) {
  try {
    const { username, email, password } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();

    if (trimmedUsername.length < 3) {
      return NextResponse.json({ error: "Username must be at least 3 characters." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const service = createServiceClient();

    const taken = await isUsernameTaken(service, trimmedUsername);
    if (taken) {
      return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
    }

    const anon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error: signUpError } = await anon.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: {
          username: trimmedUsername,
        },
      },
    });

    if (signUpError) {
      return NextResponse.json({ error: signUpError.message }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json({ error: "Signup failed" }, { status: 500 });
    }

    const { error: profileError } = await service.from("profiles").upsert({
      id: data.user.id,
      username: trimmedUsername,
      display_name: trimmedUsername,
      is_demo: false,
    });

    if (profileError) {
      console.error("Profile insert error:", profileError);
    } else {
      try {
        await claimUsername(service, trimmedUsername, data.user.id, "user");
      } catch (err) {
        console.error("Username ledger error:", err);
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        username: trimmedUsername,
      },
    });
  } catch (err: any) {
    console.error("Signup route error:", err);
    return NextResponse.json({ error: err.message || "Signup failed" }, { status: 500 });
  }
}
