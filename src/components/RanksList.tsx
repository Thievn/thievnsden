"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getRarity } from "@/lib/gallery";
import { VOTE } from "@/lib/face-the-den";

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
  compact?: boolean;
  showHeader?: boolean;
  scroll?: boolean;
};

type BoardKind = "mark" | "cut";

const MARK_TOP = [
  "bg-gradient-to-br from-amber-300 to-orange-500 text-black shadow-[0_0_14px_-2px_rgba(251,191,36,0.7)] border-amber-200/80",
  "bg-gradient-to-br from-rose-200 to-pink-400 text-black shadow-[0_0_12px_-2px_rgba(251,113,133,0.5)] border-rose-200/70",
  "bg-gradient-to-br from-fuchsia-400 to-purple-600 text-white shadow-[0_0_12px_-2px_rgba(192,38,211,0.5)] border-fuchsia-300/60",
  "bg-rose-950/70 text-rose-200 border-rose-500/40",
  "bg-pink-950/60 text-pink-200 border-pink-700/40",
  "bg-fuchsia-950/60 text-fuchsia-200 border-fuchsia-700/40",
  "bg-purple-950/60 text-purple-200 border-purple-700/40",
  "bg-violet-950/60 text-violet-200 border-violet-700/40",
  "bg-red-950/60 text-red-200 border-red-800/40",
  "bg-[#2a0b18] text-rose-300/80 border-rose-900/50",
];

const CUT_TOP = [
  "bg-gradient-to-br from-red-400 to-red-700 text-white shadow-[0_0_14px_-2px_rgba(239,68,68,0.65)] border-red-300/70",
  "bg-gradient-to-br from-slate-200 to-slate-400 text-black shadow-[0_0_12px_-2px_rgba(148,163,184,0.5)] border-slate-300/70",
  "bg-gradient-to-br from-rose-800 to-stone-800 text-rose-50 shadow-[0_0_12px_-2px_rgba(136,19,55,0.5)] border-rose-700/50",
  "bg-red-950/70 text-red-200 border-red-700/40",
  "bg-stone-900 text-stone-200 border-stone-600/40",
  "bg-slate-900 text-slate-200 border-slate-600/40",
  "bg-zinc-900 text-zinc-200 border-zinc-600/40",
  "bg-neutral-900 text-neutral-200 border-neutral-600/40",
  "bg-[#1a1214] text-rose-200/70 border-rose-950/60",
  "bg-[#121214] text-slate-300/80 border-slate-800/60",
];

const MARK_ROW = [
  "border-amber-500/50 bg-gradient-to-r from-amber-950/40 via-[#111] to-[#111] hover:brightness-110",
  "border-rose-400/40 bg-gradient-to-r from-rose-950/35 via-[#111] to-[#111] hover:brightness-110",
  "border-fuchsia-500/40 bg-gradient-to-r from-fuchsia-950/35 via-[#111] to-[#111] hover:brightness-110",
  "border-rose-800/40 bg-gradient-to-r from-rose-950/25 via-[#111] to-[#111]",
  "border-pink-800/35 bg-gradient-to-r from-pink-950/22 via-[#111] to-[#111]",
  "border-fuchsia-800/35 bg-gradient-to-r from-fuchsia-950/22 via-[#111] to-[#111]",
  "border-purple-800/35 bg-gradient-to-r from-purple-950/22 via-[#111] to-[#111]",
  "border-violet-800/35 bg-gradient-to-r from-violet-950/22 via-[#111] to-[#111]",
  "border-red-900/35 bg-gradient-to-r from-red-950/20 via-[#111] to-[#111]",
  "border-rose-950/50 bg-gradient-to-r from-[#1a0a12] via-[#111] to-[#111]",
];

