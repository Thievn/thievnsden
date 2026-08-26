"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { getRarity, type GalleryJudgment } from "@/lib/gallery";
import { supabase } from "@/lib/supabase/client";
import { VOTE } from "@/lib/face-the-den";

type Props = {
  compact?: boolean;
};

/**
 * Gallery stack — swipe left/right only navigates (no silent vote).
 * Explicit Mark / Cut buttons handle votes. Account required to vote.
 */
export function GalleryStack({ compact = false }: Props) {
  const [cards, setCards] = useState<GalleryJudgment[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exitDir, setExitDir] = useState<"left" | "right" | null>(null);
  const [busy, setBusy] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);

  const startX = useRef(0);
  const startY = useRef(0);
  const dragXRef = useRef(0);
  const locked = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
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
    setDragX(0);
  }, [index]);

  const current = cards[index] || null;
  const nextCard = cards[index + 1] || null;
  const rarity = current ? getRarity(Number(current.score)) : null;

  const advance = useCallback(() => {
    setExitDir(null);
    setDragX(0);
    setIndex((i) => i + 1);
    setBusy(false);
  }, []);

  const vote = useCallback(
    async (value: 1 | -1) => {
      if (!current || busy) return;
      setBusy(true);
      setExitDir(value === 1 ? "right" : "left");

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setBusy(false);
        setExitDir(null);
        window.location.href = "/login?next=/playground/face-the-den";
        return;
      }

      try {
        const res = await fetch("/api/gallery/vote", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            judgmentId: current.id,
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
    },
    [current, busy, userId, advance]
  );

  /** Swipe only skips — never votes */
  const skip = useCallback(
    (dir: "left" | "right" = "left") => {
      if (busy || !current) return;
      setBusy(true);
      setExitDir(dir);
      setTimeout(advance, 260);
    },
    [busy, current, advance]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (busy || expanded || !current) return;
    const t = e.target as HTMLElement;
    if (t.closest("[data-no-swipe]")) return;

    startX.current = e.clientX;
    startY.current = e.clientY;
    dragXRef.current = 0;
    locked.current = false;
    setDragging(true);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || busy) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    if (!locked.current) {
      if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return;
      if (Math.abs(dy) > Math.abs(dx) * 1.25) {
        setDragging(false);
        setDragX(0);
        return;
      }
      locked.current = true;
    }

    e.preventDefault?.();
    dragXRef.current = dx;
    setDragX(dx);
  };

  const onPointerUp = () => {
    if (!dragging) return;
    setDragging(false);
    const dx = dragXRef.current;
    const threshold = 64;

    if (dx > threshold) {
      skip("right");
    } else if (dx < -threshold) {
      skip("left");
    } else {
      setDragX(0);
    }
    dragXRef.current = 0;
  };

  const dragRotate = dragging ? dragX * 0.03 : 0;
  const dragOpacity = dragging ? Math.max(0.55, 1 - Math.abs(dragX) / 380) : 1;

  return (
    <div className={compact ? "" : "relative min-h-[calc(100vh-8rem)] overflow-hidden"}>
      {!compact && (
        <div className="pointer-events-none absolute inset-0">
          <div className="void-orb-a absolute top-[-5%] left-[10%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,_rgba(185,28,92,0.14)_0%,_transparent_70%)] blur-2xl" />
          <div className="void-orb-b absolute bottom-[10%] right-[-5%] h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,_rgba(124,58,237,0.12)_0%,_transparent_70%)] blur-2xl" />
        </div>
      )}

      <div className={`relative w-full min-w-0 max-w-md mx-auto ${compact ? "" : "px-4 py-8 sm:py-12"}`}>
        {!compact && (
          <div className="text-center mb-6">
            <p className="text-[11px] uppercase tracking-[0.22em] text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 mb-2 font-medium">
              Face The Den
            </p>
            <h1 className="text-2xl font-semibold text-neutral-50 tracking-tight">Gallery</h1>
            <p className="text-neutral-500 text-sm mt-1">Swipe to browse · Mark or Cut to vote</p>
          </div>
        )}

        {compact && (
          <p className="text-center text-xs text-neutral-500 mb-3">
            Swipe to browse · Mark / Cut to vote
          </p>
        )}

        {loading && (
          <p className="text-center text-neutral-500 text-sm py-16">Loading the stack…</p>
        )}

        {!loading && cards.length === 0 && (
          <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-8 text-center">
            <p className="text-neutral-400 text-sm mb-2">Gallery is empty.</p>
            <p className="text-neutral-600 text-xs">Judgments posted to the gallery will show up here.</p>
          </div>
        )}

        {!loading && index >= cards.length && cards.length > 0 && (
          <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-8 text-center">
            <p className="text-neutral-300 text-sm mb-2">End of the stack.</p>
            <button
              onClick={() => setIndex(0)}
              className="mt-3 px-4 py-2 rounded-xl border border-neutral-800 text-sm text-neutral-300 hover:border-neutral-600"
            >
              Start over
            </button>
          </div>
        )}

        {!loading && current && rarity && (
          <div className="relative h-[min(62dvh,520px)] sm:h-[600px] touch-pan-y">
            {nextCard && (
              <div className="absolute inset-x-2 top-3 bottom-0 rounded-2xl border border-neutral-800/60 bg-[#0d0d0d] scale-[0.97] opacity-50" />
            )}

            {dragging && Math.abs(dragX) > 24 && (
              <div
                className={`pointer-events-none absolute top-[30%] z-10 px-3 py-1.5 rounded-full border text-[11px] font-semibold tracking-widest uppercase backdrop-blur-sm ${
                  dragX > 0
                    ? "right-4 border-neutral-600/60 bg-black/50 text-neutral-300"
                    : "left-4 border-neutral-600/60 bg-black/50 text-neutral-300"
                }`}
              >
                Next
              </div>
            )}

            <div
              className={`absolute inset-0 ${!dragging && exitDir ? "transition-all duration-300 ease-out" : ""} ${
                exitDir === "left"
                  ? "-translate-x-[120%] rotate-[-10deg] opacity-0"
                  : exitDir === "right"
                    ? "translate-x-[120%] rotate-[10deg] opacity-0"
                    : ""
              }`}
              style={
                !exitDir
                  ? {
                      transform: `translateX(${dragX}px) rotate(${dragRotate}deg)`,
                      opacity: dragOpacity,
                      transition: dragging ? "none" : "transform 0.2s ease-out, opacity 0.2s ease-out",
                      touchAction: "pan-y",
                    }
                  : undefined
              }
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <div
                className={`h-full rounded-2xl border-2 ${rarity.border} ${rarity.glow} bg-gradient-to-b ${rarity.bg} overflow-hidden flex flex-col select-none`}
              >
                <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5 shrink-0">
                  <span className={`text-[10px] font-semibold uppercase tracking-[0.15em] ${rarity.text}`}>
                    {current.rarity}
                  </span>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] text-neutral-500 tabular-nums">
                      <span className="text-purple-400/90">{current.likes || 0}</span>
                      <span className="text-neutral-600 mx-1">mark</span>
                      <span className="text-neutral-600">·</span>
                      <span className="text-red-400/80 ml-1">{current.dislikes || 0}</span>
                      <span className="text-neutral-600 ml-1">cut</span>
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

                <div className="px-2.5 shrink-0 flex-1 min-h-0 flex">
                  <button
                    type="button"
                    data-no-swipe
                    onClick={(e) => {
                      e.stopPropagation();
                      if (current.image_url) setExpanded(true);
                    }}
                    className={`relative w-full flex-1 min-h-[340px] sm:min-h-[380px] rounded-xl overflow-hidden border ${rarity.border} bg-black block`}
                  >
                    {current.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={current.image_url}
                        alt=""
                        draggable={false}
                        className="absolute inset-0 w-full h-full object-cover object-[center_15%]"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-red-500 to-purple-500 opacity-60" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex justify-between items-end pointer-events-none">
                      <span className="text-sm text-neutral-100 font-medium drop-shadow-md">
                        {current.username || "Anonymous"}
                      </span>
                      <span className="text-[10px] uppercase tracking-wide text-neutral-300/90 drop-shadow">
                        {current.style}
                        {current.filthy_mode ? ` · ${current.filthy_mode}` : ""} · {current.focus}
                      </span>
                    </div>
                  </button>
                </div>

                <div className="px-3 pt-2.5 pb-3 shrink-0">
                  <p className="text-[13px] text-neutral-200 leading-relaxed line-clamp-3">
                    {current.verdict}
                  </p>
                </div>

                <div className={`h-1 w-full bg-gradient-to-r ${rarity.bar} opacity-80 shrink-0`} />
              </div>
            </div>
          </div>
        )}

        {current && (
          <div className="mt-5 space-y-3">
            <div className="flex items-stretch justify-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={() => vote(-1)}
                disabled={busy}
                className="group flex-1 min-w-0 max-w-[150px] min-h-[58px] rounded-2xl border-2 border-slate-600/50 bg-gradient-to-b from-[#1a1518] via-[#121014] to-[#0c0c0c] text-slate-100 shadow-[0_0_24px_-4px_rgba(148,163,184,0.28)] hover:shadow-[0_0_28px_-2px_rgba(248,113,113,0.35)] hover:border-red-700/50 active:scale-95 transition-all disabled:opacity-40 flex flex-col items-center justify-center"
              >
                <span className="text-[14px] font-bold tracking-[0.12em] uppercase">{VOTE.dislike.verb}</span>
                <span className="text-[10px] text-slate-500 mt-0.5">{VOTE.dislike.hint}</span>
              </button>

              <button
                onClick={() => skip("right")}
                disabled={busy}
                className="px-3 sm:px-4 min-h-[44px] shrink-0 self-center rounded-full border border-neutral-800 text-[11px] text-neutral-500 hover:text-neutral-300 hover:border-neutral-600 disabled:opacity-40 transition-all"
              >
                Skip
              </button>

              <button
                onClick={() => vote(1)}
                disabled={busy}
                className="group flex-1 min-w-0 max-w-[150px] min-h-[58px] rounded-2xl border-2 border-rose-700/50 bg-gradient-to-b from-[#2a0a14] via-[#1a080e] to-[#0c0c0c] text-rose-100 shadow-[0_0_24px_-4px_rgba(244,63,94,0.45)] hover:shadow-[0_0_28px_-2px_rgba(244,63,94,0.55)] hover:border-rose-500/60 active:scale-95 transition-all disabled:opacity-40 flex flex-col items-center justify-center"
              >
                <span className="text-[14px] font-bold tracking-[0.12em] uppercase">{VOTE.like.verb}</span>
                <span className="text-[10px] text-rose-300/70 mt-0.5">{VOTE.like.hint}</span>
              </button>
            </div>
            <p className="text-center text-[10px] text-neutral-600 leading-relaxed">
              {userId ? "Swipe browses only · Mark / Cut vote" : "Log in to Mark or Cut · swipe still browses"}
            </p>
          </div>
        )}

        {cards.length > 0 && index < cards.length && (
          <p className="text-center text-[11px] text-neutral-600 mt-3">
            {index + 1} / {cards.length}
          </p>
        )}

        {!compact && (
          <p className="text-center mt-6">
            <Link href="/leaderboard" className="text-xs text-neutral-600 hover:text-neutral-400">
              Ranks →
            </Link>
          </p>
        )}
      </div>

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
