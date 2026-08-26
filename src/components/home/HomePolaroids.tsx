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

function visitSeed(key: string) {
  try {
    const n = Number(sessionStorage.getItem(key) || "0") + 1;
    sessionStorage.setItem(key, String(n));
    return n + (Date.now() % 997);
  } catch {
    return Date.now();
  }
}

export function HomePolaroids({ prints }: { prints: string[] }) {
  const [seed, setSeed] = useState(1);
  const [offset, setOffset] = useState(0);
  const startX = useRef<number | null>(null);

  useEffect(() => {
    setSeed(visitSeed("den-home-prints"));
  }, []);

  const deck = useMemo(() => shuffle(prints.filter(Boolean), seed), [prints, seed]);
  const shown = deck.length
    ? [0, 1, 2].map((i) => deck[(offset + i) % deck.length]).filter(Boolean)
    : [];

  const next = useCallback(() => {
    if (deck.length < 2) return;
    setOffset((n) => (n + 1) % deck.length);
  }, [deck.length]);

  const prev = useCallback(() => {
    if (deck.length < 2) return;
    setOffset((n) => (n - 1 + deck.length) % deck.length);
  }, [deck.length]);

  if (!shown.length) {
    return (
      <div className="h-[220px] sm:h-[300px] rounded-2xl bg-gradient-to-br from-fuchsia-700/30 via-rose-950/40 to-amber-900/20 border border-white/10" />
    );
  }

  return (
    <div
      className="relative h-[220px] sm:h-[300px] lg:h-[340px] touch-pan-y select-none"
      onPointerDown={(e) => {
        startX.current = e.clientX;
      }}
      onPointerUp={(e) => {
        if (startX.current == null) return;
        const dx = e.clientX - startX.current;
        startX.current = null;
        if (dx < -40) next();
        else if (dx > 40) prev();
      }}
      onClick={next}
      role="button"
      tabIndex={0}
      aria-label="Flip Afterimage stills"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "Enter") next();
        if (e.key === "ArrowLeft") prev();
      }}
    >
      {shown.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${src}-${offset}-${i}`}
          src={src}
          alt=""
          draggable={false}
          className="absolute object-cover rounded-2xl border border-white/20 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.85)] transition-transform duration-500"
          style={{
            width: i === 0 ? "72%" : "56%",
            height: i === 0 ? "88%" : "72%",
            left: i === 0 ? "6%" : i === 1 ? "36%" : "16%",
            top: i === 0 ? "6%" : i === 1 ? "20%" : "36%",
            transform: `rotate(${[-8, 6, 2][i]}deg)`,
            zIndex: i === 0 ? 2 : i === 1 ? 3 : 1,
          }}
        />
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
  const [seed, setSeed] = useState(1);
  useEffect(() => {
    setSeed(visitSeed("den-home-strip"));
  }, []);
  const deck = useMemo(() => shuffle(prints.filter(Boolean), seed).slice(0, 4), [prints, seed]);
  if (!deck.length) return null;
  return (
    <div className="absolute inset-0 flex items-end justify-center gap-2 px-6 sm:px-8 pb-3 overflow-x-auto">
      {deck.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src + i}
          src={src}
          alt=""
          className="h-[78%] w-[22%] min-w-[52px] object-cover rounded-md border border-white/15 shadow-2xl"
          style={{ transform: `rotate(${[-8, -2, 3, 9][i] || 0}deg) translateY(${i % 2 ? 8 : 0}px)` }}
        />
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
  const [seed, setSeed] = useState(1);
  useEffect(() => {
    setSeed(visitSeed("den-home-game"));
  }, []);
  const pick = useMemo(() => {
    const list = covers.filter((c) => c.cover);
    if (!list.length) return null;
    return shuffle(list, seed)[0];
  }, [covers, seed]);

  return (
    <>
      <div className="relative h-40 sm:h-48 bg-[#0a0a0e]">
        {pick ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/gaming/cover?u=${encodeURIComponent(pick.cover)}`}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-85"
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
