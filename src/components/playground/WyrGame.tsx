"use client";

import { useEffect, useMemo, useState } from "react";
import {
  pickNext,
  scorePicks,
  WYR_PAIRS,
  type WyrLean,
  type WyrPack,
  type WyrPair,
} from "@/lib/wyr-data";

type Phase = "play" | "result" | "card";

export function WyrGame() {
  const [bank, setBank] = useState<WyrPair[]>(WYR_PAIRS);
  const [phase, setPhase] = useState<Phase>("play");
  const [seen, setSeen] = useState<string[]>([]);
  const [pair, setPair] = useState<WyrPair | null>(null);
  const [picked, setPicked] = useState<"a" | "b" | null>(null);
  const [leans, setLeans] = useState<WyrLean[]>([]);
  const [split, setSplit] = useState<{ a: number; b: number } | null>(null);
  const [line, setLine] = useState("");
  const [lineBusy, setLineBusy] = useState(false);
  const [leaving, setLeaving] = useState<"a" | "b" | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [dealKey, setDealKey] = useState(0);

  useEffect(() => {
    fetch("/api/wyr/pairs")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.pairs) && data.pairs.length) setBank(data.pairs);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (pair) return;
    const next = pickNext(bank);
    if (!next) return;
    setPair(next);
    setSeen([next.id]);
  }, [bank, pair]);

  const pool = useMemo(() => {
    const skip = new Set(seen);
    return bank.filter((p) => !skip.has(p.id));
  }, [bank, seen]);

  const deal = (next: WyrPair) => {
    setSeen((s) => (s.includes(next.id) ? s : [...s, next.id]));
    setPair(next);
    setPicked(null);
    setSplit(null);
    setLine("");
    setLeaving(null);
    setDealKey((k) => k + 1);
    setPhase("play");
  };

  const choose = async (side: "a" | "b") => {
    if (!pair || picked) return;
    setPicked(side);
    setLeaving(side === "a" ? "b" : "a");
    setLeans((prev) => [...prev, side === "a" ? pair.aLean : pair.bLean]);
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
  };

  const denLine = async () => {
    if (!pair || !picked) return;
    setLineBusy(true);
    try {
      const res = await fetch("/api/wyr/line", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ a: pair.a, b: pair.b, picked }),
      });
      const data = await res.json();
      setLine(data.line || "The Den has nothing extra for that one.");
    } catch {
      setLine("The Den has nothing extra for that one.");
    } finally {
      setLineBusy(false);
    }
  };

  const nextPair = () => {
    if (leans.length >= 10) {
      setPhase("card");
      return;
    }
    const next = pickNext(pool, pair?.packs);
    if (!next) {
      setPhase("card");
      return;
    }
    deal(next);
  };

  const restart = () => {
    const next = pickNext(bank);
    setSeen(next ? [next.id] : []);
    setLeans([]);
    if (next) deal(next);
    else setPhase("play");
  };

  const score = scorePicks(leans);
  const totalSplit = (split?.a || 0) + (split?.b || 0) || 1;
  const pctA = Math.round(((split?.a || 0) / totalSplit) * 100);
  const pctB = 100 - pctA;
  const showSplitNums = totalSplit >= 3;

  return (
    <div className="relative max-w-3xl lg:max-w-4xl mx-auto px-3 sm:px-6 pb-20">
      <div className="text-center mb-6 sm:mb-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          <h1 className="den-title-glow text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-300 via-rose-100 to-purple-300">
            Would You Rather
          </h1>
          <button
            type="button"
            onClick={() => setInfoOpen((v) => !v)}
            className="w-7 h-7 rounded-full border border-red-800/50 text-[11px] font-semibold text-neutral-300 hover:text-white hover:bg-red-950/40 flex items-center justify-center"
          >
            i
          </button>
        </div>
        <p className="text-neutral-200 text-sm sm:text-base font-medium">Two real costs. Tap one.</p>
        {infoOpen && (
          <div className="mt-4 text-left mx-auto max-w-md rounded-xl border border-red-900/30 bg-black/80 p-4 text-xs text-neutral-400 leading-relaxed">
            Nasty human dilemmas. 18+. Ten picks then a scorecard. Nothing repeats in a run.
          </div>
        )}
      </div>

      {pair && phase !== "card" && (
        <div key={dealKey} className="space-y-3 sm:space-y-4 wyr-deal">
          <p className="text-center text-[11px] uppercase tracking-[0.28em] text-red-300/70">
            {leans.length}/10
          </p>
          {(
            [
              ["a", pair.a, "This"] as const,
              ["b", pair.b, "Or this"] as const,
            ]
          ).map(([side, text, label], idx) => {
            const chosen = picked === side;
            const dead = leaving === side;
            const red = side === "a";
            return (
              <button
                key={`${dealKey}-${side}`}
                type="button"
                disabled={!!picked}
                onClick={() => choose(side)}
                className={`wyr-choice relative w-full text-left overflow-hidden rounded-3xl border px-5 py-7 sm:px-8 sm:py-10 lg:py-12 ${
                  idx === 0 ? "wyr-tilt-l" : "wyr-tilt-r"
                } ${
                  chosen ? "wyr-lock" : dead ? "wyr-crack" : "hover:scale-[1.015]"
                } ${
                  red
                    ? "border-red-800/50 bg-gradient-to-br from-red-950/70 via-[#14080c] to-black shadow-[0_0_40px_-12px_rgba(185,28,92,0.55)]"
                    : "border-purple-800/50 bg-gradient-to-br from-purple-950/70 via-[#0c0814] to-black shadow-[0_0_40px_-12px_rgba(124,58,237,0.5)]"
                }`}
              >
                <div
                  className={`pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full blur-3xl ${
                    red ? "bg-red-600/25" : "bg-purple-600/25"
                  }`}
                />
                <span
                  className={`text-[10px] sm:text-xs uppercase tracking-[0.24em] font-semibold block mb-3 ${
                    red ? "text-red-300/80" : "text-purple-300/80"
                  }`}
                >
                  {label}
                </span>
                <span className="relative text-[1.15rem] sm:text-2xl lg:text-[1.75rem] leading-snug font-medium text-neutral-50">
                  {text}
                </span>
              </button>
            );
          })}

          {phase === "result" && split && (
            <div className="pt-3 space-y-4">
              <div className="h-2.5 rounded-full bg-neutral-900 overflow-hidden flex border border-neutral-800">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-rose-400 transition-all duration-700"
                  style={{ width: `${pctA}%` }}
                />
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-400 transition-all duration-700"
                  style={{ width: `${pctB}%` }}
                />
              </div>
              {showSplitNums && (
                <p className="text-center text-xs text-neutral-400 tracking-wide">
                  Room split {pctA} / {pctB}
                </p>
              )}
              {line ? (
                <p className="text-center text-sm sm:text-base text-rose-100 italic">“{line}”</p>
              ) : (
                <button
                  type="button"
                  onClick={denLine}
                  disabled={lineBusy}
                  className="block mx-auto text-sm text-purple-300 hover:text-purple-100"
                >
                  {lineBusy ? "…" : "Den line"}
                </button>
              )}
              <button
                type="button"
                onClick={nextPair}
                className="w-full py-4 rounded-2xl bg-gradient-to-b from-red-600 via-red-800 to-purple-900 text-white text-base font-semibold shadow-[0_0_30px_-8px_rgba(185,28,92,0.7)]"
              >
                {leans.length >= 10 ? "Scorecard" : "Next"}
              </button>
            </div>
          )}
        </div>
      )}

      {phase === "card" && (
        <div className="wyr-stamp rounded-3xl border border-red-800/40 bg-gradient-to-b from-red-950/40 to-[#111] p-7 sm:p-10 space-y-6 text-center shadow-[0_0_60px_-16px_rgba(185,28,92,0.6)]">
          <p className="text-[10px] uppercase tracking-[0.28em] text-red-300/80">Scorecard</p>
          <h2 className="text-3xl sm:text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-red-300 to-purple-300">
            {score.title}
          </h2>
          <p className="text-base text-neutral-200 leading-relaxed">{score.line}</p>
          <div className="space-y-3 text-left">
            {(
              [
                ["Appetite", score.appetite],
                ["Image", score.image],
                ["Stay", score.stay],
              ] as const
            ).map(([label, val]) => (
              <div key={label}>
                <div className="flex justify-between text-[11px] uppercase tracking-wide text-neutral-500 mb-1">
                  <span>{label}</span>
                  <span>{Math.round(val * 100)}</span>
                </div>
                <div className="h-2 rounded-full bg-neutral-900 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-500 to-purple-500"
                    style={{ width: `${Math.round(val * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={restart}
            className="w-full py-4 rounded-2xl bg-gradient-to-b from-red-600 via-red-800 to-purple-900 text-white text-base font-semibold"
          >
            Run it again
          </button>
        </div>
      )}
    </div>
  );
}
