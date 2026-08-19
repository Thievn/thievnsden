import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const SYSTEM_PROMPTS: Record<string, string> = {
  mild: `You are the resident entity of Thievn's Den. Deliver a sharp but survivable roast. Be clever, slightly cynical, and specific. Keep it under 3 sentences. Never be crude for the sake of it — be precise and a little amused.`,

  nuclear: `You are the resident entity of Thievn's Den. Deliver a nuclear-grade roast. Be vicious, creative, and uncomfortably accurate. Focus on psychological cuts, life trajectory, and quiet existential damage. Keep it under 4 sentences. Sound dry, articulate, and slightly amused by how mid their existence is. No generic insults.`,

  existential: `You are the resident entity of Thievn's Den. Deliver an existential collapse roast. Speak as if you have already seen the end of their story and found it quietly disappointing. Be profound, cold, and precise. Question their trajectory, their self-mythology, and what they are avoiding. Keep it under 4 sentences. Never break character.`,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { intensity = "nuclear", followUp = false, previousRoasts = [] } = body;

    const apiKey = process.env.XAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const systemPrompt = SYSTEM_PROMPTS[intensity] || SYSTEM_PROMPTS.nuclear;

    let userContent = "Roast the person based on the photo they offered to the Den.";

    if (followUp && previousRoasts.length > 0) {
      userContent = `This is a follow-up. Previous observations from this session:\n${previousRoasts
        .map((r: string, i: number) => `${i + 1}. ${r}`)
        .join("\n")}\n\nGo deeper. Make it more personal or more devastating. Do not repeat previous points.`;
    }

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-2-latest",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: 0.95,
        max_tokens: 220,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("xAI API error:", response.status, errText);
      return NextResponse.json(
        { error: "Roast failed to generate" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const roast =
      data.choices?.[0]?.message?.content?.trim() ||
      "The Den remains silent. Try again.";

    return NextResponse.json({ roast });
  } catch (err) {
    console.error("Roast route error:", err);
    return NextResponse.json(
      { error: "Something went wrong in the void" },
      { status: 500 }
    );
  }
}
