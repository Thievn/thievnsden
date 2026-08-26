import { createClient } from "@supabase/supabase-js";
import { rewriteBadStings } from "../src/lib/wyr-generate";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env");
  if (!process.env.XAI_API_KEY) throw new Error("Missing XAI_API_KEY");
  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const all = process.argv.includes("--all");
  const countArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = countArg ? Number(countArg.split("=")[1]) : all ? 500 : 80;
  console.log(`Rewriting Floor stings (all=${all}, limit=${limit})…`);
  const result = await rewriteBadStings(supabase, { all, limit });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
