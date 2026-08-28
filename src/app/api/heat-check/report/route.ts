import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { userFromRequest } from "@/lib/auth-request";

export async function POST(req: NextRequest) {
  const user = await userFromRequest(req);
  if (!user) return NextResponse.json({ error: "Log in." }, { status: 401 });
  const body = await req.json();
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("heat_reports")
    .insert({
      user_id: user.id,
      thread_id: body.threadId || null,
      message_id: body.messageId || null,
      reason: String(body.reason || "user").slice(0, 80),
      notes: String(body.notes || "").slice(0, 500),
      status: "open",
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ report: data });
}
