import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 86400;

function allowed(host: string) {
  return (
    host.endsWith("rawg.io") ||
    host.includes("steamstatic") ||
    host.includes("steamcdn") ||
    host.includes("akamaihd.net") ||
    host.endsWith("igdb.com") ||
    host.includes("supabase.co")
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
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    },
    next: { revalidate: 86400 },
  });
  if (!upstream.ok) return new NextResponse("cover missing", { status: 502 });
  const bytes = new Uint8Array(await upstream.arrayBuffer());
  const type = upstream.headers.get("content-type") || "image/jpeg";
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": type.startsWith("image/") ? type : "image/jpeg",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
