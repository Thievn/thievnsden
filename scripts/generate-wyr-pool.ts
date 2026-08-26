import { createClient } from "@supabase/supabase-js";
import { generateAndInsert, POOL_TARGET } from "../src/lib/wyr-generate";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env");
  if (!process.env.XAI_API_KEY) throw new Error("Missing XAI_API_KEY");
  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const replace = process.argv.includes("--replace");
  const countArg = process.argv.find((a) => a.startsWith("--count="));
  const count = countArg ? Number(countArg.split("=")[1]) : POOL_TARGET;
  console.log(`Generating ${count} Floor pairs (replace=${replace})…`);
  const result = await generateAndInsert(supabase, { count, replace });
  console.log(JSON.stringify(result, null, 2));
  const { count: n } = await supabase
    .from("wyr_pairs")
    .select("id", { count: "exact", head: true })
    .eq("active", true);
  console.log(`Active pool: ${n}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
