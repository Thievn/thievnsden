import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

function allowed(host: string) {
  const h = host.toLowerCase();
  return (
    h === "rawg.io" ||
    h.endsWith(".rawg.io") ||
    h.includes("steamstatic") ||
    h.includes("steamcdn") ||
    h.includes("akamaihd.net") ||
    h.includes("cloudfront.net") ||
    h.endsWith("igdb.com") ||
    h.includes("supabase.co") ||
    h.includes("steamcommunity") ||
    h.includes("xboxlive.com") ||
    h.includes("epicgames.com")
  );
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("u") || "";
  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new NextResponse("bad url", { status: 400 });
  }
  if (target.protocol !== "https:" || !allowed(target.hostname)) {
    return new NextResponse("host not allowed", { status: 400 });
  }

  const upstream = await fetch(target.toString(), {
    redirect: "follow",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      Referer: target.hostname.includes("rawg") ? "https://rawg.io/" : "https://store.steampowered.com/",
    },
    cache: "no-store",
  });
  if (!upstream.ok) return new NextResponse("cover missing", { status: 502 });
  const bytes = new Uint8Array(await upstream.arrayBuffer());
  if (bytes.byteLength < 80) return new NextResponse("empty cover", { status: 502 });
  const type = upstream.headers.get("content-type") || "image/jpeg";
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": type.startsWith("image/") ? type : "image/jpeg",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
