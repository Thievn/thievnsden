import { NextRequest, NextResponse } from "next/server";
import { userFromRequest } from "@/lib/auth-request";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await userFromRequest(req);
  if (!user) return NextResponse.json({ error: "Log in." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const supabase = createServiceClient();
  await supabase.from("heat_reports").insert({
    thread_id: body.threadId || null,
    user_id: user.id,
    reason: String(body.reason || "report").slice(0, 80),
    preview: String(body.preview || "").slice(0, 280),
  });
  return NextResponse.json({ ok: true });
}
