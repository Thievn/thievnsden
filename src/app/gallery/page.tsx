"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getRarity, type GalleryJudgment } from "@/lib/gallery";
import { supabase } from "@/lib/supabase/client";

function getVoterKey(): string {
  if (typeof window === "undefined") return "anon";
  const existing = localStorage.getItem("den_voter_key");
  if (existing) return existing;
  const key = `v_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
  localStorage.setItem("den_voter_key", key);
  return key;
}

export default function GalleryPage() {
  const [cards, setCards] = useState<GalleryJudgment[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exitDir, setExitDir] = useState<"left" | "right" | null>(null);
  const [busy, setBusy] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/judgments?public=1");
        const data = await res.json();
        setCards(data.judgments || []);
      } catch {
        setCards([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    setExpanded(false);
  }, [index]);

  const current = cards[index] || null;
  const nextCard = cards[index + 1] || null;
  const rarity = current ? getRarity(Number(current.score)) : null;

  const advance = useCallback(() => {
    setExitDir(null);
    setIndex((i) => i + 1);
    setBusy(false);
  }, []);

  const vote = async (value: 1 | -1) => {
    if (!current || busy) return;
    setBusy(true);
    setExitDir(value === 1 ? "right" : "left");

    const voterKey = userId || getVoterKey();

    try {
      const res = await fetch("/api/gallery/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judgmentId: current.id,
          voterKey,
          value,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCards((prev) =>
          prev.map((c) =>
            c.id === current.id
              ? { ...c, likes: data.likes, dislikes: data.dislikes }
              : c
          )
        );
      }
    } catch {
      // still advance
    }

    setTimeout(advance, 280);
  };

  const skip = () => {
    if (busy || !current) return;
    setBusy(true);
    setExitDir(null);
    setTimeout(advance, 150);
  };

  return (
    <div className="relative min-h-[calc(100vh-8rem)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="void-orb-a absolute top-[-5%] left-[10%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,_rgba(185,28,92,0.14)_0%,_transparent_70%)] blur-2xl" />
        <div className="void-orb-b absolute bottom-[10%] right-[-5%] h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,_rgba(124,58,237,0.12)_0%,_transparent_70%)] blur-2xl" />
      </div>

      <div className="relative max-w-md mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-6">
          <p className="text-[11px] uppercase tracking-[0.22em] text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 mb-2 font-medium">
            The Den
          </p>
          <h1 className="text-2xl font-semibold text-neutral-50 tracking-tight">Gallery</h1>
          <p className="text-neutral-500 text-sm mt-1">Swipe the void. Judge the judged.</p>
        </div>

        {loading && (
          <p className="text-center text-neutral-500 text-sm py-20">Loading the stack…</p>
        )}

        {!loading && cards.length === 0 && (
          <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-10 text-center">
            <p className="text-neutral-400 text-sm mb-2">Gallery is empty.</p>
            <p className="text-neutral-600 text-xs mb-5">
              Save a Face The Den result and hit Post to Gallery — or seed demos in Admin.
            </p>
            <Link
              href="/playground"
              className="text-sm text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400"
            >
              Face The Den →
            </Link>
          </div>
        )}

        {!loading && index >= cards.length && cards.length > 0 && (
          <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-10 text-center">
            <p className="text-neutral-300 text-sm mb-2">End of the stack.</p>
            <p className="text-neutral-600 text-xs mb-5">Come back when more land in the Gallery.</p>
            <button
              onClick={() => setIndex(0)}
              className="px-4 py-2 rounded-xl border border-neutral-800 text-sm text-neutral-300 hover:border-neutral-600"
            >
              Start over
            </button>
          </div>
        )}

        {!loading && current && rarity && (
          <div className="relative h-[520px] sm:h-[560px]">
            {nextCard && (
              <div className="absolute inset-x-4 top-3 bottom-0 rounded-2xl border border-neutral-800/60 bg-[#0d0d0d] scale-[0.96] opacity-60" />
            )}

            <div
              className={`absolute inset-0 transition-all duration-300 ease-out ${
                exitDir === "left"
                  ? "-translate-x-[120%] rotate-[-12deg] opacity-0"
                  : exitDir === "right"
                    ? "translate-x-[120%] rotate-[12deg] opacity-0"
                    : "translate-x-0 rotate-0 opacity-100"
              }`}
            >
              <div
                className={`h-full rounded-2xl border-2 ${rarity.border} ${rarity.glow} bg-gradient-to-b ${rarity.bg} overflow-hidden flex flex-col`}
              >
                <div className="flex items-center justify-between px-3 pt-3 pb-2">
                  <span className={`text-[10px] font-semibold uppercase tracking-[0.15em] ${rarity.text}`}>
                    {current.rarity}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-neutral-500">
                      ↑ {current.likes || 0} · ↓ {current.dislikes || 0}
                    </span>
                    <div
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/40 border ${rarity.border}`}
                    >
                      <span className={`text-sm font-bold tabular-nums ${rarity.text}`}>
                        {Number(current.score).toFixed(1)}
                      </span>
                      <span className="text-[9px] text-neutral-500">/10</span>
                    </div>
                  </div>
                </div>

                <div className="px-3 flex-1 min-h-0">
                  <button
                    type="button"
                    onClick={() => current.image_url && setExpanded(true)}
                    className={`relative h-full min-h-[220px] max-h-[300px] w-full rounded-xl overflow-hidden border ${rarity.border} bg-black block text-left`}
                  >
                    {current.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={current.image_url}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover object-center"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-[#141414] to-[#0a0a0a]">
                        <div className="w-16 h-16 rounded-full border border-neutral-800 flex items-center justify-center">
                          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-red-500 to-purple-500 opacity-70" />
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
                    <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end pointer-events-none">
                      <span className="text-xs text-neutral-200 font-medium drop-shadow">
                        {current.username || "Anonymous"}
                      </span>
                      <span className="text-[10px] uppercase tracking-wide text-neutral-400">
                        {current.style} · {current.focus}
                      </span>
                    </div>
                    {current.image_url && (
                      <span className="absolute top-2 right-2 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-black/50 text-neutral-400 border border-neutral-800">
                        Tap to expand
                      </span>
                    )}
                  </button>
                </div>

                <div className="px-3 pt-3 pb-4">
                  <p className="text-[13px] text-neutral-200 leading-relaxed line-clamp-4">
                    {current.verdict}
                  </p>
                </div>

                <div className={`h-1 w-full bg-gradient-to-r ${rarity.bar} opacity-80`} />
              </div>
            </div>
          </div>
        )}

        {current && (
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              onClick={() => vote(-1)}
              disabled={busy}
              className="w-14 h-14 rounded-full border border-neutral-700 bg-[#111] text-neutral-400 hover:border-red-800/60 hover:text-red-300 hover:bg-red-950/20 transition-all disabled:opacity-40 text-lg"
              aria-label="Dislike"
            >
              ↓
            </button>
            <button
              onClick={skip}
              disabled={busy}
              className="px-5 h-11 rounded-full border border-neutral-800 text-xs text-neutral-500 hover:text-neutral-300 hover:border-neutral-600 transition-all disabled:opacity-40"
            >
              Next
            </button>
            <button
              onClick={() => vote(1)}
              disabled={busy}
              className="w-14 h-14 rounded-full border border-neutral-700 bg-[#111] text-neutral-400 hover:border-purple-700/60 hover:text-purple-300 hover:bg-purple-950/20 transition-all disabled:opacity-40 text-lg"
              aria-label="Like"
            >
              ↑
            </button>
          </div>
        )}

        {cards.length > 0 && index < cards.length && (
          <p className="text-center text-[11px] text-neutral-600 mt-4">
            {index + 1} / {cards.length}
          </p>
        )}

        <p className="text-center mt-6">
          <Link href="/leaderboard" className="text-xs text-neutral-600 hover:text-neutral-400">
            Ranks →
          </Link>
        </p>
      </div>

      {/* Fullscreen expand */}
      {expanded && current?.image_url && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setExpanded(false)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-neutral-400 hover:text-white text-sm px-3 py-2"
            onClick={() => setExpanded(false)}
          >
            Close
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.image_url}
            alt=""
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
