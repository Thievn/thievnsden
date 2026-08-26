import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { rowToPair } from "@/lib/wyr-map";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const feature = new URL(req.url).searchParams.get("feature") || "ftd";
  const supabase = createServiceClient();

  if (feature === "floor") {
    const { data } = await supabase.rpc("wyr_random_pairs", { n: 8 });
    const pairs = (data || []).map(rowToPair).filter(Boolean);
    return NextResponse.json({ feature, pairs });
  }

  if (feature === "afterimage") {
    const { data, error } = await supabase
      .from("afterimage_prints")
      .select("id, image_url, want, username, heat, finish, created_at")
      .eq("is_public", true)
      .eq("rejected", false)
      .not("image_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(24);
    if (error) return NextResponse.json({ feature, prints: [], error: error.message });
    return NextResponse.json({ feature, prints: data || [] });
  }

  const { data: rows, error } = await supabase
    .from("judgments")
    .select(
      "id, user_id, style, focus, score, rarity, verdict, image_url, is_public, is_demo, created_at"
    )
    .not("image_url", "is", null)
    .eq("is_demo", true)
    .order("created_at", { ascending: false })
    .limit(48);

  if (error) return NextResponse.json({ error: error.message, cards: [] }, { status: 500 });

  const userIds = [...new Set((rows || []).map((r) => r.user_id).filter(Boolean))];
  const nameMap: Record<string, string> = {};
  if (userIds.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", userIds as string[]);
    for (const p of profiles || []) nameMap[p.id] = p.username || "house";
  }

  const cards = (rows || []).map((j) => ({
    ...j,
    username: j.user_id ? nameMap[j.user_id] || "house" : "house",
  }));

  return NextResponse.json({ feature, cards });
}
