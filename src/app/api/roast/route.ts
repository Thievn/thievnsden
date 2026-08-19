import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const SYSTEM_PROMPTS: Record<string, string> = {
  mild: `You are the sharp-tongued resident of Thievn's Den. Deliver a short, clever roast. Dry humor. One or two sentences max. No essays. Make it sting a little but stay witty.`,

  nuclear: `You are the unhinged resident of Thievn's Den. Deliver a brutal, funny roast in 1-2 short sentences. Be specific, creative, and mean in a clever way. No long explanations. No soft landings. Punch hard and stop.`,

  existential: `You are the cold observer of Thievn's Den. Deliver a short, devastating existential roast. 1-2 sentences. Make them question their life choices without being wordy. Dry, final, a little funny.`,

  petty: `You are the petty resident of Thievn's Den. Deliver a short, petty, highly specific roast. Focus on small embarrassing details and low-stakes failures. 1-2 sentences. Petty and funny, not deep.`,

  deadpan: `You are the deadpan resident of Thievn's Den. Deliver a completely flat, emotionless roast that is somehow more cutting because of it. 1-2 short sentences. No enthusiasm. Just quiet judgment.`,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { intensity = "nuclear", followUp = false, previousRoasts = [] } = body;

    const apiKey = process.env.XAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const systemPrompt = SYSTEM_PROMPTS[intensity] || SYSTEM_PROMPTS.nuclear;

    let userContent =
      "Roast the person. Keep it short and sharp. No long paragraphs.";

    if (followUp && previousRoasts.length > 0) {
      userContent = `Previous roasts this session:\n${previousRoasts
        .map((r: string, i: number) => `${i + 1}. ${r}`)
        .join("\n")}\n\nGo harder or more specific. Still keep it to 1-2 short sentences. Do not repeat.`;
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
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: 1.0,
        max_tokens: 120,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("xAI API error:", response.status, errText);
      return NextResponse.json({ error: "Roast failed to generate" }, { status: 502 });
    }

    const data = await response.json();
    const roast =
      data.choices?.[0]?.message?.content?.trim() ||
      "The Den remains silent. Try again.";

    return NextResponse.json({ roast });
  } catch (err) {
    console.error("Roast route error:", err);
    return NextResponse.json({ error: "Something went wrong in the void" }, { status: 500 });
  }
}
