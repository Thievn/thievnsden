import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 86400;

const ALLOW = [
  "media.rawg.io",
  "images.rawg.io",
  "cdn.rawg.io",
  "steamcdn-a.akamaihd.net",
  "cdn.akamai.steamstatic.com",
  "shared.akamai.steamstatic.com",
  "cdn.cloudflare.steamstatic.com",
  "images.igdb.com",
];

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("u") || "";
  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new NextResponse("bad url", { status: 400 });
  }
  if (target.protocol !== "https:") return new NextResponse("https only", { status: 400 });
  if (!ALLOW.some((h) => target.hostname === h || target.hostname.endsWith(`.${h}`))) {
    return new NextResponse("host not allowed", { status: 400 });
  }

  const upstream = await fetch(target.toString(), {
    headers: { "User-Agent": "ThievnsDen/1.0", Accept: "image/*" },
    next: { revalidate: 86400 },
  });
  if (!upstream.ok) return new NextResponse("cover missing", { status: 502 });
  const buf = Buffer.from(await upstream.arrayBuffer());
  const type = upstream.headers.get("content-type") || "image/jpeg";
  return new NextResponse(buf, {
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
