import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/audit";
import { getRarity } from "@/lib/gallery";

export const runtime = "nodejs";
export const maxDuration = 120;

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

const FOCUS_SHOT: Record<string, string> = {
  overall: "selfie showing face and upper body clearly",
  face: "close-up face selfie, face fills most of the frame",
  body: "mirror selfie showing full body from head to thighs",
  tits: "mirror selfie angled to clearly show chest and torso",
  ass: "mirror selfie from a side or three-quarter back angle showing lower body and ass",
  vibe: "candid selfie with strong mood and expression",
};

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
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
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

async function generateSelfieImage(prompt: string) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY missing");

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
      errors.push(`${model}: ${res.status} ${(await res.text()).slice(0, 180)}`);
      continue;
    }

    const data = await res.json();
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) {
      errors.push(`${model}: empty b64`);
      continue;
    }
    return { b64, dataUrl: `data:image/jpeg;base64,${b64}` };
  }

  throw new Error(`IMAGE_GEN_FAILED: ${errors.join(" | ")}`);
}

async function uploadImage(userId: string, b64: string) {
  const supabase = createServiceClient();
  const bytes = Buffer.from(b64, "base64");
  const path = `${userId}/${Date.now()}.jpg`;

  const { error } = await supabase.storage.from("judgment-images").upload(path, bytes, {
    contentType: "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error(`STORAGE_FAILED: ${error.message}`);

  const { data } = supabase.storage.from("judgment-images").getPublicUrl(path);
  if (!data?.publicUrl) throw new Error("STORAGE_FAILED: no public URL");
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
    throw new Error(`VISION_FAILED: ${res.status} ${(await res.text()).slice(0, 200)}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error("VISION_FAILED: empty response");
  return parseScoreVerdict(raw);
}

async function removeStorageUrl(supabase: ReturnType<typeof createServiceClient>, imageUrl: string | null) {
  if (!imageUrl) return;
  try {
    const marker = `/judgment-images/`;
    const idx = imageUrl.indexOf(marker);
    if (idx !== -1) {
      const path = imageUrl.slice(idx + marker.length);
      await supabase.storage.from("judgment-images").remove([path]);
    }
  } catch {
    // best effort
  }
}

async function loadDemo(id: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("judgments")
    .select(
      "id, user_id, style, focus, filthy_mode, score, rarity, verdict, image_url, is_public, is_demo, likes, dislikes"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Demo not found");
  if (!data.is_demo) throw new Error("Not a demo judgment");
  return { supabase, data };
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    if (action !== "image" && action !== "verdict") {
      return NextResponse.json(
        { error: 'action must be "image" or "verdict"' },
        { status: 400 }
      );
    }

    if (!process.env.XAI_API_KEY) {
      return NextResponse.json({ error: "XAI_API_KEY missing" }, { status: 500 });
    }

    const { supabase, data: demo } = await loadDemo(id);

    if (action === "image") {
      const focus = (demo.focus as string) || "overall";
      const presentation: "woman" | "man" = Math.random() < 0.6 ? "woman" : "man";
      const ageBand = pick([
        "early 20s",
        "mid 20s",
        "late 20s",
        "early 30s",
        "mid 30s",
        "early 40s",
      ]);
      const setting = pick(SETTINGS);
      const outfit = presentation === "man" ? pick(OUTFITS_MAN) : pick(OUTFITS_WOMAN);
      const uniq = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

      const genderLock =
        presentation === "woman"
          ? "adult woman, clearly female presentation"
          : "adult man, clearly male presentation";

      const prompt = [
        "Photorealistic amateur phone selfie photo,",
        `${genderLock} looking ${ageBand},`,
        `wearing ${outfit},`,
        setting + ",",
        (FOCUS_SHOT[focus] || FOCUS_SHOT.overall) + ",",
        "unique face, distinct individual features, not a stock model,",
        `variation seed ${uniq},`,
        "shot on a real smartphone, natural skin texture, realistic pores,",
        "slightly imperfect framing like a real selfie, natural lighting,",
        "no makeup perfection, no studio lighting, no fashion catalog look,",
        "no text, no watermark, no logo, not AI-looking, authentic candid selfie",
      ].join(" ");

      const { b64, dataUrl } = await generateSelfieImage(prompt);
      if (!demo.user_id) throw new Error("Demo has no user_id");

      const imageUrl = await uploadImage(demo.user_id, b64);
      await removeStorageUrl(supabase, demo.image_url);

      // Re-judge against the new image so text matches the pic
      const { verdict, score } = await visionJudge({
        style: demo.style,
        focus: demo.focus,
        filthyMode: demo.filthy_mode,
        imageDataUrl: dataUrl,
      });
      const rarity = getRarity(score).name;

      const { data: updated, error } = await supabase
        .from("judgments")
        .update({
          image_url: imageUrl,
          verdict,
          score,
          rarity,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);

      await writeAudit({
        action: "seed_regen_image",
        details: `judgment ${id}`,
      });

      return NextResponse.json({ success: true, judgment: updated });
    }

    // action === "verdict"
    if (!demo.image_url) {
      return NextResponse.json(
        { error: "No image on this demo — regen image first" },
        { status: 400 }
      );
    }

    const { verdict, score } = await visionJudge({
      style: demo.style,
      focus: demo.focus,
      filthyMode: demo.filthy_mode,
      imageDataUrl: demo.image_url,
    });
    const rarity = getRarity(score).name;

    const { data: updated, error } = await supabase
      .from("judgments")
      .update({ verdict, score, rarity })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    await writeAudit({
      action: "seed_regen_verdict",
      details: `judgment ${id}`,
    });

    return NextResponse.json({ success: true, judgment: updated });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const { supabase, data: demo } = await loadDemo(id);

    await removeStorageUrl(supabase, demo.image_url);

    const { error: delErr } = await supabase.from("judgments").delete().eq("id", id);
    if (delErr) throw new Error(delErr.message);

    if (demo.user_id) {
      // Only wipe auth/profile if this user has no other judgments
      const { count } = await supabase
        .from("judgments")
        .select("*", { count: "exact", head: true })
        .eq("user_id", demo.user_id);

      if (!count || count === 0) {
        try {
          await supabase.from("profiles").delete().eq("id", demo.user_id);
        } catch {
          // ignore
        }
        try {
          await supabase.auth.admin.deleteUser(demo.user_id);
        } catch {
          // ignore
        }
      }
    }

    await writeAudit({
      action: "seed_delete_one",
      details: `judgment ${id}`,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Delete failed" }, { status: 500 });
  }
}