const CUT_ROW = [
  "border-red-500/50 bg-gradient-to-r from-red-950/45 via-[#111] to-[#111] hover:brightness-110",
  "border-slate-400/40 bg-gradient-to-r from-slate-800/40 via-[#111] to-[#111] hover:brightness-110",
  "border-rose-800/40 bg-gradient-to-r from-rose-950/35 via-[#111] to-[#111] hover:brightness-110",
  "border-red-900/35 bg-gradient-to-r from-red-950/22 via-[#111] to-[#111]",
  "border-stone-700/35 bg-gradient-to-r from-stone-950/30 via-[#111] to-[#111]",
  "border-slate-700/35 bg-gradient-to-r from-slate-950/30 via-[#111] to-[#111]",
  "border-zinc-700/35 bg-gradient-to-r from-zinc-950/30 via-[#111] to-[#111]",
  "border-neutral-700/35 bg-gradient-to-r from-neutral-950/30 via-[#111] to-[#111]",
  "border-rose-950/40 bg-gradient-to-r from-[#16080c] via-[#111] to-[#111]",
  "border-slate-900/50 bg-gradient-to-r from-[#101014] via-[#111] to-[#111]",
];

function rankBadge(i: number, kind: BoardKind) {
  if (i < 10) {
    return {
      label: String(i + 1),
      className: kind === "mark" ? MARK_TOP[i] : CUT_TOP[i],
    };
  }
  return {
    label: String(i + 1),
    className: "bg-[#0a0a0a] text-neutral-500 border-neutral-800",
  };
}

function rowShell(i: number, kind: BoardKind) {
  if (i >= 10) return "border-neutral-800/80 bg-[#111] hover:border-neutral-700";
  return kind === "mark" ? MARK_ROW[i] : CUT_ROW[i];
}

