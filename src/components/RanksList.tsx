"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getRarity } from "@/lib/gallery";
import { VOTE } from "@/lib/face-the-den";
import { RarityFrame } from "@/components/RarityFrame";

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

type RankPaint = { bg: string; color: string; accent: string; row: string; thumb: string };

const MARK_TOP: RankPaint[] = [
  { bg: "linear-gradient(135deg,#fbbf24,#ea580c)", color: "#111", accent: "#fbbf24", row: "border-amber-400/70 bg-gradient-to-r from-amber-950/50 via-[#111] to-[#111]", thumb: "border-amber-400/50" },
  { bg: "linear-gradient(135deg,#fb7185,#be123c)", color: "#fff", accent: "#fb7185", row: "border-rose-400/70 bg-gradient-to-r from-rose-950/45 via-[#111] to-[#111]", thumb: "border-rose-400/50" },
  { bg: "linear-gradient(135deg,#c084fc,#6d28d9)", color: "#fff", accent: "#c084fc", row: "border-fuchsia-400/70 bg-gradient-to-r from-fuchsia-950/45 via-[#111] to-[#111]", thumb: "border-fuchsia-400/50" },
  { bg: "#0ea5e9", color: "#04151c", accent: "#0ea5e9", row: "border-sky-500/50 bg-gradient-to-r from-sky-950/40 via-[#111] to-[#111]", thumb: "border-sky-500/40" },
  { bg: "#22c55e", color: "#052e16", accent: "#22c55e", row: "border-green-500/50 bg-gradient-to-r from-green-950/35 via-[#111] to-[#111]", thumb: "border-green-500/40" },
  { bg: "#eab308", color: "#1c1403", accent: "#eab308", row: "border-yellow-500/50 bg-gradient-to-r from-yellow-950/35 via-[#111] to-[#111]", thumb: "border-yellow-500/40" },
  { bg: "#f97316", color: "#fff", accent: "#f97316", row: "border-orange-500/50 bg-gradient-to-r from-orange-950/40 via-[#111] to-[#111]", thumb: "border-orange-500/40" },
  { bg: "#ec4899", color: "#fff", accent: "#ec4899", row: "border-pink-500/50 bg-gradient-to-r from-pink-950/40 via-[#111] to-[#111]", thumb: "border-pink-500/40" },
  { bg: "#6366f1", color: "#fff", accent: "#6366f1", row: "border-indigo-500/50 bg-gradient-to-r from-indigo-950/40 via-[#111] to-[#111]", thumb: "border-indigo-500/40" },
  { bg: "#94a3b8", color: "#0b1220", accent: "#94a3b8", row: "border-slate-400/40 bg-gradient-to-r from-slate-800/40 via-[#111] to-[#111]", thumb: "border-slate-400/40" },
];

const CUT_TOP: RankPaint[] = [
  { bg: "linear-gradient(135deg,#f87171,#991b1b)", color: "#fff", accent: "#f87171", row: "border-red-400/70 bg-gradient-to-r from-red-950/50 via-[#111] to-[#111]", thumb: "border-red-400/50" },
  { bg: "linear-gradient(135deg,#e2e8f0,#64748b)", color: "#111", accent: "#cbd5e1", row: "border-slate-300/50 bg-gradient-to-r from-slate-700/40 via-[#111] to-[#111]", thumb: "border-slate-300/40" },
  { bg: "linear-gradient(135deg,#fb923c,#9a3412)", color: "#fff", accent: "#fb923c", row: "border-orange-600/50 bg-gradient-to-r from-orange-950/40 via-[#111] to-[#111]", thumb: "border-orange-600/40" },
  { bg: "#38bdf8", color: "#082f49", accent: "#38bdf8", row: "border-sky-400/50 bg-gradient-to-r from-sky-950/40 via-[#111] to-[#111]", thumb: "border-sky-400/40" },
  { bg: "#a3e635", color: "#1a2e05", accent: "#a3e635", row: "border-lime-500/50 bg-gradient-to-r from-lime-950/35 via-[#111] to-[#111]", thumb: "border-lime-500/40" },
  { bg: "#2dd4bf", color: "#042f2e", accent: "#2dd4bf", row: "border-teal-400/50 bg-gradient-to-r from-teal-950/40 via-[#111] to-[#111]", thumb: "border-teal-400/40" },
  { bg: "#818cf8", color: "#fff", accent: "#818cf8", row: "border-indigo-400/50 bg-gradient-to-r from-indigo-950/40 via-[#111] to-[#111]", thumb: "border-indigo-400/40" },
  { bg: "#f472b6", color: "#1f0514", accent: "#f472b6", row: "border-pink-400/50 bg-gradient-to-r from-pink-950/40 via-[#111] to-[#111]", thumb: "border-pink-400/40" },
  { bg: "#facc15", color: "#1c1500", accent: "#facc15", row: "border-yellow-400/50 bg-gradient-to-r from-yellow-950/35 via-[#111] to-[#111]", thumb: "border-yellow-400/40" },
  { bg: "#78716c", color: "#fff", accent: "#78716c", row: "border-stone-500/40 bg-gradient-to-r from-stone-900/50 via-[#111] to-[#111]", thumb: "border-stone-500/40" },
];

function rankPaint(i: number, kind: BoardKind): RankPaint | null {
  if (i >= 10) return null;
  return kind === "mark" ? MARK_TOP[i] : CUT_TOP[i];
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
              ? `h-[min(58dvh,560px)] sm:h-[min(72vh,760px)] overflow-y-auto overscroll-contain pr-1 space-y-2 ftd-scroll min-w-0 ${
                  kind === "cut" ? "ftd-scroll-cut" : ""
                }`
              : "space-y-2"
          }
        >
          {shown.map((e, i) => {
            const rarity = getRarity(Number(e.score));
            const paint = rankPaint(i, kind);
            const isTop10 = !!paint;
            const metric = kind === "mark" ? e.likes || 0 : e.dislikes || 0;

            return (
              <Link
                key={`${kind}-${e.id}`}
                href={`/g/${e.id}`}
                className={`group flex items-center gap-2.5 sm:gap-3 rounded-xl border p-2 sm:p-2.5 transition-all ${
                  paint ? paint.row : "border-neutral-800/80 bg-[#111] hover:border-neutral-700"
                }`}
                style={paint ? { boxShadow: `inset 4px 0 0 ${paint.accent}` } : undefined}
              >
                <div
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-black/20 flex items-center justify-center text-[11px] sm:text-xs font-bold tabular-nums shrink-0"
                  style={
                    paint
                      ? { background: paint.bg, color: paint.color }
                      : { background: "#0a0a0a", color: "#737373", borderColor: "#262626" }
                  }
                >
                  {i + 1}
                </div>

                <RarityFrame
                  slug={rarity.slug}
                  compact
                  className="w-10 h-12 sm:w-11 sm:h-[52px] rounded-lg shrink-0"
                >
                  {e.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.image_url} alt="" className="w-full h-full object-cover object-[center_20%]" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-red-500 to-purple-500 opacity-50" />
                    </div>
                  )}
                </RarityFrame>

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
          <p className="text-neutral-500 text-sm mt-1 px-1">
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
