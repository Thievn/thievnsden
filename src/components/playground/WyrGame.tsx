"use client";

import { useEffect, useMemo, useState } from "react";
import { pickNext, scorePicks, type WyrLean, type WyrPair } from "@/lib/wyr-data";
import { WYR_BANK } from "@/lib/wyr-bank";

type Phase = "play" | "result" | "card";

export function WyrGame() {
  const [bank, setBank] = useState<WyrPair[]>(WYR_BANK);
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
  const [copied, setCopied] = useState(false);

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

  const shareCard = async () => {
    const text = `I'm a ${score.title} in the Den.\n${score.line}\nthievnsden.com/playground/would-you-rather`;
    try {
      if (navigator.share) {
        await navigator.share({ title: score.title, text, url: "https://thievnsden.com/playground/would-you-rather" });
        return;
      }
    } catch {}
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

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
                <span className={`text-[10px] sm:text-xs uppercase tracking-[0.24em] font-semibold block mb-3 ${
                  red ? "text-red-300/80" : "text-purple-300/80"
                }`}>{label}</span>
                <span className="relative text-[1.15rem] sm:text-2xl lg:text-[1.75rem] leading-snug font-medium text-neutral-50">
                  {text}
                </span>
              </button>
            );
          })}

          {phase === "result" && split && (
            <div className="pt-3 space-y-4">
              <div className="h-2.5 rounded-full bg-neutral-900 overflow-hidden flex border border-neutral-800">
                <div className="h-full bg-gradient-to-r from-red-500 to-rose-400 transition-all duration-700" style={{ width: `${pctA}%` }} />
                <div className="h-full bg-gradient-to-r from-violet-500 to-purple-400 transition-all duration-700" style={{ width: `${pctB}%` }} />
              </div>
              {showSplitNums && (
                <p className="text-center text-xs text-neutral-400 tracking-wide">Room split {pctA} / {pctB}</p>
              )}
              {line ? (
                <p className="text-center text-sm sm:text-base text-rose-100 italic">“{line}”</p>
              ) : (
                <button type="button" onClick={denLine} disabled={lineBusy} className="block mx-auto text-sm text-purple-300">
                  {lineBusy ? "…" : "Den line"}
                </button>
              )}
              <button
                type="button"
                onClick={nextPair}
                className="w-full py-4 rounded-2xl bg-gradient-to-b from-red-600 via-red-800 to-purple-900 text-white text-base font-semibold shadow-[0_0_30px_-8px_rgba(185,28,92,0.7)]"
              >
                {leans.length >= 10 ? "Open scorecard" : "Next"}
              </button>
            </div>
          )}
        </div>
      )}

      {phase === "card" && (
        <div className="wyr-stamp relative overflow-hidden rounded-[28px] border border-red-700/50 bg-gradient-to-b from-[#2a0b16] via-[#14080c] to-black p-7 sm:p-10 text-center shadow-[0_0_80px_-10px_rgba(185,28,92,0.75)]">
          <div className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-red-500/25 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-32 w-32 rounded-full bg-purple-600/20 blur-3xl" />
          <p className="relative text-[10px] uppercase tracking-[0.32em] text-red-300/90 mb-3">The Den stamped you</p>
          <div className="relative mx-auto mb-4 h-14 w-14 rounded-full border border-red-500/40 bg-black/40 flex items-center justify-center text-red-300 text-xl shadow-[0_0_24px_rgba(185,28,92,0.55)]">
            ⌘
          </div>
          <h2 className="relative den-title-glow text-3xl sm:text-5xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-red-200 via-white to-purple-200 mb-3">
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
                  <span className="text-red-200 tabular-nums">{Math.round(val * 100)}</span>
                </div>
                <div className="h-2.5 rounded-full bg-black/60 overflow-hidden border border-neutral-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-500 via-rose-400 to-purple-400"
                    style={{ width: `${Math.round(val * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="relative text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-4">{leans.length} picks · one title</p>
          <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={shareCard}
              className="py-3.5 rounded-2xl border border-purple-700/50 text-purple-100 text-sm font-medium"
            >
              {copied ? "Copied" : "Share this stamp"}
            </button>
            <button
              type="button"
              onClick={restart}
              className="py-3.5 rounded-2xl bg-gradient-to-b from-red-600 via-red-800 to-purple-900 text-white text-sm font-semibold"
            >
              Run it again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