function BoardColumn({
  title,
  subtitle,
  kind,
  rows,
  emptyHint,
  scroll,
}: {
  title: string;
  subtitle: string;
  kind: BoardKind;
  rows: Entry[];
  emptyHint: string;
  scroll: boolean;
}) {
  const [visible, setVisible] = useState(25);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisible(25);
  }, [rows]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible((v) => Math.min(v + 25, rows.length));
        }
      },
      { root: scroll ? scrollerRef.current : null, rootMargin: "240px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rows.length, scroll]);

  const shown = rows.slice(0, visible);
  const hasMore = visible < rows.length;
  const metricLabel = kind === "mark" ? VOTE.like.noun : VOTE.dislike.noun;

  return (
    <div className="min-w-0 flex-1 flex flex-col">
      <div className="mb-3 text-center sm:text-left shrink-0">
        <h3
          className={`text-sm sm:text-base font-semibold tracking-tight ${
            kind === "mark" ? "text-rose-200" : "text-slate-200"
          }`}
        >
          {title}
        </h3>
        <p className="text-[11px] text-neutral-500 mt-0.5">
          {subtitle}
          {rows.length > 0 && <span className="text-neutral-600"> · {rows.length} cards</span>}
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-neutral-800/80 bg-[#111] p-6 text-center">
          <p className="text-xs text-neutral-500">{emptyHint}</p>
        </div>
      ) : (
        <div
          ref={scrollerRef}
          className={
            scroll
              ? `h-[min(72vh,760px)] overflow-y-auto overscroll-contain pr-1 space-y-2 ftd-scroll ${
                  kind === "cut" ? "ftd-scroll-cut" : ""
                }`
              : "space-y-2"
          }
        >
          {shown.map((e, i) => {
            const rarity = getRarity(Number(e.score));
            const badge = rankBadge(i, kind);
            const isTop10 = i < 10;
            const metric = kind === "mark" ? e.likes || 0 : e.dislikes || 0;

            return (
              <Link
                key={`${kind}-${e.id}`}
                href={`/g/${e.id}`}
                className={`group flex items-center gap-2.5 sm:gap-3 rounded-xl border p-2 sm:p-2.5 transition-all ${rowShell(
                  i,
                  kind
                )}`}
              >
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center text-[11px] sm:text-xs font-bold tabular-nums shrink-0 ${badge.className}`}
                >
                  {badge.label}
                </div>

                <div
                  className={`w-10 h-12 sm:w-11 sm:h-[52px] rounded-lg overflow-hidden border shrink-0 bg-black ${
                    isTop10
                      ? kind === "mark"
                        ? "border-rose-800/40"
                        : "border-slate-700/50"
                      : "border-neutral-800"
                  }`}
                >
                  {e.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.image_url} alt="" className="w-full h-full object-cover object-[center_20%]" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-red-500 to-purple-500 opacity-50" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                    <span className="text-xs sm:text-sm text-neutral-100 font-medium truncate group-hover:text-white">
                      {e.username}
                    </span>
                    <span className={`text-[9px] uppercase tracking-wide ${rarity.text}`}>{e.rarity}</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-neutral-500 truncate">{e.verdict}</p>
                </div>

                <div className="text-right shrink-0 pl-1">
                  <p
                    className={`text-sm sm:text-base font-bold tabular-nums leading-none ${
                      isTop10
                        ? kind === "mark"
                          ? "text-rose-300"
                          : "text-red-300"
                        : "text-neutral-400"
                    }`}
                  >
                    {metric}
                  </p>
                  <p className="text-[9px] text-neutral-500 mt-0.5 uppercase tracking-wide">{metricLabel}</p>
                  <p className="text-[9px] text-neutral-600 mt-0.5 tabular-nums">{Number(e.score).toFixed(1)}/10</p>
                </div>
              </Link>
            );
          })}

          {hasMore && (
            <div ref={sentinelRef} className="py-3 text-center">
              <button
                type="button"
                onClick={() => setVisible((v) => Math.min(v + 25, rows.length))}
                className="text-[11px] text-neutral-500 hover:text-neutral-300"
              >
                Load more ({rows.length - visible} left)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function RanksList({ compact = false, showHeader = true, scroll = false }: Props) {
  const [byMark, setByMark] = useState<Entry[]>([]);
  const [byCut, setByCut] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/judgments?public=1");
        const data = await res.json();
        const list: Entry[] = data.judgments || [];

        setByMark(
          [...list].sort((a, b) => (b.likes || 0) - (a.likes || 0) || Number(b.score) - Number(a.score))
        );
        setByCut(
          [...list].sort(
            (a, b) => (b.dislikes || 0) - (a.dislikes || 0) || Number(a.score) - Number(b.score)
          )
        );
      } catch {
        setByMark([]);
        setByCut([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className={compact ? "" : "relative"}>
      {showHeader && (
        <div className={`text-center ${compact ? "mb-5" : "mb-8"}`}>
          {!compact && (
            <p className="text-[11px] uppercase tracking-[0.22em] text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 mb-2 font-medium">
              Public votes
            </p>
          )}
          <h2 className={`${compact ? "text-xl" : "text-2xl sm:text-3xl"} font-semibold text-neutral-50 tracking-tight`}>
            {compact ? "Boards" : "Leaderboard"}
          </h2>
          <p className="text-neutral-500 text-sm mt-1">
            {VOTE.like.board} · {VOTE.dislike.board} — own scroll on each side · top 10 in their own colors
          </p>
        </div>
      )}

      {loading && <p className="text-center text-sm text-neutral-500 py-8">Loading ranks…</p>}

      {!loading && byMark.length === 0 && byCut.length === 0 && (
        <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-10 text-center">
          <p className="text-sm text-neutral-500 mb-3">No public cards yet.</p>
          <Link
            href="/playground/face-the-den"
            className="text-sm text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400"
          >
            Face The Den →
          </Link>
        </div>
      )}

      {!loading && (byMark.length > 0 || byCut.length > 0) && (
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-5">
          <BoardColumn
            title={VOTE.like.board}
            subtitle={`Highest ${VOTE.like.noun.toLowerCase()} from the stack`}
            kind="mark"
            rows={byMark}
            emptyHint={`No ${VOTE.like.noun.toLowerCase()} yet.`}
            scroll={scroll}
          />
          <div className="hidden lg:block w-px self-stretch bg-neutral-800/80" />
          <BoardColumn
            title={VOTE.dislike.board}
            subtitle={`Highest ${VOTE.dislike.noun.toLowerCase()} from the stack`}
            kind="cut"
            rows={byCut}
            emptyHint={`No ${VOTE.dislike.noun.toLowerCase()} yet.`}
            scroll={scroll}
          />
        </div>
      )}
    </div>
  );
}
