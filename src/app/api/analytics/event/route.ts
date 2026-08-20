import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.slice(0, 100) : null;
    if (!name) {
      return NextResponse.json({ error: "name required" }, { status: 400 });
    }

    const supabase = createServiceClient();
    await supabase.from("analytics_events").insert({
      name,
      path: typeof body.path === "string" ? body.path.slice(0, 300) : null,
      meta: body.meta || {},
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("analytics event error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
