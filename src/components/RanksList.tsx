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
  image_url?: string | null;
  created_at: string;
};

type Props = {
  /** Limit rows (default 25) */
  limit?: number;
  /** Compact mode for embedding in playground */
  compact?: boolean;
  /** Show header + tabs */
  showHeader?: boolean;
};

function rankBadge(i: number) {
  if (i === 0)
    return {
      label: "1",
      className:
        "bg-gradient-to-br from-amber-400 to-amber-600 text-black shadow-[0_0_14px_-2px_rgba(251,191,36,0.7)] border-amber-300/80",
    };
  if (i === 1)
    return {
      label: "2",
      className:
        "bg-gradient-to-br from-neutral-200 to-neutral-400 text-black shadow-[0_0_12px_-2px_rgba(212,212,212,0.5)] border-neutral-300/70",
    };
  if (i === 2)
    return {
      label: "3",
      className:
        "bg-gradient-to-br from-orange-600 to-amber-800 text-amber-50 shadow-[0_0_12px_-2px_rgba(194,65,12,0.5)] border-orange-500/60",
    };
  return {
    label: String(i + 1),
    className: "bg-[#0a0a0a] text-neutral-500 border-neutral-800",
  };
}

export function RanksList({ limit = 25, compact = false, showHeader = true }: Props) {
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
          [...list].sort((a, b) => Number(b.score) - Number(a.score)).slice(0, limit)
        );
        setByLikes(
          [...list].sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, limit)
        );
      } catch {
        setByScore([]);
        setByLikes([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [limit]);

  const rows = tab === "score" ? byScore : byLikes;

  return (
    <div className={compact ? "" : "relative"}>
      {showHeader && (
        <div className={`text-center ${compact ? "mb-5" : "mb-8"}`}>
          {!compact && (
            <p className="text-[11px] uppercase tracking-[0.22em] text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 mb-2 font-medium">
              Public only
            </p>
          )}
          <h2
            className={`${compact ? "text-xl" : "text-2xl sm:text-3xl"} font-semibold text-neutral-50 tracking-tight`}
          >
            {compact ? "Ranks" : "Leaderboard"}
          </h2>
          <p className="text-neutral-500 text-sm mt-1">
            {compact ? "Climb the Den." : "Who survived the Den."}
          </p>
        </div>
      )}

      <div className="flex justify-center gap-1 mb-5 p-1 rounded-xl bg-[#111] border border-neutral-800/80 w-fit mx-auto">
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
          Most claimed
        </button>
      </div>

      {loading && <p className="text-center text-sm text-neutral-500 py-8">Loading ranks…</p>}

      {!loading && rows.length === 0 && (
        <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-10 text-center">
          <p className="text-sm text-neutral-500 mb-3">No public cards yet.</p>
          <Link
            href="/playground"
            className="text-sm text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400"
          >
            Face The Den →
          </Link>
        </div>
      )}

      <div className="space-y-2.5">
        {rows.map((e, i) => {
          const rarity = getRarity(Number(e.score));
          const badge = rankBadge(i);
          const isTop3 = i < 3;

          return (
            <Link
              key={e.id}
              href={`/g/${e.id}`}
              className={`group flex items-center gap-3 rounded-xl border p-2.5 sm:p-3 transition-all ${
                isTop3
                  ? `${rarity.border} bg-gradient-to-r ${rarity.bg} hover:brightness-110`
                  : "border-neutral-800/80 bg-[#111] hover:border-neutral-700"
              }`}
            >
              {/* Rank number */}
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg border flex items-center justify-center text-xs sm:text-sm font-bold tabular-nums shrink-0 ${badge.className}`}
              >
                {badge.label}
              </div>

              {/* Thumbnail */}
              <div
                className={`w-12 h-14 sm:w-14 sm:h-16 rounded-lg overflow-hidden border shrink-0 bg-black ${
                  isTop3 ? rarity.border : "border-neutral-800"
                }`}
              >
                {e.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={e.image_url}
                    alt=""
                    className="w-full h-full object-cover object-[center_20%]"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-br from-red-500 to-purple-500 opacity-50" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-0.5">
                  <span className="text-sm text-neutral-100 font-medium truncate group-hover:text-white">
                    {e.username}
                  </span>
                  <span className={`text-[9px] sm:text-[10px] uppercase tracking-wide ${rarity.text}`}>
                    {e.rarity}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-neutral-500 truncate">{e.verdict}</p>
                <p className="text-[10px] text-neutral-600 mt-0.5 uppercase tracking-wide">
                  {e.style} · {e.focus}
                </p>
              </div>

              {/* Score / claims */}
              <div className="text-right shrink-0 pl-1">
                <p className={`text-base sm:text-lg font-bold tabular-nums leading-none ${rarity.text}`}>
                  {Number(e.score).toFixed(1)}
                </p>
                <p className="text-[10px] text-neutral-500 mt-1 tabular-nums">
                  {e.likes || 0} claimed
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
