"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRarity } from "@/lib/gallery";

type Entry = {
  id: string;
  username: string;
  score: number;
  rarity: string;
  style: string;
  focus: string;
  likes: number;
  dislikes: number;
  verdict: string;
  created_at: string;
};

export default function LeaderboardPage() {
  const [byScore, setByScore] = useState<Entry[]>([]);
  const [byLikes, setByLikes] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"score" | "likes">("score");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/judgments?public=1");
        const data = await res.json();
        const list: Entry[] = data.judgments || [];
        setByScore(
          [...list].sort((a, b) => Number(b.score) - Number(a.score)).slice(0, 25)
        );
        setByLikes(
          [...list].sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 25)
        );
      } catch {
        setByScore([]);
        setByLikes([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const rows = tab === "score" ? byScore : byLikes;

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="void-orb-a absolute top-0 right-[10%] h-[280px] w-[280px] rounded-full bg-[radial-gradient(circle,_rgba(185,28,92,0.1)_0%,_transparent_70%)] blur-2xl" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="text-center mb-8">
          <p className="text-[11px] uppercase tracking-[0.22em] text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 mb-2 font-medium">
            Public only
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-50 tracking-tight">
            Leaderboard
          </h1>
          <p className="text-neutral-500 text-sm mt-1">Who survived the Den.</p>
        </div>

        <div className="flex justify-center gap-1 mb-6 p-1 rounded-xl bg-[#111] border border-neutral-800/80 w-fit mx-auto">
          <button
            onClick={() => setTab("score")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "score"
                ? "bg-gradient-to-r from-red-900/40 to-purple-900/40 text-neutral-100"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            Top scores
          </button>
          <button
            onClick={() => setTab("likes")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "likes"
                ? "bg-gradient-to-r from-red-900/40 to-purple-900/40 text-neutral-100"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            Most liked
          </button>
        </div>

        {loading && <p className="text-center text-sm text-neutral-500">Loading…</p>}

        {!loading && rows.length === 0 && (
          <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-10 text-center">
            <p className="text-sm text-neutral-500 mb-3">No public cards yet.</p>
            <Link href="/playground" className="text-sm text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400">
              Face The Den →
            </Link>
          </div>
        )}

        <div className="space-y-2">
          {rows.map((e, i) => {
            const rarity = getRarity(Number(e.score));
            return (
              <Link
                key={e.id}
                href={`/g/${e.id}`}
                className="flex items-center gap-3 rounded-xl border border-neutral-800/80 bg-[#111] p-3 sm:p-4 hover:border-neutral-700 transition-all"
              >
                <span className="w-7 text-center text-sm tabular-nums text-neutral-600 font-medium">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="text-sm text-neutral-200 font-medium truncate">
                      {e.username}
                    </span>
                    <span className={`text-[10px] uppercase tracking-wide ${rarity.text}`}>
                      {e.rarity}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 truncate">{e.verdict}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-semibold tabular-nums ${rarity.text}`}>
                    {Number(e.score).toFixed(1)}
                  </p>
                  <p className="text-[10px] text-neutral-600">
                    ↑ {e.likes || 0}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        <p className="text-center mt-8">
          <Link href="/gallery" className="text-sm text-neutral-500 hover:text-neutral-300">
            ← Back to Gallery
          </Link>
        </p>
      </div>
    </div>
  );
}
