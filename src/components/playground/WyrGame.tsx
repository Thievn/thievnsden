"use client";

import { useEffect, useMemo, useState } from "react";
import {
  pickNext,
  scorePicks,
  WYR_PAIRS,
  type WyrHeat,
  type WyrLean,
  type WyrPack,
  type WyrPair,
} from "@/lib/wyr-data";

type Phase = "setup" | "play" | "result" | "card";

function filterBank(
  bank: WyrPair[],
  opts: { heat?: WyrHeat | "mixed"; pack?: WyrPack | "all"; exclude?: string[] }
) {
  const exclude = new Set(opts.exclude || []);
  return bank.filter((p) => {
    if (exclude.has(p.id)) return false;
    if (opts.heat && opts.heat !== "mixed" && p.heat !== opts.heat) return false;
    if (opts.pack && opts.pack !== "all" && !p.packs.includes(opts.pack)) return false;
    return true;
  });
}

export function WyrGame() {
  const [bank, setBank] = useState<WyrPair[]>(WYR_PAIRS);
  const [heat, setHeat] = useState<WyrHeat | "mixed">("mixed");
  const [pack, setPack] = useState<WyrPack | "all">("all");
  const [goal, setGoal] = useState<10 | 25 | 0>(10);
  const [phase, setPhase] = useState<Phase>("setup");
  const [seen, setSeen] = useState<string[]>([]);
  const [pair, setPair] = useState<WyrPair | null>(null);
  const [picked, setPicked] = useState<"a" | "b" | null>(null);
  const [leans, setLeans] = useState<WyrLean[]>([]);
  const [split, setSplit] = useState<{ a: number; b: number } | null>(null);
  const [line, setLine] = useState("");
  const [lineBusy, setLineBusy] = useState(false);
  const [leaving, setLeaving] = useState<"a" | "b" | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);

  useEffect(() => {
    fetch("/api/wyr/pairs")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.pairs) && data.pairs.length) setBank(data.pairs);
      })
      .catch(() => {});
  }, []);

  const pool = useMemo(
    () => filterBank(bank, { heat, pack, exclude: seen }),
    [bank, heat, pack, seen]
  );

  const start = () => {
    const next = pickNext(filterBank(bank, { heat, pack, exclude: [] }));
    if (!next) return;
    setSeen([next.id]);
    setPair(next);
    setPicked(null);
    setLeans([]);
    setSplit(null);
    setLine("");
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
      const a = Number(data.picksA) || (side === "a" ? 1 : 0);
      const b = Number(data.picksB) || (side === "b" ? 1 : 0);
      setSplit({ a, b });
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
    if (goal && leans.length >= goal) {
      setPhase("card");
      return;
    }
    const next = pickNext(pool, pair?.packs);
    if (!next) {
      setPhase("card");
      return;
    }
    setSeen((s) => [...s, next.id]);
    setPair(next);
    setPicked(null);
    setSplit(null);
    setLine("");
    setLeaving(null);
    setPhase("play");
  };

  const score = scorePicks(leans);
  const totalSplit = (split?.a || 0) + (split?.b || 0) || 1;
  const pctA = Math.round(((split?.a || 0) / totalSplit) * 100);
  const pctB = 100 - pctA;

  return (
    <div className="relative max-w-2xl mx-auto px-4 sm:px-6 pb-16">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2.5 mb-2">
          <h1 className="den-title-glow text-3xl sm:text-4xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-300 via-rose-200 to-purple-300">
            Would You Rather
          </h1>
          <button
            type="button"
            onClick={() => setInfoOpen((v) => !v)}
            className="relative w-6 h-6 rounded-full border border-neutral-600/80 text-[11px] font-semibold text-neutral-400 hover:text-neutral-100 hover:border-red-800/50 flex items-center justify-center"
            aria-label="About this game"
          >
            i
          </button>
        </div>
        <p className="text-neutral-300 text-sm max-w-md mx-auto leading-relaxed">
          Two real costs. Pick one. See the room. Get clocked.
        </p>
        {infoOpen && (
          <div className="mt-4 text-left mx-auto max-w-md rounded-xl border border-red-900/25 bg-[#0a0a0a]/95 p-4 text-xs text-neutral-400 leading-relaxed space-y-2">
            <p>Human dilemmas. Nasty included. 18+. No repeats in a run.</p>
            <p>Scorecard comes from the pattern of your picks.</p>
            <button type="button" onClick={() => setInfoOpen(false)} className="text-neutral-500">
              Close
            </button>
          </div>
        )}
      </div>

      {phase === "setup" && (
        <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5 space-y-4">
          <p className="text-[11px] text-neutral-600">{bank.length} questions loaded</p>
          <label className="block text-xs text-neutral-500 space-y-1">
            <span>Heat</span>
            <select
              value={heat}
              onChange={(e) => setHeat(e.target.value as WyrHeat | "mixed")}
              className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200"
            >
              <option value="mixed">Mixed</option>
              <option value="clean">Cleaner</option>
              <option value="spicy">Spicy</option>
              <option value="nasty">Nasty</option>
            </select>
          </label>
          <label className="block text-xs text-neutral-500 space-y-1">
            <span>Pack (optional)</span>
            <select
              value={pack}
              onChange={(e) => setPack(e.target.value as WyrPack | "all")}
              className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200"
            >
              <option value="all">All packs</option>
              <option value="bodies">Bodies</option>
              <option value="love">Love / use</option>
              <option value="celebs">Celebs</option>
              <option value="reputation">Reputation</option>
              <option value="people">People</option>
              <option value="money">Money / work</option>
              <option value="internet">Internet</option>
            </select>
          </label>
          <label className="block text-xs text-neutral-500 space-y-1">
            <span>Length</span>
            <select
              value={goal}
              onChange={(e) => setGoal(Number(e.target.value) as 10 | 25 | 0)}
              className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200"
            >
              <option value={10}>10 then scorecard</option>
              <option value={25}>25 then scorecard</option>
              <option value={0}>Until the bank runs out</option>
            </select>
          </label>
          <button
            type="button"
            onClick={start}
            className="w-full py-3 rounded-xl bg-gradient-to-b from-red-700 via-red-800 to-purple-900 text-white text-sm font-medium"
          >
            Start
          </button>
        </div>
      )}

      {(phase === "play" || phase === "result") && pair && (
        <div className="space-y-4">
          <p className="text-center text-[11px] uppercase tracking-wide text-neutral-600">
            {leans.length}/{goal || "∞"} · {pair.heat}
          </p>
          <div className="space-y-3">
            {(
              [
                ["a", pair.a] as const,
                ["b", pair.b] as const,
              ]
            ).map(([side, text], idx) => {
              const chosen = picked === side;
              const dead = leaving === side;
              return (
                <button
                  key={side}
                  type="button"
                  disabled={!!picked}
                  onClick={() => choose(side)}
                  className={`wyr-card w-full text-left px-5 py-6 rounded-2xl border text-[15px] sm:text-base leading-snug ${
                    idx === 0 ? "wyr-tilt-l" : "wyr-tilt-r"
                  } ${
                    chosen
                      ? "wyr-lock border-red-800/50 bg-red-950/30 text-neutral-50"
                      : dead
                        ? "wyr-crack border-neutral-900 text-neutral-600"
                        : "border-neutral-800 bg-[#111] text-neutral-200 hover:border-neutral-600"
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 block mb-2">
                    {side === "a" ? "This" : "Or this"}
                  </span>
                  {text}
                </button>
              );
            })}
          </div>

          {phase === "result" && split && (
            <div className="space-y-3 pt-2">
              <div className="h-2 rounded-full bg-neutral-900 overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-red-700 to-rose-600 transition-all duration-700"
                  style={{ width: `${pctA}%` }}
                />
                <div
                  className="h-full bg-gradient-to-r from-purple-800 to-purple-600 transition-all duration-700"
                  style={{ width: `${pctB}%` }}
                />
              </div>
              <p className="text-xs text-neutral-500 text-center">
                {pctA}% this · {pctB}% the other
              </p>
              {line ? (
                <p className="text-sm text-neutral-300 text-center italic">“{line}”</p>
              ) : (
                <button
                  type="button"
                  onClick={denLine}
                  disabled={lineBusy}
                  className="block mx-auto text-xs text-purple-300/90"
                >
                  {lineBusy ? "…" : "Den line"}
                </button>
              )}
              <button
                type="button"
                onClick={nextPair}
                className="w-full py-3 rounded-xl border border-neutral-700 text-sm text-neutral-200"
              >
                {goal && leans.length >= goal ? "Scorecard" : "Next"}
              </button>
            </div>
          )}
        </div>
      )}

      {phase === "card" && (
        <div className="wyr-stamp rounded-2xl border border-red-900/30 bg-[#111] p-6 space-y-5 text-center">
          <p className="text-[10px] uppercase tracking-[0.22em] text-neutral-500">Scorecard</p>
          <h2 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-red-300 to-purple-300">
            {score.title}
          </h2>
          <p className="text-sm text-neutral-300 leading-relaxed">{score.line}</p>
          <div className="space-y-3 text-left">
            {(
              [
                ["Appetite", score.appetite],
                ["Image", score.image],
                ["Stay", score.stay],
              ] as const
            ).map(([label, val]) => (
              <div key={label}>
                <div className="flex justify-between text-[11px] text-neutral-500 mb-1">
                  <span>{label}</span>
                  <span>{Math.round(val * 100)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-neutral-900 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-700 to-purple-700"
                    style={{ width: `${Math.round(val * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-neutral-600">{leans.length} picks</p>
          <button
            type="button"
            onClick={() => {
              setPhase("setup");
              setSeen([]);
              setPair(null);
              setLeans([]);
            }}
            className="w-full py-3 rounded-xl bg-gradient-to-b from-red-700 via-red-800 to-purple-900 text-white text-sm"
          >
            Run it again
          </button>
        </div>
      )}
    </div>
  );
}
