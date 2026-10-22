const EXPLICIT =
  /\b(nud(e|es|ity)|naked|nsfw|topless|bottomless|undress\w*|unclothe\w*|disrobe\w*|strip(ped|ping|s)?\b(?! ?(mall|light|club))|take (off|away) (her|his|their|the) (clothes|clothing|outfit|top|shirt|bra|dress|skirt|pants|panties|underwear|bikini)|remov\w* (all )?(of )?(her|his|their|the)? ?(clothes|clothing|outfit|top|shirt|bra|dress|skirt|pants|jeans|panties|underwear|bikini|lingerie|towel)|without (any )?(clothes|clothing|top|bra|panties|underwear)|no (clothes|clothing|top|bra|panties|underwear)|bare (breasts?|chest|butt|ass|skin)|nipples?|areola\w*|breasts?|boobs?|tits?|titties|genital\w*|pussy|vagina\w*|vulva|labia|penis|cock|dick|erect\w*|testic\w*|butt ?hole|anus|sex(ual|y)?\b|porn\w*|explicit|xxx|erotic\w*|lewd|cum\b|orgasm\w*|masturbat\w*|see[- ]?through|sheer|transparent (top|dress|shirt|bra|lingerie)|wet (t-?shirt|shirt)|lingerie|g-?string|thong|pasties|implied nudity|covering (her|his) (breasts|chest))/i;

async function grok(messages: unknown[]) {
  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.XAI_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: process.env.XAI_VISION_MODEL || process.env.XAI_MODEL || "grok-4.20-0309-non-reasoning",
      temperature: 0,
      messages,
    }),
  });
  const body = (await response.json().catch(() => ({}))) as { choices?: { message?: { content?: string } }[] };
  const out = body.choices?.[0]?.message?.content?.trim();
  if (!response.ok || !out) throw new Error(`screening service unavailable (${response.status})`);
  const match = /\{[\s\S]*\}/.exec(out);
  if (!match) throw new Error("screening returned no verdict");
  return JSON.parse(match[0]) as { explicit?: boolean; why?: string };
}

export async function isExplicitEdit(instr: string) {
  const hit = EXPLICIT.exec(String(instr || ""));
  if (hit) return { explicit: true, why: `"${hit[0]}"` };
  if (!String(instr || "").trim()) return { explicit: false, why: "" };
  const verdict = await grok([
    {
      role: "system",
      content:
        'You classify image-EDIT instructions. Reply ONLY JSON {"explicit":true|false,"why":"short"}. explicit=true if the edit would make the person nude, partially nude, undressed, in lingerie/underwear/see-through clothing, or sexual/erotic, including euphemisms (e.g. "birthday suit", "less fabric", "make it spicier", "lose the top"). Ordinary outfit swaps, poses, backgrounds, swimwear-free retouching, hair, makeup, lighting = false.',
    },
    { role: "user", content: String(instr).slice(0, 2000) },
  ]);
  return { explicit: !!verdict.explicit, why: verdict.why || "classifier" };
}

// Strict nudity intent for the explicit LoRA: only plain, unambiguous requests. Euphemisms never load it.
const STRICT_NUDE = /\b(nude|naked|nudity|fully nude|topless|bottomless|bare breasts?|nipples?|genitals?|pussy|vagina|vulva|penis|explicit nude|nsfw nude)\b/i;
export function strictNude(instr: string) {
  return STRICT_NUDE.test(String(instr || ""));
}

// Does a text-to-image prompt target a real, identifiable person (celebrity, named public figure, "photo of my ex")?
// Used only to mark generator outputs as not eligible for explicit edits. Fails closed (true) on errors.
export async function namesRealPerson(prompt: string) {
  if (!String(prompt || "").trim()) return false;
  try {
    const verdict = (await grok([
      {
        role: "system",
        content:
          'Reply ONLY JSON {"explicit":true|false,"why":"short"}. Set explicit=true if this image prompt asks to depict a specific real, identifiable person (a celebrity, public figure, influencer, named private individual, or "looks like <real name>"). Fictional characters and generic descriptions = false.',
      },
      { role: "user", content: String(prompt).slice(0, 2000) },
    ])) as { explicit?: boolean };
    return Boolean(verdict.explicit);
  } catch {
    return true;
  }
}
