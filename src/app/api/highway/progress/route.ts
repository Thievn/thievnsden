import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  EMPTY_GARAGE,
  UPGRADE_KEYS,
  UPGRADE_MAX,
  rebirthCost,
  upgradeCost,
  type HighwayGarage,
  type UpgradeKey,
} from "@/lib/highway-garage";

async function userOf(supabase: ReturnType<typeof createServiceClient>, userId: string) {
  const { data: auth } = await supabase.auth.admin.getUserById(userId);
  return auth?.user || null;
}

async function loadGarage(supabase: ReturnType<typeof createServiceClient>, userId: string): Promise<HighwayGarage> {
  const { data } = await supabase.from("highway_garage").select("*").eq("user_id", userId).maybeSingle();
  if (!data) return { ...EMPTY_GARAGE };
  return {
    scrap: data.scrap || 0,
    rebirths: data.rebirths || 0,
    hull: data.hull || 0,
    cannons: data.cannons || 0,
    turbo: data.turbo || 0,
    mag: data.mag || 0,
    coolant: data.coolant || 0,
  };
}

async function saveGarage(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  g: HighwayGarage
) {
  await supabase.from("highway_garage").upsert({
    user_id: userId,
    ...g,
    updated_at: new Date().toISOString(),
  });
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId") || "";
    if (!userId) return NextResponse.json({ garage: EMPTY_GARAGE });
    const supabase = createServiceClient();
    if (!(await userOf(supabase, userId))) {
      return NextResponse.json({ garage: EMPTY_GARAGE });
    }
    const garage = await loadGarage(supabase, userId);
    return NextResponse.json({ garage });
  } catch (err: any) {
    return NextResponse.json({ garage: EMPTY_GARAGE, error: err.message });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = String(body.userId || "");
    const action = String(body.action || "");
    const supabase = createServiceClient();
    if (!userId || !(await userOf(supabase, userId))) {
      return NextResponse.json({ error: "Need an account" }, { status: 401 });
    }
    const g = await loadGarage(supabase, userId);

    if (action === "buy") {
      const key = String(body.stat) as UpgradeKey;
      if (!UPGRADE_KEYS.includes(key)) return NextResponse.json({ error: "Bad upgrade" }, { status: 400 });
      if (g[key] >= UPGRADE_MAX) return NextResponse.json({ error: "Maxed" }, { status: 400 });
      const cost = upgradeCost(key, g[key]);
      if (g.scrap < cost) return NextResponse.json({ error: "Not enough scrap" }, { status: 400 });
      g.scrap -= cost;
      g[key] += 1;
      await saveGarage(supabase, userId, g);
      return NextResponse.json({ garage: g });
    }

    if (action === "rebirth") {
      const cost = rebirthCost(g);
      if (g.scrap < cost) return NextResponse.json({ error: `Need ${cost} scrap to rebirth` }, { status: 400 });
      g.scrap = Math.floor((g.scrap - cost) * 0.25) + 180;
      g.hull = 0;
      g.cannons = 0;
      g.turbo = 0;
      g.mag = 0;
      g.coolant = 0;
      g.rebirths += 1;
      await saveGarage(supabase, userId, g);
      return NextResponse.json({ garage: g });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
