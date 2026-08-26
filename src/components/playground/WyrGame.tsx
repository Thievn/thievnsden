"use client";

import { useEffect, useState } from "react";
import { scorePicks, type WyrLean, type WyrPair } from "@/lib/wyr-data";
import { WYR_BANK } from "@/lib/wyr-bank";
import { dealFromPool, floorTitle } from "@/lib/wyr-deal";
import { contrastLine, FLOOR_TICKER } from "@/lib/wyr-topics";

type Phase = "boot" | "play" | "result" | "card";

function pct(n: number) {
  return Math.round(n * 100);
}

export function WyrGame() {
  const [deal, setDeal] = useState<WyrPair[]>([]);
  const [floorName, setFloorName] = useState("The Floor");
  const [boot, setBoot] = useState(true);
  const [phase, setPhase] = useState<Phase>("boot");
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<"a" | "b" | null>(null);
  const [leans, setLeans] = useState<WyrLean[]>([]);
  const [split, setSplit] = useState<{ a: number; b: number } | null>(null);
  const [leaving, setLeaving] = useState<"a" | "b" | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [dealKey, setDealKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const [stingOn, setStingOn] = useState(false);
  const [crowdOn, setCrowdOn] = useState(false);

  const loadDeal = async () => {
    setBoot(true);
    setPhase("boot");
    try {
      const res = await fetch("/api/wyr/deal");
      const data = await res.json();
      const pairs: WyrPair[] = Array.isArray(data.pairs) ? data.pairs : [];
      if (pairs.length) {
        setDeal(pairs);
        setFloorName(data.floor?.title || "The Floor");
      } else {
        const fallback = dealFromPool(WYR_BANK, 10);
        setDeal(fallback);
        setFloorName(floorTitle(fallback));
      }
    } catch {
      const fallback = dealFromPool(WYR_BANK, 10);
      setDeal(fallback);
      setFloorName(floorTitle(fallback));
    } finally {
      setIndex(0);
      setPicked(null);
      setSplit(null);
      setLeaving(null);
      setLeans([]);
      setStingOn(false);
      setCrowdOn(false);
      setDealKey((k) => k + 1);
      setBoot(false);
      setPhase("play");
    }
  };

  useEffect(() => {
    loadDeal();
  }, []);

  const pair = deal[index] || null;
  const round = Math.min(index + 1, 10);
  const sting =
    picked && pair ? (picked === "a" ? pair.aSting : pair.bSting) : "";

  const choose = async (side: "a" | "b") => {
    if (!pair || picked) return;
    setPicked(side);
    setLeaving(side === "a" ? "b" : "a");
    setLeans((prev) => [...prev, side === "a" ? pair.aLean : pair.bLean]);
    setStingOn(false);
    setCrowdOn(false);
    try {
      const res = await fetch("/api/wyr/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pairId: pair.id, side }),
      });
      const data = await res.json();
      setSplit({
        a: Number(data.picksA) || (side === "a" ? 1 : 0),
        b: Number(data.picksB) || (side === "b" ? 1 : 0),
      });
    } catch {
      setSplit({ a: side === "a" ? 1 : 0, b: side === "b" ? 1 : 0 });
    }
    setPhase("result");
    window.setTimeout(() => setCrowdOn(true), 180);
    window.setTimeout(() => setStingOn(true), 520);
  };

  const nextRound = () => {
    if (leans.length >= 10 || index + 1 >= deal.length) {
      setPhase("card");
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
    setSplit(null);
    setLeaving(null);
    setStingOn(false);
    setCrowdOn(false);
    setDealKey((k) => k + 1);
    setPhase("play");
  };

  const restart = () => {
    loadDeal();
  };

  const score = scorePicks(leans);
  const totalSplit = (split?.a || 0) + (split?.b || 0) || 1;
  const pctA = Math.round(((split?.a || 0) / totalSplit) * 100);
  const pctB = 100 - pctA;
  const withCrowd =
    picked && split
      ? (picked === "a" ? split.a : split.b) >= (picked === "a" ? split.b : split.a)
      : null;

  const shareCard = async () => {
    const text = `The Floor stamped me ${score.title}.\n${score.line}\nthievnsden.com/playground/would-you-rather`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: score.title,
          text,
          url: "https://thievnsden.com/playground/would-you-rather",
        });
        return;
      }
    } catch {}
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="relative max-w-5xl mx-auto px-3 sm:px-6 pb-16 min-w-0">
      <div className="floor-chrome text-center mb-5 sm:mb-7">
        <div className="flex items-center justify-center gap-3 mb-3">
          <span className="floor-onair" aria-hidden>
            ON AIR
          </span>
          <button
            type="button"
            onClick={() => setInfoOpen((v) => !v)}
            className="w-7 h-7 rounded-full border border-amber-800/50 text-[11px] font-semibold text-neutral-300 hover:text-white hover:bg-amber-950/40 flex items-center justify-center"
            aria-label="About The Floor"
          >
            i
          </button>
        </div>
        <h1 className="den-title-glow text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-rose-100 to-violet-300">
          The Floor
        </h1>
        <p className="mt-2 text-neutral-200 text-sm sm:text-base font-medium">
          Would You Rather. Ten rounds. Pick a cost.
        </p>
        {infoOpen && (
          <div className="mt-4 text-left mx-auto max-w-md rounded-xl border border-amber-900/30 bg-black/80 p-4 text-xs text-neutral-400 leading-relaxed">
            Late-night 18+ gameshow. Two real costs every round. The room splits. Ten
            stamps, then a title. Nothing repeats in a run.
          </div>
        )}
      </div>

      <div className="floor-lamps mb-5" aria-hidden>
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={i}
            className={`floor-lamp ${i < leans.length ? "is-lit" : ""} ${
              i === leans.length && phase !== "card" ? "is-live" : ""
            }`}
          />
        ))}
      </div>

      {boot && (
        <div className="floor-boot rounded-[28px] border border-amber-900/35 bg-black/50 px-6 py-16 text-center">
          <p className="text-[11px] uppercase tracking-[0.32em] text-amber-300/80 mb-3">
            Warming the lights
          </p>
          <p className="text-neutral-200">The Floor is dealing ten.</p>
        </div>
      )}

      {pair && phase !== "card" && !boot && (
        <div key={dealKey} className="wyr-deal space-y-4 min-w-0">
          <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.22em] text-amber-200/80">
            <span>
              Round {String(round).padStart(2, "0")} / 10
            </span>
            <span className={`floor-heat floor-heat-${pair.heat}`}>{pair.heat}</span>
          </div>

          <p className="floor-chiron text-center text-[10px] sm:text-xs uppercase tracking-[0.28em] text-neutral-400">
            Tonight · {contrastLine(pair.topic, pair.topicB) || floorName}
          </p>

          <div className="floor-stage relative grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            <div className="floor-vs" aria-hidden>
              OR
            </div>
            {(
              [
                ["a", pair.a, "A"] as const,
                ["b", pair.b, "B"] as const,
              ]
            ).map(([side, text, label]) => {
              const chosen = picked === side;
              const dead = leaving === side;
              const red = side === "a";
              return (
                <button
                  key={`${dealKey}-${side}`}
                  type="button"
                  disabled={!!picked}
                  onClick={() => choose(side)}
                  className={`floor-podium wyr-choice relative w-full min-w-0 text-left overflow-hidden rounded-[28px] border px-5 py-7 sm:px-7 sm:py-10 ${
                    chosen ? "is-lock wyr-lock" : dead ? "is-dead wyr-crack" : ""
                  } ${red ? "is-a" : "is-b"}`}
                >
                  <span className="floor-podium-label">{label}</span>
                  <span className="relative block text-[1.12rem] sm:text-2xl leading-snug font-medium text-neutral-50">
                    {text}
                  </span>
                </button>
              );
            })}
          </div>

          {phase === "result" && split && (
            <div className="pt-2 space-y-4">
              <div
                className={`floor-crowd ${crowdOn ? "is-on" : ""}`}
                aria-label="Crowd split"
              >
                <div className="floor-crowd-bar">
                  <div className="floor-crowd-a" style={{ width: crowdOn ? `${pctA}%` : "50%" }} />
                  <div className="floor-crowd-b" style={{ width: crowdOn ? `${pctB}%` : "50%" }} />
                </div>
                <div className="flex justify-between text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                  <span className="text-rose-300/90 tabular-nums">{pctA} A</span>
                  <span className="text-neutral-400">
                    {withCrowd ? "You're with the room" : "You're alone on this"}
                  </span>
                  <span className="text-violet-300/90 tabular-nums">{pctB} B</span>
                </div>
              </div>
              {stingOn && sting && (
                <p className="floor-sting text-center text-sm sm:text-base text-amber-50 italic">
                  “{sting}”
                </p>
              )}
              <button
                type="button"
                onClick={nextRound}
                className="w-full py-4 rounded-2xl bg-gradient-to-b from-amber-500 via-rose-700 to-violet-900 text-white text-base font-semibold shadow-[0_0_30px_-8px_rgba(244,63,94,0.55)]"
              >
                {leans.length >= 10 ? "Open the stamp" : "Next round"}
              </button>
            </div>
          )}
        </div>
      )}

      {phase === "card" && (
        <div className="wyr-stamp relative overflow-hidden rounded-[28px] border border-amber-700/45 bg-gradient-to-b from-[#2a1808] via-[#14080c] to-black p-7 sm:p-10 text-center shadow-[0_0_80px_-10px_rgba(245,158,11,0.45)]">
          <div className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-amber-400/20 blur-3xl" />
          <p className="relative text-[10px] uppercase tracking-[0.32em] text-amber-300/90 mb-3">
            The Floor stamped you
          </p>
          <div className="relative mx-auto mb-4 h-14 w-14 rounded-full border border-amber-500/40 bg-black/40 flex items-center justify-center text-amber-200 text-xl shadow-[0_0_24px_rgba(245,158,11,0.45)]">
            ⌘
          </div>
          <h2 className="relative den-title-glow text-3xl sm:text-5xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-violet-200 mb-3">
            {score.title}
          </h2>
          <p className="relative text-base sm:text-lg text-neutral-100 leading-relaxed max-w-md mx-auto mb-8">
            {score.line}
          </p>
          <div className="relative space-y-4 text-left mb-8">
            {(
              [
                ["Appetite", "How hard you go", score.appetite],
                ["Image", "What you protect", score.image],
                ["Stay", "What you live with", score.stay],
              ] as const
            ).map(([label, hint, val]) => (
              <div key={label}>
                <div className="flex justify-between items-end text-[11px] mb-1.5">
                  <span>
                    <span className="uppercase tracking-wide text-neutral-300">{label}</span>
                    <span className="text-neutral-600 ml-2">{hint}</span>
                  </span>
                  <span className="text-amber-200 tabular-nums">{pct(val)}</span>
                </div>
                <div className="h-2.5 rounded-full bg-black/60 overflow-hidden border border-neutral-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 via-rose-400 to-violet-400"
                    style={{ width: `${pct(val)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="relative text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-4">
            {leans.length} rounds · one stamp
          </p>
          <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={shareCard}
              className="py-3.5 rounded-2xl border border-violet-700/50 text-violet-100 text-sm font-medium"
            >
              {copied ? "Copied" : "Share this stamp"}
            </button>
            <button
              type="button"
              onClick={restart}
              className="py-3.5 rounded-2xl bg-gradient-to-b from-amber-500 via-rose-700 to-violet-900 text-white text-sm font-semibold"
            >
              Deal me ten more
            </button>
          </div>
        </div>
      )}

      <div className="floor-ticker mt-8" aria-hidden>
        <div className="floor-ticker-track">
          <span>{FLOOR_TICKER}</span>
          <span>{FLOOR_TICKER}</span>
        </div>
      </div>
    </div>
  );
}
