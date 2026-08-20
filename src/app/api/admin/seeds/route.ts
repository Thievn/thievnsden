import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/audit";
import { getRarity } from "@/lib/gallery";

export const runtime = "nodejs";
export const maxDuration = 60;

// Real-looking handles — names, flirty, ordinary internet usernames
const FIRST = [
  "mia", "ava", "zoe", "chloe", "luna", "ivy", "nina", "ruby", "jade", "sienna",
  "kira", "elise", "nora", "wren", "tessa", "blair", "skye", "reese", "quinn", "harlow",
  "alex", "jordan", "casey", "riley", "morgan", "drew", "jamie", "cameron", "avery", "parker",
  "sam", "chris", "taylor", "jules", "remy", "finn", "cole", "dylan", "nate", "evan",
  "sophia", "emma", "olivia", "isabella", "amelia", "harper", "evelyn", "abigail", "ella", "scarlett",
  "layla", "penelope", "aria", "chloe", "victoria", "madison", "grace", "chloe", "zoey", "lily",
];

const LAST_BITS = [
  "lee", "rae", "ann", "mae", "rose", "lynn", "kate", "jay", "nix", "ray",
  "fox", "brook", "vale", "hayes", "west", "lane", "reed", "blake", "cole", "drew",
];

const FLIRTY = [
  "softlips", "afterhours", "notyourtype", "badidea", "almostlegal", "onemoredrink",
  "donttext", "lowkeyhot", "quiettrouble", "slowburn", "nightshift", "barelydressed",
  "yourmove", "leftonread", "nofilterx", "justlooking", "maybe later", "boredtonight",
];

const STYLES = ["honest", "unhinged", "filthy", "petty", "deadpan"] as const;
const FOCUSES = ["overall", "face", "body", "tits", "ass", "vibe"] as const;
const FILTHY = ["degrade", "worship", "mixed"] as const;

const SETTINGS = [
  "bedroom mirror selfie, soft lamp light",
  "casual bathroom mirror selfie",
  "beach daylight selfie",
  "car selfie at night",
  "bedroom lying down phone selfie",
  "going-out outfit mirror shot",
  "gym bag casual selfie",
  "balcony evening selfie",
];

const OUTFITS = [
  "casual t-shirt",
  "simple tank top",
  "bikini",
  "lingerie set",
  "hoodie",
  "crop top",
  "button-up shirt half open",
  "sundress",
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomUsername() {
  const mode = Math.random();

  // First + numbers (mia17, dylan04)
  if (mode < 0.35) {
    const n = Math.floor(Math.random() * 90) + 1;
    const pad = n < 10 ? `0${n}` : String(n);
    return `${pick(FIRST)}${Math.random() < 0.5 ? pad : n}`;
  }

  // First + last bit (rubylyn, natewest)
  if (mode < 0.55) {
    return `${pick(FIRST)}${pick(LAST_BITS)}`;
  }

  // First_last or first.last style without the dot (avarae, jordanlee)
  if (mode < 0.7) {
    return `${pick(FIRST)}${pick(LAST_BITS)}${Math.floor(Math.random() * 9) + 1}`;
  }

  // Flirty handle, cleaned
  if (mode < 0.88) {
    const base = pick(FLIRTY).replace(/\s+/g, "");
    if (Math.random() < 0.4) {
      return `${base}${Math.floor(Math.random() * 40) + 1}`;
    }
    return base;
  }

  // x + name + year-ish
  const year = 90 + Math.floor(Math.random() * 15);
  return `${pick(FIRST)}${year}`;
}

async function generateJudgmentText(opts: {
  style: string;
  focus: string;
  filthyMode?: string;
  setting: string;
  outfit: string;
  ageBand: string;
}) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY missing");

  const system = `You are the judge of Thievn's Den. Write a short 1-2 sentence human judgment as if you just saw a realistic phone selfie: ${opts.ageBand}, ${opts.outfit}, ${opts.setting}. Style: ${opts.style}. Focus: ${opts.focus}.${
    opts.style === "filthy" ? ` Filthy mode: ${opts.filthyMode}.` : ""
  } Never say this is AI or fictional. End with SCORE: X.X on its own line (1.0-10.0).`;

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.3",
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: "Judge this selfie. Short. Human. End with SCORE: X.X",
        },
      ],
      temperature: 1.05,
      max_tokens: 160,
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Judgment failed: ${res.status} ${t.slice(0, 200)}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content?.trim() || "The Den stays quiet.\nSCORE: 5.0";

  let score = 5.0;
  let verdict = raw;
  const scoreMatch = raw.match(/SCORE:\s*(\d+(?:\.\d+)?)/i);
  if (scoreMatch) {
    score = Math.min(10, Math.max(1, parseFloat(scoreMatch[1])));
    verdict = raw.replace(/SCORE:\s*\d+(?:\.\d+)?/i, "").trim();
  }

  return { verdict, score };
}

