import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { loadHeatSettings } from "@/lib/heat-check-server";

export const runtime = "nodejs";

function authorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET || "";
  const auth = req.headers.get("authorization") || "";
  if (secret && auth === `Bearer ${secret}`) return true;
  if (req.headers.get("x-vercel-cron") === "1") return true;
  return false;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "no" }, { status: 401 });
  const supabase = createServiceClient();
  const settings = await loadHeatSettings(supabase);
  if (!settings.companion_on) return NextResponse.json({ ok: true, skipped: true });
  const { count } = await supabase
    .from("heat_companions")
    .select("user_id", { count: "exact", head: true })
    .eq("enabled", true)
    .lte("next_ping", new Date().toISOString());
  return NextResponse.json({ ok: true, due: count || 0 });
}
