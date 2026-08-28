import { NextRequest, NextResponse } from "next/server";
import { userFromRequest } from "@/lib/auth-request";
import { isAdmin } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";
import { grokHeatJson, grokHeatTurn, imagineHeatBytes, loadHeatSettings, pickHeatName, saveHeatSettings, uploadHeatBytes, wipeHeatThread } from "@/lib/heat-check-server";
import { DEFAULT_HEAT_SETTINGS, type HeatSettings } from "@/lib/heat-check";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const maxDuration = 120;

async function requireAdmin(req: NextRequest) {
  const user = await userFromRequest(req);
  if (!user || !isAdmin(user)) return null;
  return user;
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "No" }, { status: 403 });
  const supabase = createServiceClient();
  const settings = await loadHeatSettings();
  const { count: threads } = await supabase.from("heat_threads").select("id", { count: "exact", head: true });
  const { count: turns } = await supabase.from("heat_messages").select("id", { count: "exact", head: true }).eq("role", "user");
  const { count: gens } = await supabase.from("heat_messages").select("id", { count: "exact", head: true }).not("image_url", "is", null);
  const { data: names } = await supabase.from("heat_names").select("id, name, used_count").order("name");
  const { data: reports } = await supabase.from("heat_reports").select("*").order("created_at", { ascending: false }).limit(40);
  const { data: recent } = await supabase
    .from("heat_threads")
    .select("id, user_id, contact_name, contact_face_url, user_photo_url, status, created_at, heat, role")
    .order("created_at", { ascending: false })
    .limit(30);
  const { data: pics } = await supabase
    .from("heat_messages")
    .select("id, thread_id, image_url, created_at, mod_status")
    .not("image_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(24);
  const extraPics = (recent || []).flatMap((t) => {
    const out: { id: string; thread_id: string; image_url: string; kind: string }[] = [];
    if (t.contact_face_url) out.push({ id: `face-${t.id}`, thread_id: t.id, image_url: t.contact_face_url, kind: "face" });
    if (t.user_photo_url) out.push({ id: `up-${t.id}`, thread_id: t.id, image_url: t.user_photo_url, kind: "upload" });
    return out;
  });
  const { data: bans } = await supabase.from("heat_bans").select("user_id, reason, created_at").limit(40);
  return NextResponse.json({
    settings,
    usage: { threads: threads || 0, turns: turns || 0, gens: gens || 0 },
    names: names || [],
    reports: reports || [],
    threads: recent || [],
    pics: [...extraPics, ...(pics || []).map((p) => ({ ...p, kind: "reward" }))],
    bans: bans || [],
  });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "No" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");
  const supabase = createServiceClient();
  const settings = await loadHeatSettings();

  if (action === "save-settings") {
    const next: HeatSettings = { ...DEFAULT_HEAT_SETTINGS, ...settings, ...(body.settings || {}) };
    await saveHeatSettings(next);
    await writeAudit({ action: "heat_settings", actor: admin.email });
    return NextResponse.json({ settings: next });
  }

  if (action === "names-50") {
    const fallback = [
      "Amara","Kai","Noor","Soren","Yara","Dev","Priya","Ellis","Zuri","Omar",
      "Jun","Imani","Luca","Asha","Ravi","Quinn","Leila","Mateo","Nia","Theo",
      "Hana","Cruz","Sana","Felix","Aya","Kenji","Mira","Diego","Anika","Remy",
      "Farah","Cole","Ines","Jamal","Tala","Niko","Esme","Ade","Rina","Saul",
      "Mei","Ibrahim","Cleo","Paz","Wren","Kofi","Lina","Ari","Sable","Veda",
    ];
    let names: string[] = [];
    try {
      const parsed = await grokHeatJson({
        system: "JSON only. First names, gender-neutral mix, wide ethnicity, adults. No celebrities.",
        user: `Return {"names":["..."]} with 50 unique first names. Avoid ${((body.avoid as string[]) || []).slice(0, 40).join(", ")}`,
        maxTokens: 900,
      });
      names = (parsed.names || []).map((n: unknown) => String(n).trim()).filter((n: string) => n.length > 1 && n.length < 18);
    } catch {
      names = [];
    }
    if (names.length < 20) names = fallback;
    let inserted = 0;
    for (const name of names.slice(0, 50)) {
      const { error } = await supabase.from("heat_names").insert({ name });
      if (!error) inserted += 1;
    }
    const { data } = await supabase.from("heat_names").select("id, name, used_count").order("name");
    return NextResponse.json({ inserted, names: data || [] });
  }

  if (action === "name-add") {
    const name = String(body.name || "").trim();
    if (!name) return NextResponse.json({ error: "Name" }, { status: 400 });
    const { error } = await supabase.from("heat_names").insert({ name });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (action === "name-del") {
    await supabase.from("heat_names").delete().eq("id", body.id);
    return NextResponse.json({ ok: true });
  }

  if (action === "test-turn") {
    const turn = await grokHeatTurn({
      settings,
      setup: String(body.setup || "Role: hookup. Heat: tease. Voice: dry. They start. Consent first."),
      history: String(body.history || ""),
      lastUser: String(body.lastUser || ""),
      extra: "Admin prompt test. Do not assume this is a saved user.",
    });
    return NextResponse.json({ turn });
  }

  if (action === "contact") {
    const name = body.name ? String(body.name) : await pickHeatName(admin.id);
    let face: string | null = null;
    try {
      const bytes = await imagineHeatBytes(
        `Photoreal adult 25-35 close portrait, SFW-sexy, clothes on, dim crimson indoor, no celebrity, no text. Name energy: ${name}.`,
        "3:4"
      );
      face = await uploadHeatBytes({
        bucket: "heat-faces",
        path: `admin/${Date.now().toString(36)}.jpg`,
        bytes,
        contentType: "image/jpeg",
      });
    } catch {
      face = null;
    }
    if (body.seed) {
      const { data: thread } = await supabase
        .from("heat_threads")
        .insert({
          user_id: admin.id,
          skin: "ios",
          role: "hookup",
          heat: "tease",
          voice: "dry",
          they_start: true,
          contact_name: name,
          contact_face_url: face,
          peek: true,
          status: "active",
          mood: "same",
        })
        .select()
        .single();
      return NextResponse.json({ name, face, thread });
    }
    return NextResponse.json({ name, face });
  }

  if (action === "wipe-thread") {
    await wipeHeatThread(String(body.id));
    await writeAudit({ action: "heat_wipe", actor: admin.email, target: String(body.id) });
    return NextResponse.json({ ok: true });
  }

  if (action === "delete-pic") {
    const id = String(body.id || "");
    if (id.startsWith("face-")) {
      await supabase.from("heat_threads").update({ contact_face_url: null }).eq("id", id.slice(5));
    } else if (id.startsWith("up-")) {
      await supabase.from("heat_threads").update({ user_photo_url: null }).eq("id", id.slice(3));
    } else {
      await supabase.from("heat_messages").update({ image_url: null }).eq("id", id);
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "approve-pic") {
    const id = String(body.id || "");
    if (!id.startsWith("face-") && !id.startsWith("up-")) {
      await supabase.from("heat_messages").update({ mod_status: "ok" }).eq("id", id);
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "ban") {
    const userId = String(body.user_id || "");
    if (!userId) return NextResponse.json({ error: "Need a user." }, { status: 400 });
    await supabase.from("heat_bans").upsert({ user_id: userId, reason: String(body.reason || "ban").slice(0, 80) });
    await writeAudit({ action: "heat_ban", actor: admin.email, target: userId });
    return NextResponse.json({ ok: true });
  }

  if (action === "unban") {
    await supabase.from("heat_bans").delete().eq("user_id", body.user_id);
    return NextResponse.json({ ok: true });
  }

  if (action === "thread") {
    const { data: thread } = await supabase.from("heat_threads").select("*").eq("id", body.id).maybeSingle();
    const { data: messages } = await supabase
      .from("heat_messages")
      .select("*")
      .eq("thread_id", body.id)
      .order("created_at", { ascending: true });
    return NextResponse.json({ thread, messages: messages || [] });
  }

  return NextResponse.json({ error: "Unknown" }, { status: 400 });
}
