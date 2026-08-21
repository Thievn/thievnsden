import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/audit";
import { getRarity } from "@/lib/gallery";

export const runtime = "nodejs";
export const maxDuration = 120;

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
  ageBand?: string;
  ethnicity?: string;
  bodyType?: string;
  height?: string;
  expression?: string;
  hair?: string;
  camera?: string;
  pose?: string;
  setting?: string;
  outfit?: string;
  chest?: string;
  style?: string;
  focus?: string;
  filthyMode?: string | null;
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
  "nova", "phoenix", "sage", "rowan", "dakota", "sydney", "london", "brooklyn",
  "marcus", "tyler", "brandon", "kevin", "jason", "eric", "derek", "seth",
  "maya", "priya", "aisha", "sofia", "camila", "valentina", "yuki", "hana",
  "kenji", "rafael", "diego", "omar", "amir", "leo", "nico", "andre",
];

const LAST_BITS = [
  "lee", "rae", "ann", "mae", "rose", "lynn", "kate", "jay", "nix", "ray",
  "fox", "brook", "vale", "hayes", "west", "lane", "reed", "blake", "cole", "drew",
  "stone", "cross", "wild", "sharp", "quiet", "bold", "fast", "dark",
];

const FLIRTY = [
  "softlips", "afterhours", "notyourtype", "badidea", "onemoredrink",
  "donttext", "lowkeyhot", "quiettrouble", "slowburn", "nightshift", "barelydressed",
  "yourmove", "leftonread", "nofilterx", "justlooking", "boredtonight",
  "almostready", "lastcall", "mirrorcheck", "outtoolate", "wrongnumber",
  "stayawhile", "closetab", "dimlight", "nocamera", "unsent",
];

const SETTINGS = [
  "bedroom, soft warm lamp light",
  "bedroom, dim evening light",
  "bathroom mirror, overhead light",
  "car interior, night dashboard glow",
  "standing against a car outside",
  "beach, natural daylight",
  "gym locker mirror",
  "coffee shop near a window",
  "balcony, soft city lights",
  "hotel room, warm ambient light",
  "living room couch",
  "bar / club bathroom mirror",
  "outdoor night street",
  "rooftop, golden hour",
];

const OUTFITS_WOMAN = [
  "casual fitted t-shirt",
  "simple tank top",
  "crop top and jeans",
  "oversized hoodie",
  "sundress",
  "bikini",
  "lingerie set",
  "panties only",
  "bra and panties",
  "workout leggings and sports bra",
  "going-out tight dress",
];

const OUTFITS_MAN = [
  "casual fitted t-shirt",
  "hoodie",
  "tank top",
  "gym shirt",
  "button-up shirt",
  "shirtless",
  "open unbuttoned shirt",
  "swim trunks",
  "sweatpants no shirt",
];

const AGE_BANDS = ["18-20", "21-24", "25-29", "30-34", "35-39", "40-44", "45-50"];

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

const CAMERA_LANG: Record<string, string> = {
  mirror_selfie: "mirror selfie taken by the subject themselves",
  self_held: "phone selfie held out at arm's length by the subject",
  other_person: "candid photo taken by another person, not a self-held selfie",
};

const POSE_LANG: Record<string, string> = {
  front: "facing the camera directly",
  three_quarter: "three-quarter angle to the camera",
  side: "side profile view",
  over_shoulder: "looking back over one shoulder toward the camera",
  back_ass: "back view with clear focus on lower body and ass, looking over shoulder or face partially visible",
  full_body: "full body visible from head to roughly mid-thigh or feet",
  close_face: "close-up on the face, face fills most of the frame",
  overhead: "shot from slightly above, subject looking up toward the camera",
  lying_down: "lying down on a bed or couch",
  sitting: "sitting down",
  leaning: "leaning against a wall, car, or furniture",
};

const CHEST_LANG: Record<string, string> = {
  covered: "chest fully covered by clothing",
  low_cut: "low-cut top showing cleavage",
  bare: "topless, bare breasts visible, still an amateur photo not a porn set",
};

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomUsername() {
  const mode = Math.random();
  if (mode < 0.3) {
    const n = Math.floor(Math.random() * 99) + 1;
    const pad = n < 10 ? `0${n}` : String(n);
    return `${pick(FIRST)}${Math.random() < 0.5 ? pad : n}`;
  }
  if (mode < 0.5) return `${pick(FIRST)}${pick(LAST_BITS)}`;
  if (mode < 0.65) return `${pick(FIRST)}${pick(LAST_BITS)}${Math.floor(Math.random() * 9) + 1}`;
  if (mode < 0.85) {
    const base = pick(FLIRTY).replace(/\s+/g, "");
    return Math.random() < 0.45 ? `${base}${Math.floor(Math.random() * 50) + 1}` : base;
  }
  if (mode < 0.93) return `${pick(FIRST)}_${pick(LAST_BITS)}`;
  return `${pick(FIRST)}${90 + Math.floor(Math.random() * 16)}`;
}

