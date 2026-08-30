import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { HEAT_PINGS } from "@/lib/heat-check";
import { requireHeatPlayer } from "@/lib/heat-check-server";

export const runtime = "nodejs";

function nextPingAt(pingsPerDay: number) {
  const hours = Math.max(4, Math.round(24 / Math.max(1, pingsPerDay)));
  const jitter = Math.floor(Math.random() * 90) * 60 * 1000;
  return new Date(Date.now() + hours * 60 * 60 * 1000 + jitter).toISOString();
}

export async function GET(req: NextRequest) {
  const ctx = await requireHeatPlayer(req);
  if ("error" in ctx && ctx.error) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }
  const user = ctx.user!;
  const supabase = createServiceClient();
  const { data: row } = await supabase.from("heat_companions").select("*").eq("user_id", user.id).maybeSingle();
  if (!ctx.settings.companion_on || !row?.enabled) {
    return NextResponse.json({ ping: null, enabled: !!row?.enabled, house: ctx.settings.companion_on });
  }
  const due = !row.next_ping || new Date(row.next_ping).getTime() <= Date.now();
  if (!due) return NextResponse.json({ ping: null, enabled: true, next: row.next_ping });

  const { data: night } = await supabase
    .from("heat_threads")
    .select("id, contact_name, contact_face_url, ended")
    .eq("user_id", user.id)
    .eq("ended", false)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const line = HEAT_PINGS[Math.floor(Math.random() * HEAT_PINGS.length)];
  const next = nextPingAt(ctx.settings.pings_per_day);
  await supabase.from("heat_companions").update({
    last_ping: new Date().toISOString(),
    next_ping: next,
    last_line: line,
  }).eq("user_id", user.id);
  return NextResponse.json({
    ping: night
      ? { nightId: night.id, name: night.contact_name, face: night.contact_face_url, line }
      : { nightId: null, name: "them", face: null, line },
    enabled: true,
    next,
  });
}

export async function POST(req: NextRequest) {
  const ctx = await requireHeatPlayer(req);
  if ("error" in ctx && ctx.error) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }
  const user = ctx.user!;
  const body = await req.json().catch(() => ({}));
  const enabled = !!body.enabled;
  const supabase = createServiceClient();
  await supabase.from("heat_companions").upsert({
    user_id: user.id,
    enabled,
    next_ping: enabled ? nextPingAt(ctx.settings.pings_per_day) : null,
    updated_at: new Date().toISOString(),
  });
  return NextResponse.json({ enabled, house: ctx.settings.companion_on });
}
