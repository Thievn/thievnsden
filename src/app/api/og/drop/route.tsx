import { NextRequest } from "next/server";
import { renderDropCard } from "@/lib/drop-card";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  return renderDropCard({
    kind: searchParams.get("kind") || "den",
    aspect: searchParams.get("aspect") || "16:9",
    id: searchParams.get("id") || "",
  });
}
