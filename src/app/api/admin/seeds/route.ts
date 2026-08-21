import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/audit";
import { getRarity } from "@/lib/gallery";

export const runtime = "nodejs";
export const maxDuration = 120;

/** Same options as Face The Den playground */
const STYLES = ["honest", "unhinged", "filthy", "petty", "deadpan"] as const;
const FOCUSES = ["overall", "face", "body", "tits", "ass", "vibe"] as const;
const FILTHY = ["degrade", "worship", "mixed"] as const;

type Style = (typeof STYLES)[number];
type Focus = (typeof FOCUSES)[number];
type FilthyMode = (typeof FILTHY)[number];

type Combo = {
  style: Style;
  focus: Focus;
  filthyMode: FilthyMode | null;
};

type CustomOpts = {
  gender?: "woman" | "man";
  setting?: string;
  outfit?: string;
  style?: string;
  focus?: string;
  filthyMode?: string | null;
  ageBand?: string;
};

function buildAllCombos(): Combo[] {
  const out: Combo[] = [];
  for (const style of STYLES) {
    for (const focus of FOCUSES) {
      if (style === "filthy") {
        for (const filthyMode of FILTHY) {
          out.push({ style, focus, filthyMode });
        }
      } else {
        out.push({ style, focus, filthyMode: null });
      }
    }
  }
  return out;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const FIRST = [
  "mia", "ava", "zoe", "chloe", "luna", "ivy", "nina", "ruby", "jade", "sienna",
  "kira", "elise", "nora", "wren", "tessa", "blair", "skye", "reese", "quinn", "harlow",
  "alex", "jordan", "casey", "riley", "morgan", "drew", "jamie", "cameron", "avery", "parker",
  "sam", "chris", "taylor", "jules", "remy", "finn", "cole", "dylan", "nate", "evan",
  "sophia", "emma", "olivia", "isabella", "amelia", "harper", "evelyn", "abigail", "ella", "scarlett",
  "layla", "penelope", "aria", "victoria", "madison", "grace", "zoey", "lily",
];

const LAST_BITS = [
  "lee", "rae", "ann", "mae", "rose", "lynn", "kate", "jay", "nix", "ray",
  "fox", "brook", "vale", "hayes", "west", "lane", "reed", "blake", "cole", "drew",
];

const FLIRTY = [
  "softlips", "afterhours", "notyourtype", "badidea", "onemoredrink",
  "donttext", "lowkeyhot", "quiettrouble", "slowburn", "nightshift", "barelydressed",
  "yourmove", "leftonread", "nofilterx", "justlooking", "boredtonight",
];

const SETTINGS = [
  "bedroom mirror selfie, soft warm lamp light",
  "casual bathroom mirror selfie, overhead light",
  "beach daylight selfie, natural sun",
  "car selfie at night, dashboard glow",
  "bedroom lying down phone selfie, dim light",
  "going-out outfit full-length mirror shot",
  "casual indoor selfie near a window",
  "balcony evening selfie, city lights soft",
  "gym locker mirror selfie",
  "coffee shop selfie, soft daylight",
  "hotel room mirror selfie, warm ambient light",
  "rooftop golden hour selfie",
];

const OUTFITS_WOMAN = [
  "casual fitted t-shirt",
  "simple tank top",
  "bikini",
  "lingerie set",
  "oversized hoodie",
  "crop top and jeans",
  "sundress",
  "workout leggings and sports bra",
  "satin camisole",
  "off-shoulder top",
];

const OUTFITS_MAN = [
  "casual fitted t-shirt",
  "hoodie",
  "button-up shirt",
  "tank top",
  "gym shirt",
  "open jacket over plain tee",
  "swim trunks (beach selfie)",
  "henley shirt",
  "simple black tee",
];

const AGE_BANDS = [
  "early 20s",
  "mid 20s",
  "late 20s",
  "early 30s",
  "mid 30s",
  "early 40s",
];

const STYLE_PROMPTS: Record<string, string> = {
  honest: `You are a blunt, observant judge in Thievn's Den. You can see the photo. Give an honest, human rating based on what you actually see. Be direct. Short and sharp — 1 to 2 sentences max.`,
  unhinged: `You are the unhinged resident of Thievn's Den. You can see the photo. Full permission to swear, be dark, crude, and mean based on what is actually in the image. 1 to 2 short sentences. Make it hit.`,
  filthy: `You are the filthy, explicit judge of Thievn's Den. You can see the photo. Rate the body and sexual energy with zero restraint based on what you see. You can be degrading, objectifying, or worshipful. Use real sexual language. Sound human. 1 to 2 short sentences max.`,
  petty: `You are petty and specific. You can see the photo. Focus on small details visible in the image. Allow swearing. 1 to 2 short sentences.`,
  deadpan: `You are completely flat and cold. You can see the photo. Deliver judgment based on what is visible with zero emotion. 1 to 2 sentences.`,
};

const FILTHY_SUB: Record<string, string> = {
  degrade: `Lean hard into degradation and objectification based on the actual body and appearance in the photo.`,
  worship: `Be explicitly positive and objectifying about what you see. Still filthy and direct.`,
  mixed: `Mix degradation and desire based on what is actually in the photo.`,
};

const FOCUS_HINTS: Record<string, string> = {
  overall: "Judge the whole package — face, body, and energy together.",
  face: "Focus mainly on the face, expression, and how it lands.",
  body: "Focus on overall body shape, proportions, and presence.",
  tits: "Focus specifically on their chest. Be direct about what you see.",
  ass: "Focus specifically on their ass and lower body. Be direct about what you see.",
  vibe: "Focus on the energy and vibe they give off more than pure looks.",
};

const FOCUS_SHOT: Record<Focus, string> = {
  overall: "selfie showing face and upper body clearly",
  face: "close-up face selfie, face fills most of the frame",
  body: "mirror selfie showing full body from head to thighs",
  tits: "mirror selfie angled to clearly show chest and torso",
  ass: "mirror selfie from a side or three-quarter back angle showing lower body and ass",
  vibe: "candid selfie with strong mood and expression",
};

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomUsername() {
  const mode = Math.random();
  if (mode < 0.35) {
    const n = Math.floor(Math.random() * 90) + 1;
    const pad = n < 10 ? `0${n}` : String(n);
    return `${pick(FIRST)}${Math.random() < 0.5 ? pad : n}`;
  }
  if (mode < 0.55) return `${pick(FIRST)}${pick(LAST_BITS)}`;
  if (mode < 0.7) return `${pick(FIRST)}${pick(LAST_BITS)}${Math.floor(Math.random() * 9) + 1}`;
  if (mode < 0.88) {
    const base = pick(FLIRTY).replace(/\s+/g, "");
    return Math.random() < 0.4 ? `${base}${Math.floor(Math.random() * 40) + 1}` : base;
  }
  return `${pick(FIRST)}${90 + Math.floor(Math.random() * 15)}`;
}

/** Strong uniqueness + gender lock so faces don't clone and clothing stays coherent */
function buildImagePrompt(opts: {
  ageBand: string;
  setting: string;
  outfit: string;
  presentation: "woman" | "man";
  focus: Focus;
  uniq: string;
}) {
  const genderLock =
    opts.presentation === "woman"
      ? "adult woman, clearly female presentation"
      : "adult man, clearly male presentation";

  return [
    "Photorealistic amateur phone selfie photo,",
    `${genderLock} looking ${opts.ageBand},`,
    `wearing ${opts.outfit},`,
    opts.setting + ",",
    FOCUS_SHOT[opts.focus] + ",",
    "unique face, distinct individual features, not a stock model,",
    `variation seed ${opts.uniq},`,
    "shot on a real smartphone, natural skin texture, realistic pores,",
    "slightly imperfect framing like a real selfie, natural lighting,",
    "no makeup perfection, no studio lighting, no fashion catalog look,",
    "no text, no watermark, no logo, not AI-looking, authentic candid selfie",
  ].join(" ");
}

function parseScoreVerdict(raw: string) {
  let score = 5.0;
  let verdict = raw;
  const scoreMatch = raw.match(/SCORE:\s*(\d+(?:\.\d+)?)/i);
  if (scoreMatch) {
    score = Math.min(10, Math.max(1, parseFloat(scoreMatch[1])));
    verdict = raw.replace(/SCORE:\s*\d+(?:\.\d+)?/i, "").trim();
  }
  return { verdict, score };
}

async function generateSelfieImage(prompt: string): Promise<{ b64: string; dataUrl: string }> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY missing on Vercel");

  const models = ["grok-imagine-image-2.0", "grok-imagine-image"];
  const errors: string[] = [];

  for (const model of models) {
    const res = await fetch("https://api.x.ai/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        prompt,
        n: 1,
        resolution: "1k",
        aspect_ratio: "3:4",
        response_format: "b64_json",
      }),
    });

    if (!res.ok) {
      errors.push(`${model}: ${res.status} ${(await res.text()).slice(0, 200)}`);
      continue;
    }

    const data = await res.json();
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) {
      errors.push(`${model}: empty b64 payload`);
      continue;
    }

    return { b64, dataUrl: `data:image/jpeg;base64,${b64}` };
  }

  throw new Error(`IMAGE_GEN_FAILED: ${errors.join(" | ")}`);
}

