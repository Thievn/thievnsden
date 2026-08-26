import type { Metadata } from "next";
import { CLASSICS } from "@/lib/thoughts-packs";
import { createServiceClient } from "@/lib/supabase/server";
import { HomeDen, type HomeThought, type HomeGameCover } from "@/components/home/HomeDen";

export const metadata: Metadata = {
  title: { absolute: "Thievn's Den — Dark humor, AI art, and unfiltered thoughts" },
  description:
    "Thievn's Den is a personal site for dark humor, honest essays, AI-generated art, gaming takes, and tools like Face The Den. Unfiltered, not corporate.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Thievn's Den",
    description:
      "Dark humor, honest writing, AI art, gaming, and experimental tools. Welcome to the Den.",
    url: "https://thievnsden.com",
  },
};

async function loadHome() {
  const fallback: HomeThought[] = CLASSICS.slice(0, 3).map((c) => ({
    title: c.title,
    excerpt: c.excerpt,
    slug: c.slug,
  }));
  try {
    const supabase = createServiceClient();
    const [thoughtsRes, printsRes, settingsRes] = await Promise.all([
      supabase
        .from("den_thoughts")
        .select("title, excerpt, slug")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("afterimage_prints")
        .select("image_url")
        .eq("is_public", true)
        .eq("rejected", false)
        .order("created_at", { ascending: false })
        .limit(24),
      supabase.from("site_settings").select("gaming_items").eq("id", 1).maybeSingle(),
    ]);

    const thoughts = (thoughtsRes.data as HomeThought[] | null)?.filter((t) => t?.slug) || [];
    const prints = (printsRes.data || [])
      .map((row) => String(row.image_url || ""))
      .filter(Boolean);
    const items = Array.isArray(settingsRes.data?.gaming_items) ? settingsRes.data.gaming_items : [];
    const gamingCovers: HomeGameCover[] = items
      .filter((row: { cover?: string; title?: string }) => row?.cover && row?.title)
      .map((row: { cover: string; title: string; kind?: string }) => ({
        cover: String(row.cover),
        title: String(row.title),
        kind: row.kind,
      }));
    const prefer =
      gamingCovers.find((g) => g.kind === "playing") ||
      gamingCovers[0] ||
      null;
    return {
      thoughts: thoughts.length ? thoughts : fallback,
      prints,
      gamingCovers,
      gamingTitle: prefer?.title || null,
    };
  } catch {
    return {
      thoughts: fallback,
      prints: [] as string[],
      gamingCovers: [] as HomeGameCover[],
      gamingTitle: null,
    };
  }
}

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const home = await loadHome();
  return (
    <HomeDen
      thoughts={home.thoughts}
      prints={home.prints}
      gamingCovers={home.gamingCovers}
      gamingTitle={home.gamingTitle}
    />
  );
}
