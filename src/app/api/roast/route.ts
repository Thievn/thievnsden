import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const STYLE_PROMPTS: Record<string, string> = {
  honest: `You are a blunt, observant judge in Thievn's Den. Give an honest, human rating. Be direct. Use natural language. Short and sharp — 1 to 2 sentences max. No corporate softness.`,

  unhinged: `You are the unhinged resident of Thievn's Den. Full permission to swear, be dark, crude, and mean. Sound like a real person with no filter. 1 to 2 short sentences. No essays. Make it hit.`,

  filthy: `You are the filthy, explicit judge of Thievn's Den. You rate bodies and sexual energy with zero restraint. You can be degrading, objectifying, or worshipful. Use real sexual language, swear words, and direct talk about tits, ass, face, body, and how fuckable someone looks. Sound human, not like porn script. 1 to 2 short sentences max.`,

  petty: `You are petty and specific. Focus on small details, mid energy, and quiet shade. Allow swearing. Keep it short and human — 1 to 2 sentences.`,

  deadpan: `You are completely flat and cold. Deliver judgment with zero emotion. The lack of energy is the point. Short. Final. 1 to 2 sentences.`,
};

const FILTHY_SUB: Record<string, string> = {
  degrade: `Lean hard into degradation and objectification. Be mean about their body or sexual energy in an explicit way.`,
  worship: `Be explicitly positive and objectifying. Talk about their body like something you want. Still filthy and direct.`,
  mixed: `Mix degradation and desire. Point out flaws while still making it clear you'd fuck them (or wouldn't).`,
};

const FOCUS_HINTS: Record<string, string> = {
  overall: "Judge the whole package — face, body, and sexual energy together.",
  face: "Focus mainly on the face, expression, and how it lands sexually.",
  body: "Focus on overall body shape, proportions, and presence.",
  tits: "Focus specifically on their chest/tits. Be direct.",
  ass: "Focus specifically on their ass and lower body. Be direct.",
  vibe: "Focus on the sexual energy and vibe they give off more than pure looks.",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      style = "unhinged",
      focus = "overall",
      filthyMode = "mixed",
      followUp = false,
      previous = [],
    } = body;

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    let system = STYLE_PROMPTS[style] || STYLE_PROMPTS.unhinged;

    if (style === "filthy" && FILTHY_SUB[filthyMode]) {
      system += " " + FILTHY_SUB[filthyMode];
    }

    system += ` Always end your response with a score on a new line in this exact format: SCORE: X.X (where X.X is a number from 1.0 to 10.0). The score should match how positive or negative your judgment was.`;

    let userContent = `Focus: ${FOCUS_HINTS[focus] || FOCUS_HINTS.overall}\n\nJudge the person in the photo. Keep it short and human.`;

    if (followUp && previous.length > 0) {
      userContent = `Previous judgments this session:\n${previous
        .map((r: string, i: number) => `${i + 1}. ${r}`)
        .join("\n")}\n\nGo harder or more specific on the same focus. Still 1-2 short sentences. Do not repeat yourself. End with SCORE: X.X`;
    }

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.3",
        messages: [
          { role: "system", content: system },
          { role: "user", content: userContent },
        ],
        temperature: 1.05,
        max_tokens: 160,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("xAI API error:", response.status, errText);
      return NextResponse.json({ error: "Judgment failed" }, { status: 502 });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || "The Den stays quiet.";

    // Extract score
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
