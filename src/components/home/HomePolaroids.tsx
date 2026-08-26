"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function shuffle<T>(list: T[], seed: number) {
  const copy = [...list];
  let s = seed || 1;
  for (let i = copy.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function HomePolaroids({ prints }: { prints: string[] }) {
  const [seed, setSeed] = useState(0);
  const [offset, setOffset] = useState(0);
  const startX = useRef<number | null>(null);
  const swiped = useRef(false);

  useEffect(() => {
    setSeed(Date.now());
  }, []);

  const deck = useMemo(() => shuffle(prints.filter(Boolean), seed || 1), [prints, seed]);
  const shown = seed
    ? [0, 1, 2].map((i) => deck[(offset + i) % Math.max(deck.length, 1)]).filter(Boolean)
    : [];

  const next = useCallback(() => {
    if (deck.length < 2) return;
    setOffset((n) => (n + 1) % deck.length);
  }, [deck.length]);

  const prev = useCallback(() => {
    if (deck.length < 2) return;
    setOffset((n) => (n - 1 + deck.length) % deck.length);
  }, [deck.length]);

  if (!prints.length) {
    return (
      <div className="h-[240px] sm:h-[320px] rounded-2xl bg-gradient-to-br from-fuchsia-700/30 via-rose-950/40 to-amber-900/20 border border-white/10" />
    );
  }

  if (!shown.length) {
    return <div className="h-[240px] sm:h-[320px] rounded-2xl border border-white/10 bg-black/40" />;
  }

  const widths = ["w-[31%]", "w-[24%]", "w-[20%]"];
  const lifts = ["translate-y-3", "translate-y-0", "translate-y-6"];

  return (
    <div
      className="relative h-[250px] sm:h-[330px] lg:h-[360px] flex items-end justify-center gap-2 sm:gap-3 select-none"
      onPointerDown={(e) => {
        startX.current = e.clientX;
      }}
      onPointerUp={(e) => {
        if (startX.current == null) return;
        const dx = e.clientX - startX.current;
        startX.current = null;
        if (dx < -40) {
          swiped.current = true;
          next();
        } else if (dx > 40) {
          swiped.current = true;
          prev();
        }
      }}
      onClick={() => {
        if (swiped.current) {
          swiped.current = false;
          return;
        }
        next();
      }}
      role="button"
      tabIndex={0}
      aria-label="Flip Afterimage stills"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "Enter") next();
        if (e.key === "ArrowLeft") prev();
      }}
    >
      {shown.map((src, i) => (
        <div
          key={`${src}-${offset}-${i}`}
          className={`relative ${widths[i]} aspect-[9/16] overflow-hidden rounded-2xl border border-white/20 bg-black shadow-[0_24px_50px_-18px_rgba(0,0,0,0.9)] ${lifts[i]}`}
          style={{ transform: `rotate(${[-5, 4, 2][i]}deg)`, zIndex: i === 1 ? 3 : i === 0 ? 2 : 1 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            draggable={false}
            className="absolute inset-0 w-full h-full object-contain object-top"
          />
        </div>
      ))}
      {deck.length > 3 ? (
        <p className="absolute bottom-1 right-2 z-10 text-[10px] uppercase tracking-[0.18em] text-white/70">
          Swipe
        </p>
      ) : null}
    </div>
  );
}

export function HomePrintStrip({ prints }: { prints: string[] }) {
  const [seed, setSeed] = useState(0);
  useEffect(() => {
    setSeed(Date.now() + 17);
  }, []);
  const deck = useMemo(
    () => shuffle(prints.filter(Boolean), seed || 1).slice(0, 4),
    [prints, seed]
  );
  if (!deck.length) return null;
  return (
    <div className="absolute inset-0 flex items-end justify-center gap-2 px-5 sm:px-8 pb-3">
      {deck.map((src, i) => (
        <div
          key={src + i}
          className="relative h-[82%] aspect-[9/16] overflow-hidden rounded-md border border-white/15 bg-black shadow-2xl"
          style={{ transform: `rotate(${[-6, -2, 3, 7][i] || 0}deg)` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className="absolute inset-0 w-full h-full object-contain object-top" />
        </div>
      ))}
    </div>
  );
}

export function HomeGamingRoom({
  covers,
  fallbackTitle,
}: {
  covers: { cover: string; title: string }[];
  fallbackTitle: string | null;
}) {
  const [seed, setSeed] = useState(0);
  useEffect(() => {
    setSeed(Date.now() + 41);
  }, []);
  const pick = useMemo(() => {
    const list = covers.filter((c) => c.cover);
    if (!list.length) return null;
    return shuffle(list, seed || 1)[0];
  }, [covers, seed]);

  return (
    <>
      <div className="relative h-40 sm:h-48 bg-[#0a0a0e]">
        {pick ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/gaming/cover?u=${encodeURIComponent(pick.cover)}`}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-[center_18%] opacity-85"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-violet-700/30 via-purple-950/40 to-[#0c0a12]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a12] via-[#0c0a12]/30 to-transparent" />
      </div>
      <div className="p-6 sm:p-7 flex-1 flex flex-col">
        <p className="text-[11px] uppercase tracking-[0.2em] text-violet-300/85 mb-2">Gaming</p>
        <h2 className="text-2xl font-semibold text-neutral-50 mb-2">
          {pick?.title || fallbackTitle || "Builds, rants, radar"}
        </h2>
        <p className="text-sm text-neutral-500 flex-1">What&apos;s on the plate, what&apos;s broken, what is actually worth the hours.</p>
        <p className="mt-5 text-sm text-violet-300">Enter the hub →</p>
      </div>
    </>
  );
}
