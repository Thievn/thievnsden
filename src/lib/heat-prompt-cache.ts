import { createServiceClient } from "@/lib/supabase/server";
import { HEAT_SAFETY_PACK, DEFAULT_MODULE_ROWS, sourceHash } from "@/lib/heat-check";

type Kind = "roles" | "heats" | "voices" | "openers";
const TABLE: Record<Kind, string> = {
  roles: "heat_roles",
  heats: "heat_heats",
  voices: "heat_voices",
  openers: "heat_openers",
};

export function moduleTable(kind: string): Kind {
  if (kind === "role" || kind === "roles") return "roles";
  if (kind === "heat" || kind === "heats") return "heats";
  if (kind === "voice" || kind === "voices") return "voices";
  return "openers";
}

export async function seedHeatModules() {
  const supabase = createServiceClient();
  for (const kind of Object.keys(TABLE) as Kind[]) {
    for (const row of DEFAULT_MODULE_ROWS[kind]) {
      const { data } = await supabase.from(TABLE[kind]).select("slug").eq("slug", row.slug).maybeSingle();
      if (!data) await supabase.from(TABLE[kind]).insert(row);
    }
  }
}

export async function listHeatModules() {
  await seedHeatModules();
  const supabase = createServiceClient();
  const [roles, heats, voices, openers] = await Promise.all(
    (["roles", "heats", "voices", "openers"] as Kind[]).map(async (kind) => {
      const { data } = await supabase.from(TABLE[kind]).select("slug, label, body, sort").order("sort").order("slug");
      return data || [];
    }),
  );
  return { roles, heats, voices, openers };
}

export async function upsertHeatModule(kind: Kind, row: { slug: string; label: string; body: string; sort?: number }) {
  const supabase = createServiceClient();
  const slug = row.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const { error } = await supabase.from(TABLE[kind]).upsert({
    slug,
    label: row.label.trim() || slug,
    body: row.body.trim(),
    sort: row.sort ?? 0,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  const filter =
    kind === "roles" ? "role" : kind === "heats" ? "heat" : kind === "voices" ? "voice" : "opener";
  await supabase.from("heat_compiled_prompts").update({ stale: true }).eq(filter, slug);
  return slug;
}

export async function lookupCompiledPrompt(combo: { role: string; heat: string; voice: string; opener: string }) {
  await seedHeatModules();
  const supabase = createServiceClient();
  const [role, heat, voice, opener] = await Promise.all([
    supabase.from("heat_roles").select("body").eq("slug", combo.role).maybeSingle(),
    supabase.from("heat_heats").select("body").eq("slug", combo.heat).maybeSingle(),
    supabase.from("heat_voices").select("body").eq("slug", combo.voice).maybeSingle(),
    supabase.from("heat_openers").select("body").eq("slug", combo.opener).maybeSingle(),
  ]);
  const roleBody = role.data?.body || DEFAULT_MODULE_ROWS.roles.find((r) => r.slug === combo.role)?.body || "";
  const heatBody = heat.data?.body || DEFAULT_MODULE_ROWS.heats.find((r) => r.slug === combo.heat)?.body || "";
  const voiceBody = voice.data?.body || DEFAULT_MODULE_ROWS.voices.find((r) => r.slug === combo.voice)?.body || "";
  const openerBody = opener.data?.body || DEFAULT_MODULE_ROWS.openers.find((r) => r.slug === combo.opener)?.body || "";
  if (!roleBody || !heatBody || !voiceBody || !openerBody) {
    return { compiled: "", hash: "", hit: false, empty: true as const };
  }
  const hash = sourceHash([HEAT_SAFETY_PACK, roleBody, heatBody, voiceBody, openerBody]);
  const { data: existing } = await supabase
    .from("heat_compiled_prompts")
    .select("compiled_text, source_hash, stale")
    .eq("role", combo.role)
    .eq("heat", combo.heat)
    .eq("voice", combo.voice)
    .eq("opener", combo.opener)
    .maybeSingle();
  if (existing?.compiled_text && existing.source_hash === hash && !existing.stale) {
    return { compiled: existing.compiled_text, hash, hit: true, empty: false as const };
  }
  const compiled = [HEAT_SAFETY_PACK, roleBody, heatBody, voiceBody, openerBody].join("\n\n");
  await supabase.from("heat_compiled_prompts").upsert(
    {
      role: combo.role,
      heat: combo.heat,
      voice: combo.voice,
      opener: combo.opener,
      compiled_text: compiled,
      source_hash: hash,
      stale: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "role,heat,voice,opener" },
  );
  return { compiled, hash, hit: false, empty: false as const };
}

export async function listCompiledPrompts() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("heat_compiled_prompts")
    .select("id, role, heat, voice, opener, source_hash, stale, updated_at")
    .order("updated_at", { ascending: false })
    .limit(80);
  return data || [];
}

export async function regenerateCompiled(id?: string) {
  const supabase = createServiceClient();
  let rows: { role: string; heat: string; voice: string; opener: string }[] = [];
  if (id) {
    const { data } = await supabase.from("heat_compiled_prompts").select("role, heat, voice, opener").eq("id", id).maybeSingle();
    if (data) rows = [data];
  } else {
    const { data } = await supabase.from("heat_compiled_prompts").select("role, heat, voice, opener").eq("stale", true).limit(40);
    rows = data || [];
  }
  let n = 0;
  for (const row of rows) {
    await lookupCompiledPrompt(row);
    n += 1;
  }
  return n;
}

export async function prewarmCompiled(limit = 12) {
  await seedHeatModules();
  const mods = await listHeatModules();
  const roles = mods.roles.slice(0, 4);
  const heats = mods.heats;
  const voices = mods.voices.slice(0, 3);
  const openers = mods.openers;
  let n = 0;
  for (const role of roles) {
    for (const heat of heats) {
      for (const voice of voices) {
        for (const opener of openers) {
          if (n >= limit) return n;
          await lookupCompiledPrompt({ role: role.slug, heat: heat.slug, voice: voice.slug, opener: opener.slug });
          n += 1;
        }
      }
    }
  }
  return n;
}
