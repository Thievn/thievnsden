import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { getRarity } from "@/lib/gallery";
import { ShareActions } from "./ShareActions";

type Props = { params: Promise<{ id: string }> };

async function getCard(id: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("judgments")
    .select(
      "id, user_id, style, focus, score, rarity, verdict, image_url, is_public, likes, dislikes, created_at"
    )
    .eq("id", id)
    .eq("is_public", true)
    .maybeSingle();

  if (!data) return null;

  let username = "Anonymous";
  if (data.user_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", data.user_id)
      .maybeSingle();
    if (profile?.username) username = profile.username;
  }

  return { ...data, username };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const card = await getCard(id);
  if (!card) {
    return { title: "Card not found" };
  }

  const title = `${card.rarity} · ${Number(card.score).toFixed(1)}/10 — Face The Den`;
  const description =
    card.verdict.slice(0, 140) + (card.verdict.length > 140 ? "…" : "");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://thievnsden.com/g/${id}`,
      images: card.image_url
        ? [{ url: card.image_url }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ShareCardPage({ params }: Props) {
  const { id } = await params;
  const card = await getCard(id);
  if (!card) notFound();

  const rarity = getRarity(Number(card.score));

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="void-orb-a absolute top-[-10%] left-[20%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,_rgba(185,28,92,0.12)_0%,_transparent_70%)] blur-2xl" />
        <div className="void-orb-b absolute bottom-[10%] right-[10%] h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,_rgba(124,58,237,0.1)_0%,_transparent_70%)] blur-2xl" />
      </div>

      <div className="relative max-w-md mx-auto px-4 py-10 sm:py-14">
        <p className="text-center text-[11px] uppercase tracking-[0.22em] text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 mb-6 font-medium">
          Shared from the Den
        </p>

        <div
          className={`rounded-2xl border-2 ${rarity.border} ${rarity.glow} bg-gradient-to-b ${rarity.bg} overflow-hidden`}
        >
          <div className="flex items-center justify-between px-3 pt-3 pb-2">
            <span className={`text-[10px] font-semibold uppercase tracking-[0.15em] ${rarity.text}`}>
              {card.rarity}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-neutral-500">
                ↑ {card.likes || 0} · ↓ {card.dislikes || 0}
              </span>
              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/40 border ${rarity.border}`}
              >
                <span className={`text-sm font-bold tabular-nums ${rarity.text}`}>
                  {Number(card.score).toFixed(1)}
                </span>
                <span className="text-[9px] text-neutral-500">/10</span>
              </div>
            </div>
          </div>

          <div className="px-3">
            <div
              className={`relative aspect-[3/4] w-full rounded-xl overflow-hidden border ${rarity.border} bg-black`}
            >
              {card.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={card.image_url}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-[#141414] to-[#0a0a0a]">
                  <div className="w-14 h-14 rounded-full border border-neutral-800 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-red-500 to-purple-500 opacity-70" />
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />
              <div className="absolute bottom-2 left-2 right-2 flex justify-between">
                <span className="text-xs text-neutral-200 font-medium">{card.username}</span>
                <span className="text-[10px] uppercase tracking-wide text-neutral-400">
                  {card.style} · {card.focus}
                </span>
              </div>
            </div>
          </div>

          <div className="px-3 pt-3 pb-4">
            <p className="text-sm text-neutral-200 leading-relaxed">{card.verdict}</p>
          </div>

          <div className={`h-1 w-full bg-gradient-to-r ${rarity.bar} opacity-80`} />
        </div>

        <ShareActions id={card.id} />

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center text-center">
          <Link
            href="/gallery"
            className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            Open Gallery →
          </Link>
          <Link
            href="/playground"
            className="text-sm text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400"
          >
            Face The Den →
          </Link>
        </div>
      </div>
    </div>
  );
}