async function createOneDemo(makePublic: boolean) {
  const supabase = createServiceClient();
  let username = randomUsername();
  // light uniqueness retry
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .ilike("username", username)
      .maybeSingle();
    if (!existing) break;
    username = randomUsername();
  }

  const email = `demo+${username.replace(/[^a-z0-9]/gi, "")}${Date.now().toString(36).slice(-4)}@thievnsden.internal`;
  const password = `Demo!${Math.random().toString(36).slice(2)}A1`;
  const style = pick(STYLES);
  const focus = pick(FOCUSES);
  const filthyMode = style === "filthy" ? pick(FILTHY) : null;
  const setting = pick(SETTINGS);
  const outfit = pick(OUTFITS);
  const ageBand = pick(["early 20s", "mid 20s", "late 20s", "early 30s", "mid 30s", "early 40s"]);

  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username, is_demo: true },
  });

  if (createErr || !created.user) {
    throw new Error(createErr?.message || "Could not create demo user");
  }

  const userId = created.user.id;

  await supabase.from("profiles").upsert({
    id: userId,
    username,
    updated_at: new Date().toISOString(),
  });

  const { verdict, score } = await generateJudgmentText({
    style,
    focus,
    filthyMode: filthyMode || undefined,
    setting,
    outfit,
    ageBand,
  });

  const rarity = getRarity(score).name;

  const { data: judgment, error: jErr } = await supabase
    .from("judgments")
    .insert({
      user_id: userId,
      style,
      focus,
      filthy_mode: filthyMode,
      score,
      rarity,
      verdict,
      image_url: null,
      is_public: makePublic,
      is_demo: true,
      likes: Math.floor(Math.random() * 4),
      dislikes: Math.floor(Math.random() * 2),
    })
    .select()
    .single();

  if (jErr) {
    throw new Error(jErr.message);
  }

  return {
    username,
    userId,
    judgment,
    meta: { style, focus, setting, outfit, ageBand },
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const count = Math.min(Math.max(Number(body.count) || 1, 1), 5);
    const makePublic = body.makePublic !== false;

    const results = [];
    const errors: string[] = [];

    for (let i = 0; i < count; i++) {
      try {
        results.push(await createOneDemo(makePublic));
      } catch (err: any) {
        errors.push(err.message || "failed");
      }
    }

    await writeAudit({
      action: "seed_demos",
      details: `created ${results.length}, errors ${errors.length}, public=${makePublic}`,
    });

    return NextResponse.json({
      success: true,
      created: results.length,
      results,
      errors,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Seed failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("judgments")
      .select(
        "id, user_id, style, focus, score, rarity, verdict, is_public, is_demo, likes, dislikes, created_at"
      )
      .eq("is_demo", true)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const userIds = [...new Set((data || []).map((j) => j.user_id).filter(Boolean))];
    let nameMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", userIds as string[]);
      (profiles || []).forEach((p) => {
        nameMap[p.id] = p.username;
      });
    }

    const demos = (data || []).map((j) => ({
      ...j,
      username: j.user_id ? nameMap[j.user_id] || "demo" : "demo",
    }));

    return NextResponse.json({ demos });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = createServiceClient();

    const { data: demos } = await supabase
      .from("judgments")
      .select("id, user_id")
      .eq("is_demo", true);

    const userIds = [
      ...new Set((demos || []).map((d) => d.user_id).filter(Boolean)),
    ] as string[];

    await supabase.from("judgments").delete().eq("is_demo", true);

    for (const uid of userIds) {
      try {
        await supabase.auth.admin.deleteUser(uid);
      } catch {
        // continue
      }
    }

    await writeAudit({
      action: "purge_demos",
      details: `purged ${demos?.length || 0} judgments, ${userIds.length} users`,
    });

    return NextResponse.json({
      success: true,
      purgedJudgments: demos?.length || 0,
      purgedUsers: userIds.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Purge failed" }, { status: 500 });
  }
}
