import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { userFromRequest } from "@/lib/auth-request";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

async function admin(req: NextRequest) {
  const user = await userFromRequest(req);
  if (!user || !isAdmin(user)) return null;
  return user;
}

export async function GET(req: NextRequest) {
  const user = await admin(req);
  if (!user) return NextResponse.json({ error: "admin" }, { status: 401 });
  const supabase = createServiceClient();
  const { data: settings } = await supabase.from("site_settings").select("night_grab_live").eq("id", 1).maybeSingle();
  const { data: rows } = await supabase
    .from("night_grab_runs")
    .select("id, username, score, created_at")
    .order("created_at", { ascending: false })
    .limit(25);
  return NextResponse.json({ live: settings?.night_grab_live !== false, rows: rows || [] });
}

export async function POST(req: NextRequest) {
  const user = await admin(req);
  if (!user) return NextResponse.json({ error: "admin" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const supabase = createServiceClient();
  if (body.live === true || body.live === false) {
    await supabase.from("site_settings").update({ night_grab_live: body.live }).eq("id", 1);
    await writeAudit({ actor: user.id, action: "night_grab_live", details: String(body.live) });
  }
  if (body.deleteId) {
    await supabase.from("night_grab_runs").delete().eq("id", body.deleteId);
    await writeAudit({ actor: user.id, action: "night_grab_delete", details: String(body.deleteId) });
  }
  const { data: settings } = await supabase.from("site_settings").select("night_grab_live").eq("id", 1).maybeSingle();
  const { data: rows } = await supabase
    .from("night_grab_runs")
    .select("id, username, score, created_at")
    .order("created_at", { ascending: false })
    .limit(25);
  return NextResponse.json({ live: settings?.night_grab_live !== false, rows: rows || [] });
}
