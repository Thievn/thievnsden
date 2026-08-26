import { createClient } from "@supabase/supabase-js";
import { generateWyrBatch, insertPairs, pairFingerprint, tooSimilar } from "../src/lib/wyr-generate";
import { WYR_CONTRASTS } from "../src/lib/wyr-topics";

async function main() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase.from("wyr_pairs").select("id, a, b, topic, topic_b");
  if (error) throw error;
  const weak = (data || []).filter((row) => tooSimilar(row.a, row.b));
  console.log(`weak pairs: ${weak.length}/${data?.length}`);
  if (!weak.length) return;
  const seen = new Set<string>();
  for (const row of data || []) seen.add(pairFingerprint(row.a, row.b));
  const avoid = weak.map((w) => String(w.a).slice(0, 120));
  const needed = weak.length;
  const collected: any[] = [];
  let wave = 0;
  while (collected.length < needed && wave < 16) {
    const contrast = WYR_CONTRASTS[wave % WYR_CONTRASTS.length];
    const batch = await generateWyrBatch({
      count: Math.min(16, Math.max(8, needed - collected.length + 4)),
      contrast,
      seen,
      avoid,
      wave: wave + 50,
    });
    for (const p of batch) {
      if (tooSimilar(p.a, p.b)) continue;
      if (collected.length >= needed) break;
      collected.push(p);
      avoid.push(p.a.slice(0, 120));
    }
    wave += 1;
    console.log(`replacements ${collected.length}/${needed} after ${wave}`);
  }
  const ids = weak.map((w) => w.id);
  for (let i = 0; i < ids.length; i += 80) {
    await supabase.from("wyr_pairs").delete().in("id", ids.slice(i, i + 80));
  }
  await supabase.from("wyr_votes").delete().in("pair_id", ids);
  await insertPairs(supabase, collected.slice(0, needed), "grok");
  const { count } = await supabase.from("wyr_pairs").select("id", { count: "exact", head: true }).eq("active", true);
  console.log(JSON.stringify({ removed: weak.length, inserted: Math.min(collected.length, needed), active: count }));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
