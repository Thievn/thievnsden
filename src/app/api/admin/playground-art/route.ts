import { NextRequest, NextResponse } from "next/server";
import { PLAYGROUND_GAMES, artUrlMap, type PlaygroundGameId } from "@/lib/playground-games";
import { generatePlaygroundStill, loadPlaygroundArt } from "@/lib/playground-art";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const maxDuration = 180;

const IDS = new Set(PLAYGROUND_GAMES.map((g) => g.id));

export async function GET() {
  try {
    const art = await loadPlaygroundArt();
    return NextResponse.json({ art, urls: artUrlMap(art) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message, art: {}, urls: {} }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const extra = String(body.extra || "").trim();
    const one = String(body.id || "").trim() as PlaygroundGameId;
    const ids: PlaygroundGameId[] = IDS.has(one)
      ? [one]
      : PLAYGROUND_GAMES.map((g) => g.id);

    const results: { id: PlaygroundGameId; url: string }[] = [];
    const errors: string[] = [];
    for (const id of ids) {
      try {
        const shot = await generatePlaygroundStill(id, extra);
        results.push({ id: shot.id, url: shot.url });
      } catch (err: unknown) {
        errors.push(`${id}: ${err instanceof Error ? err.message : "failed"}`);
      }
    }

    if (!results.length) {
      return NextResponse.json({ error: errors.join(" | ") || "No stills" }, { status: 500 });
    }

    await writeAudit({
      action: "playground_art",
      details: results.map((r) => r.id).join(","),
    });
    const art = await loadPlaygroundArt();
    return NextResponse.json({
      ok: true,
      results,
      errors,
      art,
      urls: artUrlMap(art),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
