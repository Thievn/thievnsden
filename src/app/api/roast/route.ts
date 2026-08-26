import { NextRequest, NextResponse } from "next/server";
import { userFromRequest } from "@/lib/auth-request";
import { buildRoastPrompts, roastMaxTokens } from "@/lib/face-the-den-prompts";
import { createServiceClient } from "@/lib/supabase/server";
import type { Angle, FilthyMode, Focus, Heat, Intensity, RoastLength, Style, Target } from "@/lib/face-the-den";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const user = await userFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Log in to face the Den." }, { status: 401 });
    }

    const supabase = createServiceClient();
    const { data: settings } = await supabase
      .from("site_settings")
      .select("roast_enabled")
      .eq("id", 1)
      .maybeSingle();
    if (settings && settings.roast_enabled === false) {
      return NextResponse.json({ error: "The Den is closed right now." }, { status: 503 });
    }

    const body = await req.json();
    const {
      style = "unhinged",
      focus = "overall",
      filthyMode = "mixed",
      intensity = "sharp",
      length = "standard",
      heat = "explicit",
      angle = "roast",
      target = "they",
      note = "",
      followUp = false,
      previous = [],
      image,
    } = body as {
      style?: Style;
      focus?: Focus;
      filthyMode?: FilthyMode;
      intensity?: Intensity;
      length?: RoastLength;
      heat?: Heat;
      angle?: Angle;
      target?: Target;
      note?: string;
      followUp?: boolean;
      previous?: string[];
      image?: string;
    };

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const prompts = buildRoastPrompts({
      style,
      intensity,
      length,
      heat,
      angle,
      focus,
      filthyMode,
      target,
      note: typeof note === "string" ? note : "",
      followUp: !!followUp,
      previous: Array.isArray(previous) ? previous.slice(-6) : [],
    });

    const userContent: Array<Record<string, unknown>> = [
      {
        type: "image_url",
        image_url: {
          url: image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}`,
        },
      },
      { type: "text", text: prompts.user },
    ];

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.3",
        messages: [
          { role: "system", content: prompts.system },
          { role: "user", content: userContent },
        ],
        temperature: 1.12,
        max_tokens: roastMaxTokens(length),
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("xAI API error:", response.status, errText);
      return NextResponse.json({ error: "Judgment failed" }, { status: 502 });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || "The Den stays quiet.";

    let score = 5.0;
    let verdict = raw;
    const scoreMatch = raw.match(/SCORE:\s*(\d+(?:\.\d+)?)/i);
    if (scoreMatch) {
      score = Math.min(10, Math.max(1, parseFloat(scoreMatch[1])));
      verdict = raw.replace(/SCORE:\s*\d+(?:\.\d+)?/i, "").trim();
    }

    return NextResponse.json({ verdict, score });
  } catch (err) {
    console.error("Roast route error:", err);
    return NextResponse.json({ error: "Something broke in the void" }, { status: 500 });
  }
}
