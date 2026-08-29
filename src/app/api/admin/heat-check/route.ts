import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { userFromRequest } from "@/lib/auth-request";
import { writeAudit } from "@/lib/audit";
import { DEFAULT_HEAT_SETTINGS, parseHeatSettings, SEED_NAME_ROWS, type HeatSettings } from "@/lib/heat-check";
import {
  generateContactFace,
  grokJsonChat,
  loadHeatSettings,
  runHeatTurn,
  saveHeatSettings,
} from "@/lib/heat-check-server";
import {
  listCompiledPrompts,
  listHeatModules,
  lookupCompiledPrompt,
  moduleTable,
  prewarmCompiled,
  regenerateCompiled,
  seedHeatModules,
  upsertHeatModule,
} from "@/lib/heat-prompt-cache";
import { lastSeenLabel } from "@/lib/heat-check";

export const runtime = "nodejs";
export const maxDuration = 60;

async function admin(req: NextRequest) {
  const user = await userFromRequest(req);
  if (!user || !isAdmin(user)) return null;
  return user;
}

export async function GET(req: NextRequest) {
  const user = await admin(req);
  if (!user) return NextResponse.json({ error: "admin" }, { status: 401 });
  const url = new URL(req.url);
  const view = url.searchParams.get("view") || "overview";
  const supabase = createServiceClient();
  const settings = await loadHeatSettings(supabase);

  if (view === "settings") {
    return NextResponse.json({ settings });
  }
  if (view === "names") {
    const { data } = await supabase.from("heat_names").select("*").order("created_at", { ascending: false }).limit(200);
    return NextResponse.json({ names: data || [] });
  }
  if (view === "mod") {
    const { data } = await supabase.from("heat_assets").select("*").order("created_at", { ascending: false }).limit(80);
    const assets = data || [];
    const signed = await Promise.all(
      assets.map(async (a) => {
        if (a.bucket === "heat-uploads" && a.path) {
          const { data: s } = await supabase.storage.from("heat-uploads").createSignedUrl(a.path, 60 * 20);
          return { ...a, url: s?.signedUrl || a.url };
        }
        return a;
      }),
    );
    return NextResponse.json({ assets: signed });
  }
  if (view === "nights" || view === "threads") {
    const q = url.searchParams.get("q") || "";
    let query = supabase.from("heat_threads").select("*").order("created_at", { ascending: false }).limit(40);
    if (q) query = query.or(`contact_name.ilike.%${q}%,user_id.eq.${q}`);
    const { data } = await query;
    return NextResponse.json({ nights: data || [], threads: data || [] });
  }
  if (view === "thread") {
    const id = url.searchParams.get("id") || "";
    const { data: thread } = await supabase.from("heat_threads").select("*").eq("id", id).maybeSingle();
    const { data: messages } = await supabase.from("heat_messages").select("*").eq("thread_id", id).order("created_at");
    const { data: tips } = await supabase.from("heat_tips").select("*").eq("thread_id", id).order("created_at");
    return NextResponse.json({ thread, messages: messages || [], tips: tips || [] });
  }
  if (view === "reports") {
    const { data } = await supabase.from("heat_reports").select("*").order("created_at", { ascending: false }).limit(80);
    return NextResponse.json({ reports: data || [] });
  }
  if (view === "modules") {
    const modules = await listHeatModules();
    const compiled = await listCompiledPrompts();
    return NextResponse.json({ modules, compiled });
  }
  if (view === "usage") {
    const { count: threads } = await supabase.from("heat_threads").select("id", { count: "exact", head: true });
    const { count: messages } = await supabase.from("heat_messages").select("id", { count: "exact", head: true });
    const { count: names } = await supabase.from("heat_names").select("id", { count: "exact", head: true });
    const { count: reports } = await supabase.from("heat_reports").select("id", { count: "exact", head: true }).eq("status", "open");
    return NextResponse.json({ nights: threads || 0, threads: threads || 0, messages: messages || 0, names: names || 0, reports: reports || 0 });
  }
  return NextResponse.json({ settings, defaults: DEFAULT_HEAT_SETTINGS });
}