async function uploadImage(userId: string, b64: string): Promise<string> {
  const supabase = createServiceClient();
  const bytes = Buffer.from(b64, "base64");
  const path = `${userId}/${Date.now()}.jpg`;

  const { error } = await supabase.storage.from("judgment-images").upload(path, bytes, {
    contentType: "image/jpeg",
    upsert: false,
  });

  if (error) {
    throw new Error(
      `STORAGE_FAILED: ${error.message}. Create public bucket "judgment-images" in Supabase Storage.`
    );
  }

  const { data } = supabase.storage.from("judgment-images").getPublicUrl(path);
  if (!data?.publicUrl) {
    throw new Error("STORAGE_FAILED: no public URL returned");
  }
  return data.publicUrl;
}

async function visionJudge(opts: {
  style: string;
  focus: string;
  filthyMode?: string | null;
  imageDataUrl: string;
}) {
  const apiKey = process.env.XAI_API_KEY!;
  let system = STYLE_PROMPTS[opts.style] || STYLE_PROMPTS.unhinged;
  if (opts.style === "filthy" && opts.filthyMode && FILTHY_SUB[opts.filthyMode]) {
    system += " " + FILTHY_SUB[opts.filthyMode];
  }
  system +=
    " Always end your response with a score on a new line in this exact format: SCORE: X.X (1.0 to 10.0). Match the score to how positive or negative the judgment is. Never say there is no photo.";

  const textPrompt = `Focus: ${FOCUS_HINTS[opts.focus] || FOCUS_HINTS.overall}\n\nJudge the person in this photo. Keep it short and human.`;

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
          content: [
            { type: "image_url", image_url: { url: opts.imageDataUrl } },
            { type: "text", text: textPrompt },
          ],
        },
      ],
      temperature: 1.05,
      max_tokens: 180,
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`VISION_FAILED: ${res.status} ${t.slice(0, 200)}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error("VISION_FAILED: empty model response");
  return parseScoreVerdict(raw);
}

async function ensureProfile(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  username: string
) {
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        username,
        display_name: username,
      },
      { onConflict: "id" }
    )
    .select("id, username")
    .single();

  if (error) throw new Error(`PROFILE_FAILED: ${error.message}`);
  if (!data?.id) throw new Error("PROFILE_FAILED: profile row missing after upsert");

  const { data: authUser, error: authErr } = await supabase.auth.admin.getUserById(userId);
  if (authErr || !authUser?.user) {
    throw new Error(
      `AUTH_FAILED: user ${userId} not found after create (${authErr?.message || "missing"})`
    );
  }

  return data;
}

async function createOneDemo(
  makePublic: boolean,
  combo: Combo,
  custom?: CustomOpts
) {
  const supabase = createServiceClient();
  let username = randomUsername();
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

  // Resolve style/focus/filthy from custom or combo
  const style = (custom?.style && STYLES.includes(custom.style as Style)
    ? custom.style
    : combo.style) as Style;
  const focus = (custom?.focus && FOCUSES.includes(custom.focus as Focus)
    ? custom.focus
    : combo.focus) as Focus;
  const filthyMode =
    style === "filthy"
      ? (custom?.filthyMode && FILTHY.includes(custom.filthyMode as FilthyMode)
          ? (custom.filthyMode as FilthyMode)
          : combo.filthyMode)
      : null;

  // Gender + clothing coherence
  let presentation: "woman" | "man";
  if (custom?.gender === "woman" || custom?.gender === "man") {
    presentation = custom.gender;
  } else {
    // Random path: ~60% woman so gallery stays mixed but not extreme
    presentation = Math.random() < 0.6 ? "woman" : "man";
  }

  const outfitList = presentation === "man" ? OUTFITS_MAN : OUTFITS_WOMAN;
  let outfit = custom?.outfit?.trim() || pick(outfitList);
  // Safety: if someone passes a woman-only outfit on a man (or vice versa), fall back
  if (presentation === "man" && !OUTFITS_MAN.includes(outfit) && !outfitList.includes(outfit)) {
    outfit = pick(OUTFITS_MAN);
  }
  if (presentation === "woman" && !OUTFITS_WOMAN.includes(outfit) && !outfitList.includes(outfit)) {
    outfit = pick(OUTFITS_WOMAN);
  }

  const setting = custom?.setting?.trim() || pick(SETTINGS);
  const ageBand = custom?.ageBand?.trim() || pick(AGE_BANDS);
  const uniq = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username, is_demo: true },
  });

  if (createErr || !created.user) {
    throw new Error(`AUTH_FAILED: ${createErr?.message || "could not create demo user"}`);
  }

  const userId = created.user.id;

  try {
    await ensureProfile(supabase, userId, username);

    const prompt = buildImagePrompt({
      ageBand,
      setting,
      outfit,
      presentation,
      focus,
      uniq,
    });
    const { b64, dataUrl } = await generateSelfieImage(prompt);
    const imageUrl = await uploadImage(userId, b64);

    const { verdict, score } = await visionJudge({
      style,
      focus,
      filthyMode,
      imageDataUrl: dataUrl,
    });

    const rarity = getRarity(score).name;

    await ensureProfile(supabase, userId, username);

    // Cosmetic engagement for gallery feel only — demos stay out of overview stats
    const likes = Math.floor(Math.random() * 14) + 1; // 1–14
    const dislikes = Math.floor(Math.random() * 5); // 0–4

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
        image_url: imageUrl,
        is_public: makePublic,
        is_demo: true,
        likes,
        dislikes,
      })
      .select()
      .single();

    if (jErr) throw new Error(`INSERT_FAILED: ${jErr.message}`);
    if (!judgment?.image_url) throw new Error("INSERT_FAILED: judgment saved without image_url");

    return {
      username,
      userId,
      judgment,
      imageUrl,
      meta: {
        style,
        focus,
        filthyMode,
        setting,
        outfit,
        ageBand,
        presentation,
        uniq,
      },
    };
  } catch (err: any) {
    try {
      await supabase.from("profiles").delete().eq("id", userId);
    } catch {
      // ignore
    }
    try {
      await supabase.auth.admin.deleteUser(userId);
    } catch {
      // ignore
    }
    throw err;
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.XAI_API_KEY) {
      return NextResponse.json(
        { error: "FAILED: XAI_API_KEY is not set on Vercel" },
        { status: 500 }
      );
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        { error: "FAILED: Supabase service env vars missing" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    // Prefer single demos — bulk of 3 often hits Vercel timeout
    const count = Math.min(Math.max(Number(body.count) || 1, 1), 2);
    const makePublic = body.makePublic !== false;
    const custom: CustomOpts | undefined = body.custom || undefined;

    // If custom is provided, run exactly once with those overrides
    if (custom) {
      const combo: Combo = {
        style: (STYLES.includes(custom.style as Style) ? custom.style : "unhinged") as Style,
        focus: (FOCUSES.includes(custom.focus as Focus) ? custom.focus : "overall") as Focus,
        filthyMode:
          custom.style === "filthy" && custom.filthyMode && FILTHY.includes(custom.filthyMode as FilthyMode)
            ? (custom.filthyMode as FilthyMode)
            : null,
      };

      try {
        const result = await createOneDemo(makePublic, combo, custom);
        await writeAudit({
          action: "seed_demos",
          details: `custom 1, public=${makePublic}, gender=${custom.gender || "auto"}, style=${combo.style}+${combo.focus}`,
        });
        return NextResponse.json({
          success: true,
          created: 1,
          results: [result],
          errors: [],
          custom: true,
        });
      } catch (err: any) {
        console.error("custom seed error", err);
        return NextResponse.json(
          {
            success: false,
            created: 0,
            results: [],
            errors: [err.message || "failed"],
            error: err.message || "Custom seed failed",
          },
          { status: 500 }
        );
      }
    }

    // Random path
    const deck = shuffle(buildAllCombos());
    const picks = deck.slice(0, count);

    const results = [];
    const errors: string[] = [];

    for (const combo of picks) {
      try {
        results.push(await createOneDemo(makePublic, combo));
      } catch (err: any) {
        console.error("seed error", err);
        errors.push(
          `${combo.style}/${combo.focus}${combo.filthyMode ? `/${combo.filthyMode}` : ""}: ${
            err.message || "failed"
          }`
        );
      }
    }

    await writeAudit({
      action: "seed_demos",
      details: `created ${results.length}, errors ${errors.length}, public=${makePublic}, combos=${picks
        .map((c) => `${c.style}+${c.focus}${c.filthyMode ? `+${c.filthyMode}` : ""}`)
        .join(",")}`,
    });

    if (results.length === 0) {
      return NextResponse.json(
        {
          success: false,
          created: 0,
          results: [],
          errors,
          error: errors[0] || "Seed failed",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      created: results.length,
      results,
      errors,
      combosUsed: picks,
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
        "id, user_id, style, focus, score, rarity, verdict, image_url, is_public, is_demo, likes, dislikes, filthy_mode, created_at"
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
      .select("id, user_id, image_url")
      .eq("is_demo", true);

    const userIds = [
      ...new Set((demos || []).map((d) => d.user_id).filter(Boolean)),
    ] as string[];

    for (const d of demos || []) {
      if (d.image_url && d.user_id) {
        try {
          const marker = `/judgment-images/`;
          const idx = d.image_url.indexOf(marker);
          if (idx !== -1) {
            const path = d.image_url.slice(idx + marker.length);
            await supabase.storage.from("judgment-images").remove([path]);
          }
        } catch {
          // continue
        }
      }
    }

    await supabase.from("judgments").delete().eq("is_demo", true);

    for (const uid of userIds) {
      try {
        await supabase.from("profiles").delete().eq("id", uid);
      } catch {
        // continue
      }
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
