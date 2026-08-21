"use client";

import { useEffect, useRef, useState } from "react";
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
  /** Compact mode for embedding in playground */
  compact?: boolean;
  /** Show header */
  showHeader?: boolean;
  /** Initial visible rows per board (default 20); rest load as you scroll */
  pageSize?: number;
};

type BoardKind = "fire" | "nope";

const BATCH = 20;

function rankBadge(i: number, kind: BoardKind) {
  if (i === 0) {
    return {
      label: "1",
      className:
        kind === "fire"
          ? "bg-gradient-to-br from-amber-400 to-orange-600 text-black shadow-[0_0_14px_-2px_rgba(251,191,36,0.7)] border-amber-300/80"
          : "bg-gradient-to-br from-red-400 to-red-700 text-white shadow-[0_0_14px_-2px_rgba(239,68,68,0.65)] border-red-300/70",
    };
  }
  if (i === 1) {
    return {
      label: "2",
      className:
        kind === "fire"
          ? "bg-gradient-to-br from-neutral-200 to-neutral-400 text-black shadow-[0_0_12px_-2px_rgba(212,212,212,0.5)] border-neutral-300/70"
          : "bg-gradient-to-br from-neutral-300 to-neutral-500 text-black shadow-[0_0_12px_-2px_rgba(163,163,163,0.45)] border-neutral-400/60",
    };
  }
  if (i === 2) {
    return {
      label: "3",
      className:
        kind === "fire"
          ? "bg-gradient-to-br from-orange-600 to-amber-800 text-amber-50 shadow-[0_0_12px_-2px_rgba(194,65,12,0.5)] border-orange-500/60"
          : "bg-gradient-to-br from-rose-700 to-red-900 text-rose-50 shadow-[0_0_12px_-2px_rgba(190,18,60,0.5)] border-rose-600/50",
    };
  }
  if (i < 10) {
    return {
      label: String(i + 1),
      className:
        kind === "fire"
          ? "bg-orange-950/50 text-orange-300/90 border-orange-900/40"
          : "bg-red-950/50 text-red-300/90 border-red-900/40",
    };
  }
  return {
    label: String(i + 1),
    className: "bg-[#0a0a0a] text-neutral-500 border-neutral-800",
  };
}

function rowShell(i: number, kind: BoardKind) {
  if (i >= 10) return "border-neutral-800/80 bg-[#111] hover:border-neutral-700";
  if (kind === "fire") {
    if (i === 0)
      return "border-amber-500/50 bg-gradient-to-r from-amber-950/40 via-[#111] to-[#111] hover:brightness-110";
    if (i === 1)
      return "border-neutral-400/40 bg-gradient-to-r from-neutral-800/40 via-[#111] to-[#111] hover:brightness-110";
    if (i === 2)
      return "border-orange-600/40 bg-gradient-to-r from-orange-950/35 via-[#111] to-[#111] hover:brightness-110";
    return "border-orange-900/30 bg-gradient-to-r from-orange-950/20 via-[#111] to-[#111] hover:border-orange-800/40";
  }
  if (i === 0)
    return "border-red-500/50 bg-gradient-to-r from-red-950/45 via-[#111] to-[#111] hover:brightness-110";
  if (i === 1)
    return "border-neutral-400/40 bg-gradient-to-r from-neutral-800/40 via-[#111] to-[#111] hover:brightness-110";
  if (i === 2)
    return "border-rose-700/40 bg-gradient-to-r from-rose-950/35 via-[#111] to-[#111] hover:brightness-110";
  return "border-red-900/30 bg-gradient-to-r from-red-950/20 via-[#111] to-[#111] hover:border-red-800/40";
}

