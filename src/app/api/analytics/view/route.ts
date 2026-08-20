import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const path = typeof body.path === "string" ? body.path.slice(0, 300) : "/";
    const referrer =
      typeof body.referrer === "string" ? body.referrer.slice(0, 500) : "";

    // Vercel / edge geo when available
    const country =
      req.headers.get("x-vercel-ip-country") ||
      req.headers.get("cf-ipcountry") ||
      body.country ||
      "";

    const userAgent = (req.headers.get("user-agent") || "").slice(0, 400);

    // Skip obvious bots / admin noise lightly
    const ua = userAgent.toLowerCase();
    if (
      ua.includes("bot") ||
      ua.includes("crawl") ||
      ua.includes("spider") ||
      ua.includes("preview")
    ) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    if (path.startsWith("/admin") || path.startsWith("/api")) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const supabase = createServiceClient();

    await supabase.from("page_views").insert({
      path,
      referrer: referrer || null,
      country: country || null,
      user_agent: userAgent || null,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("analytics view error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