function buildImagePrompt(opts: {
  presentation: "woman" | "man";
  ageBand: string;
  ethnicity?: string;
  bodyType?: string;
  height?: string;
  expression?: string;
  hair?: string;
  camera?: string;
  pose?: string;
  setting: string;
  outfit: string;
  chest?: string;
  focus: Focus;
  uniq: string;
}) {
  const genderLock =
    opts.presentation === "woman"
      ? "adult woman, clearly female presentation"
      : "adult man, clearly male presentation";

  const agePhrase = opts.ageBand.includes("-")
    ? `appearing ${opts.ageBand} years old`
    : `looking ${opts.ageBand}`;

  const ethnicity =
    opts.ethnicity && opts.ethnicity !== "random"
      ? `of ${opts.ethnicity} appearance,`
      : "";

  const body = opts.bodyType ? `${opts.bodyType} body type,` : "";
  const height = opts.height ? `${opts.height},` : "";
  const hair = opts.hair ? opts.hair + "," : "";
  const expression = opts.expression ? opts.expression + "," : "";

  const camera =
    CAMERA_LANG[opts.camera || ""] ||
    "amateur phone photo, natural selfie or candid style";
  const pose = POSE_LANG[opts.pose || ""] || "natural standing or casual pose";

  let chest = "";
  if (opts.presentation === "woman" && opts.chest && CHEST_LANG[opts.chest]) {
    chest = CHEST_LANG[opts.chest] + ",";
  } else if (opts.presentation === "man" && opts.chest === "bare") {
    chest = "shirtless, bare chest visible,";
  }

  // Focus-driven framing hint (still overridden by explicit pose when set)
  const focusHint =
    opts.pose === "back_ass" || opts.focus === "ass"
      ? "composition emphasizes lower body and ass,"
      : opts.focus === "tits"
        ? "composition emphasizes chest and torso,"
        : opts.focus === "face"
          ? "face is the clear primary subject,"
          : "";

  return [
    "Photorealistic amateur phone photo,",
    genderLock + ",",
    ethnicity,
    agePhrase + ",",
    body,
    height,
    hair,
    expression,
    `wearing ${opts.outfit},`,
    chest,
    opts.setting + ",",
    camera + ",",
    pose + ",",
    focusHint,
    "unique individual, distinct facial features, not a repeated face or stock model,",
    `variation seed ${opts.uniq},`,
    "shot on a real smartphone, natural skin texture, realistic pores,",
    "slightly imperfect framing like a real phone photo, natural lighting,",
    "no makeup perfection, no studio lighting, no fashion catalog look,",
    "no text, no watermark, no logo, not AI-looking, authentic candid photo",
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
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
    " Always end your response with a score on a new line in this exact format: SCORE: X.X (1.0 to 10.0). Match the score to how positive or negative the judgment is. Never say there is no photo. Do not refuse adult or suggestive photos of adults.";

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

  let presentation: "woman" | "man";
  if (custom?.gender === "woman" || custom?.gender === "man") {
    presentation = custom.gender;
  } else {
    presentation = Math.random() < 0.6 ? "woman" : "man";
  }

  const outfitList = presentation === "man" ? OUTFITS_MAN : OUTFITS_WOMAN;
  let outfit = custom?.outfit?.trim() || pick(outfitList);
  if (presentation === "man" && OUTFITS_WOMAN.includes(outfit) && !OUTFITS_MAN.includes(outfit)) {
    outfit = pick(OUTFITS_MAN);
  }
  if (presentation === "woman" && OUTFITS_MAN.includes(outfit) && !OUTFITS_WOMAN.includes(outfit)) {
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
      presentation,
      ageBand,
      ethnicity: custom?.ethnicity,
      bodyType: custom?.bodyType,
      height: custom?.height,
      expression: custom?.expression,
      hair: custom?.hair,
      camera: custom?.camera,
      pose: custom?.pose,
      setting,
      outfit,
      chest: custom?.chest,
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

    const likes = Math.floor(Math.random() * 14) + 1;
    const dislikes = Math.floor(Math.random() * 5);

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
        pose: custom?.pose,
        camera: custom?.camera,
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
    const count = Math.min(Math.max(Number(body.count) || 1, 1), 2);
    const makePublic = body.makePublic !== false;
    const custom: CustomOpts | undefined = body.custom || undefined;

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
          details: `custom 1, public=${makePublic}, gender=${custom.gender || "auto"}, pose=${custom.pose || "-"}, style=${combo.style}+${combo.focus}`,
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
      details: `created ${results.length}, errors ${errors.length}, public=${makePublic}`,
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