function BoardColumn({
  title,
  subtitle,
  kind,
  rows,
  emptyHint,
  pageSize,
}: {
  title: string;
  subtitle: string;
  kind: BoardKind;
  rows: Entry[];
  emptyHint: string;
  pageSize: number;
}) {
  const [visible, setVisible] = useState(pageSize);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisible(pageSize);
  }, [rows, pageSize]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible((v) => Math.min(v + BATCH, rows.length));
        }
      },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rows.length]);

  const shown = rows.slice(0, visible);
  const hasMore = visible < rows.length;

  return (
    <div className="min-w-0 flex-1">
      <div className="mb-3 text-center sm:text-left">
        <h3
          className={`text-sm sm:text-base font-semibold tracking-tight ${
            kind === "fire" ? "text-orange-200" : "text-red-200"
          }`}
        >
          {title}
        </h3>
        <p className="text-[11px] text-neutral-500 mt-0.5">
          {subtitle}
          {rows.length > 0 && (
            <span className="text-neutral-600"> · {rows.length} cards</span>
          )}
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-neutral-800/80 bg-[#111] p-6 text-center">
          <p className="text-xs text-neutral-500">{emptyHint}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {shown.map((e, i) => {
            const rarity = getRarity(Number(e.score));
            const badge = rankBadge(i, kind);
            const isTop10 = i < 10;
            const metric = kind === "fire" ? e.likes || 0 : e.dislikes || 0;
            const metricLabel = kind === "fire" ? "fire" : "nope";

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
                      ? kind === "fire"
                        ? "border-orange-800/40"
                        : "border-red-800/40"
                      : "border-neutral-800"
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
                      <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-red-500 to-purple-500 opacity-50" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                    <span className="text-xs sm:text-sm text-neutral-100 font-medium truncate group-hover:text-white">
                      {e.username}
                    </span>
                    <span className={`text-[9px] uppercase tracking-wide ${rarity.text}`}>
                      {e.rarity}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-neutral-500 truncate">{e.verdict}</p>
                </div>

                <div className="text-right shrink-0 pl-1">
                  <p
                    className={`text-sm sm:text-base font-bold tabular-nums leading-none ${
                      isTop10
                        ? kind === "fire"
                          ? "text-orange-300"
                          : "text-red-300"
                        : "text-neutral-400"
                    }`}
                  >
                    {metric}
                  </p>
                  <p className="text-[9px] text-neutral-500 mt-0.5 uppercase tracking-wide">
                    {metricLabel}
                  </p>
                  <p className="text-[9px] text-neutral-600 mt-0.5 tabular-nums">
                    {Number(e.score).toFixed(1)}/10
                  </p>
                </div>
              </Link>
            );
          })}

          {hasMore && (
            <div ref={sentinelRef} className="py-3 text-center">
              <button
                type="button"
                onClick={() => setVisible((v) => Math.min(v + BATCH, rows.length))}
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

export function RanksList({ compact = false, showHeader = true, pageSize = 20 }: Props) {
  const [byFire, setByFire] = useState<Entry[]>([]);
  const [byNope, setByNope] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/judgments?public=1");
        const data = await res.json();
        const list: Entry[] = data.judgments || [];

        // Full boards — independent sort, no hard top-10 cut
        setByFire(
          [...list].sort(
            (a, b) => (b.likes || 0) - (a.likes || 0) || Number(b.score) - Number(a.score)
          )
        );
        setByNope(
          [...list].sort(
            (a, b) =>
              (b.dislikes || 0) - (a.dislikes || 0) || Number(a.score) - Number(b.score)
          )
        );
      } catch {
        setByFire([]);
        setByNope([]);
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
          <h2
            className={`${compact ? "text-xl" : "text-2xl sm:text-3xl"} font-semibold text-neutral-50 tracking-tight`}
          >
            {compact ? "Ranks" : "Leaderboard"}
          </h2>
          <p className="text-neutral-500 text-sm mt-1">
            Most Fire · Most Nope — full boards · top 10 highlighted
          </p>
        </div>
      )}

      {loading && <p className="text-center text-sm text-neutral-500 py-8">Loading ranks…</p>}

      {!loading && byFire.length === 0 && byNope.length === 0 && (
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

      {!loading && (byFire.length > 0 || byNope.length > 0) && (
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-5">
          <BoardColumn
            title="Most Fire"
            subtitle="Highest likes from the gallery"
            kind="fire"
            rows={byFire}
            emptyHint="No fires yet."
          />
          <div className="hidden lg:block w-px self-stretch bg-neutral-800/80" />
          <BoardColumn
            title="Most Nope"
            subtitle="Highest passes from the gallery"
            kind="nope"
            rows={byNope}
            emptyHint="No nopes yet."
          />
        </div>
      )}
    </div>
  );
}

function BoardColumn({
  title,
  subtitle,
  kind,
  rows,
  emptyHint,
}: {
  title: string;
  subtitle: string;
  kind: BoardKind;
  rows: Entry[];
  emptyHint: string;
}) {
  const [visible, setVisible] = useState(25);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

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
      { rootMargin: "240px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rows.length]);

  const shown = rows.slice(0, visible);
  const hasMore = visible < rows.length;

  return (
    <div className="min-w-0 flex-1">
      <div className="mb-3 text-center sm:text-left">
        <h3
          className={`text-sm sm:text-base font-semibold tracking-tight ${
            kind === "fire" ? "text-orange-200" : "text-red-200"
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
        <div className="space-y-2">
          {shown.map((e, i) => {
            const rarity = getRarity(Number(e.score));
            const badge = rankBadge(i, kind);
            const isTop10 = i < 10;
            const metric = kind === "fire" ? e.likes || 0 : e.dislikes || 0;
            const metricLabel = kind === "fire" ? "fire" : "nope";

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
                      ? kind === "fire"
                        ? "border-orange-800/40"
                        : "border-red-800/40"
                      : "border-neutral-800"
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
                      <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-red-500 to-purple-500 opacity-50" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                    <span className="text-xs sm:text-sm text-neutral-100 font-medium truncate group-hover:text-white">
                      {e.username}
                    </span>
                    <span className={`text-[9px] uppercase tracking-wide ${rarity.text}`}>
                      {e.rarity}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-neutral-500 truncate">{e.verdict}</p>
                </div>

                <div className="text-right shrink-0 pl-1">
                  <p
                    className={`text-sm sm:text-base font-bold tabular-nums leading-none ${
                      isTop10
                        ? kind === "fire"
                          ? "text-orange-300"
                          : "text-red-300"
                        : "text-neutral-400"
                    }`}
                  >
                    {metric}
                  </p>
                  <p className="text-[9px] text-neutral-500 mt-0.5 uppercase tracking-wide">
                    {metricLabel}
                  </p>
                  <p className="text-[9px] text-neutral-600 mt-0.5 tabular-nums">
                    {Number(e.score).toFixed(1)}/10
                  </p>
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

function rankBadge(i: number, kind: BoardKind) {
  if (i === 0) {
    return {
      label: "1",
      className:
        kind === "fire"
          ? "bg-gradient-to-br from-amber-400 to-orange-600 text-black shadow-[0_0_14px_-2px_rgba(251,191,36,0.7)] border-amber-300/80"
          : "bg-gradient-to-br from-red-400 to-red-700 text-white shadow-[0_0_14px_-2px_rgba(239,68,68,0.65)] border-red-300/70",
    };
  }
  if (i === 1) {
    return {
      label: "2",
      className:
        kind === "fire"
          ? "bg-gradient-to-br from-neutral-200 to-neutral-400 text-black shadow-[0_0_12px_-2px_rgba(212,212,212,0.5)] border-neutral-300/70"
          : "bg-gradient-to-br from-neutral-300 to-neutral-500 text-black shadow-[0_0_12px_-2px_rgba(163,163,163,0.45)] border-neutral-400/60",
    };
  }
  if (i === 2) {
    return {
      label: "3",
      className:
        kind === "fire"
          ? "bg-gradient-to-br from-orange-600 to-amber-800 text-amber-50 shadow-[0_0_12px_-2px_rgba(194,65,12,0.5)] border-orange-500/60"
          : "bg-gradient-to-br from-rose-700 to-red-900 text-rose-50 shadow-[0_0_12px_-2px_rgba(190,18,60,0.5)] border-rose-600/50",
    };
  }
  if (i < 10) {
    return {
      label: String(i + 1),
      className:
        kind === "fire"
          ? "bg-orange-950/50 text-orange-300/90 border-orange-900/40"
          : "bg-red-950/50 text-red-300/90 border-red-900/40",
    };
  }
  return {
    label: String(i + 1),
    className: "bg-[#0a0a0a] text-neutral-500 border-neutral-800",
  };
}

function rowShell(i: number, kind: BoardKind) {
  if (i >= 10) return "border-neutral-800/80 bg-[#111] hover:border-neutral-700";
  if (kind === "fire") {
    if (i === 0)
      return "border-amber-500/50 bg-gradient-to-r from-amber-950/40 via-[#111] to-[#111] hover:brightness-110";
    if (i === 1)
      return "border-neutral-400/40 bg-gradient-to-r from-neutral-800/40 via-[#111] to-[#111] hover:brightness-110";
    if (i === 2)
      return "border-orange-600/40 bg-gradient-to-r from-orange-950/35 via-[#111] to-[#111] hover:brightness-110";
    return "border-orange-900/30 bg-gradient-to-r from-orange-950/20 via-[#111] to-[#111] hover:border-orange-800/40";
  }
  if (i === 0)
    return "border-red-500/50 bg-gradient-to-r from-red-950/45 via-[#111] to-[#111] hover:brightness-110";
  if (i === 1)
    return "border-neutral-400/40 bg-gradient-to-r from-neutral-800/40 via-[#111] to-[#111] hover:brightness-110";
  if (i === 2)
    return "border-rose-700/40 bg-gradient-to-r from-rose-950/35 via-[#111] to-[#111] hover:brightness-110";
  return "border-red-900/30 bg-gradient-to-r from-red-950/20 via-[#111] to-[#111] hover:border-red-800/40";
}