export async function POST(req: NextRequest) {
  const user = await admin(req);
  if (!user) return NextResponse.json({ error: "admin" }, { status: 401 });
  const body = await req.json();
  const action = String(body.action || "");
  const supabase = createServiceClient();

  if (action === "names") {
    const parsed = await grokJsonChat({
      system: "Return JSON only. No markdown.",
      user: `Generate 50 distinctive first names for a late-night adult chat. Mix woman, man, unisex. No celebrities. No last names. JSON {"names":[{"name":"Mara","vibe":"woman"}]} vibe must be woman, man, or unisex.`,
      maxTokens: 1200,
      temperature: 0.9,
    });
    const names = Array.from(
      new Map(
        (parsed.names || [])
          .map((n: unknown) => {
            if (typeof n === "string") return { name: n.trim(), vibe: "unisex" };
            const row = n as { name?: string; vibe?: string };
            const name = String(row.name || "").trim();
            const vibe = ["woman", "man", "unisex"].includes(String(row.vibe)) ? String(row.vibe) : "unisex";
            return { name, vibe };
          })
          .filter((n: { name: string }) => n.name.length > 1 && n.name.length < 24)
          .map((n: { name: string; vibe: string }) => [n.name, n]),
      ).values(),
    ).slice(0, 50) as { name: string; vibe: string }[];
    if (!names.length) return NextResponse.json({ error: "No names" }, { status: 500 });
    const { error, data } = await supabase.from("heat_names").upsert(names, { onConflict: "name" }).select("name");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await writeAudit({ action: "heat_names", details: `${data?.length || names.length}` });
    return NextResponse.json({ inserted: data?.length || names.length });
  }

  if (action === "seed-names") {
    const { error } = await supabase.from("heat_names").upsert(SEED_NAME_ROWS, { onConflict: "name" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, count: SEED_NAME_ROWS.length });
  }

  if (action === "seed-modules") {
    await seedHeatModules();
    return NextResponse.json({ ok: true });
  }

  if (action === "module") {
    const kind = body.kind as "role" | "heat" | "voice" | "opener";
    const slug = String(body.slug || "").trim();
    const bodyText = String(body.body || "");
    const label = String(body.label || slug);
    if (!["role", "heat", "voice", "opener"].includes(kind) || !slug) {
      return NextResponse.json({ error: "kind/slug" }, { status: 400 });
    }
    await upsertHeatModule(moduleTable(kind), { slug, label, body: bodyText });
    await writeAudit({ action: "heat_module", details: `${kind}:${slug}` });
    return NextResponse.json({ ok: true });
  }

  if (action === "generate-module") {
    const kind = body.kind as "role" | "heat" | "voice" | "opener";
    const slug = String(body.slug || "").trim();
    const label = String(body.label || slug);
    if (!["role", "heat", "voice", "opener"].includes(kind) || !slug) {
      return NextResponse.json({ error: "kind/slug" }, { status: 400 });
    }
    const parsed = await grokJsonChat({
      system: "JSON only. Write one Heat Check prompt module. Adult 18+ dirty-talk trainer. No minors. No celebrity. No coaching past no/stop/fade.",
      user: `Write module body for kind=${kind} slug=${slug} label=${label}. JSON {"body":"multi paragraph module text"}`,
      maxTokens: 900,
      temperature: 0.5,
    });
    const next = String(parsed.body || "").trim();
    if (!next) return NextResponse.json({ error: "empty" }, { status: 500 });
    await upsertHeatModule(moduleTable(kind), { slug, label, body: next });
    return NextResponse.json({ ok: true, body: next });
  }

  if (action === "prewarm") {
    const n = await prewarmCompiled();
    return NextResponse.json({ ok: true, compiled: n });
  }

  if (action === "regenerate") {
    if (body.id) {
      const n = await regenerateCompiled(String(body.id));
      return NextResponse.json({ ok: true, compiled: n });
    }
    const role = String(body.role || "");
    const heat = String(body.heat || "");
    const voice = String(body.voice || "");
    const opener = String(body.opener || "");
    if (role && heat && voice && opener) {
      const row = await lookupCompiledPrompt({ role, heat, voice, opener });
      return NextResponse.json({ ok: true, hash: row.hash, hit: row.hit });
    }
    const n = await regenerateCompiled();
    return NextResponse.json({ ok: true, compiled: n });
  }

  if (action === "contact") {
    const name = String(body.name || "").trim() || (await grokJsonChat({
      system: "JSON only",
      user: `One first name. JSON {"name":"Mara"}`,
      maxTokens: 40,
      temperature: 0.8,
    })).name;
    let face_url: string | null = null;
    if (body.face) {
      try {
        const face = await generateContactFace(user.id, String(body.seed || ""), {
          look: String(body.look || "woman"),
          pronouns: String(body.pronouns || "she"),
          orientation: String(body.orientation || "bi"),
        });
        face_url = face.url;
      } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : "face failed", name }, { status: 502 });
      }
    }
    await supabase.from("heat_names").upsert({ name: String(name) }, { onConflict: "name" });
    return NextResponse.json({ name, face_url, last_seen: lastSeenLabel() });
  }

  if (action === "test") {
    const settings = await loadHeatSettings(supabase);
    const fakeThread = {
      id: "test",
      user_id: user.id,
      contact_name: String(body.name || "Mara"),
      contact_face_url: null,
      role: body.role || "hookup",
      heat: body.heat || "filthy",
      voice: body.voice || "mean",
      who_starts: "they",
      skin: "ios",
      mood: "same",
      user_photo_path: null,
      generate_face: false,
      reward_photo_sent: false,
      peek: true,
      ended: false,
      end_reason: null,
      last_seen_label: lastSeenLabel(),
      recap: null,
      they_look: body.look || "woman",
      they_pronouns: body.pronouns || "she",
      they_orientation: body.orientation || "bi",
      meta: { look: body.look || "woman", pronouns: body.pronouns || "she", orientation: body.orientation || "bi" },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as const;
    const turn = await runHeatTurn({
      thread: fakeThread as never,
      history: Array.isArray(body.history) ? body.history : [],
      userLine: body.userLine || null,
      opening: !body.userLine,
      fade: !!body.fade,
      doubleText: !!body.doubleText,
      lastScores: Array.isArray(body.scores) ? body.scores : [],
      settings,
    });
    return NextResponse.json({ turn, saved: false });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}

export async function PATCH(req: NextRequest) {
  const user = await admin(req);
  if (!user) return NextResponse.json({ error: "admin" }, { status: 401 });
  const body = await req.json();
  if (body.kind === "settings") {
    const current = await loadHeatSettings();
    const next = parseHeatSettings({ ...current, ...body.settings } as HeatSettings);
    if (body.settings?.prompts) next.prompts = { ...current.prompts, ...body.settings.prompts };
    await saveHeatSettings(next);
    await writeAudit({ action: "heat_settings" });
    return NextResponse.json({ settings: next });
  }
  if (body.kind === "mod") {
    const supabase = createServiceClient();
    const id = String(body.id || "");
    const status = String(body.status || "");
    if (!id) return NextResponse.json({ error: "id" }, { status: 400 });
    if (status === "delete" || status === "ban") {
      const { data: asset } = await supabase.from("heat_assets").select("*").eq("id", id).maybeSingle();
      if (asset?.bucket && asset?.path) await supabase.storage.from(asset.bucket).remove([asset.path]);
      await supabase.from("heat_assets").update({ status: status === "ban" ? "banned" : "deleted", url: null }).eq("id", id);
      if (status === "ban" && asset?.user_id) {
        await writeAudit({ action: "heat_ban", target: asset.user_id, details: id });
      }
      return NextResponse.json({ ok: true });
    }
    await supabase.from("heat_assets").update({ status: "approved" }).eq("id", id);
    return NextResponse.json({ ok: true });
  }
  if (body.kind === "report") {
    const supabase = createServiceClient();
    await supabase.from("heat_reports").update({ status: String(body.status || "closed") }).eq("id", body.id);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "unknown" }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const user = await admin(req);
  if (!user) return NextResponse.json({ error: "admin" }, { status: 401 });
  const body = await req.json();
  const id = String(body.threadId || "");
  if (!id) return NextResponse.json({ error: "threadId" }, { status: 400 });
  const supabase = createServiceClient();
  const { data: assets } = await supabase.from("heat_assets").select("bucket, path").eq("thread_id", id);
  for (const a of assets || []) {
    if (a.bucket && a.path) await supabase.storage.from(a.bucket).remove([a.path]);
  }
  await supabase.from("heat_assets").delete().eq("thread_id", id);
  await supabase.from("heat_tips").delete().eq("thread_id", id);
  await supabase.from("heat_messages").delete().eq("thread_id", id);
  await supabase.from("heat_saves").delete().eq("thread_id", id);
  await supabase.from("heat_threads").delete().eq("id", id);
  await writeAudit({ action: "heat_wipe", target: id });
  return NextResponse.json({ ok: true });
}
