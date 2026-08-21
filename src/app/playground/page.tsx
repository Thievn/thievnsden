"use client";

import { useState } from "react";
import { GalleryStack } from "@/components/GalleryStack";
import { JudgePanel } from "@/app/playground/JudgePanel";
import { RanksList } from "@/components/RanksList";

type Tab = "judge" | "gallery" | "ranks";

export default function PlaygroundPage() {
  const [tab, setTab] = useState<Tab>("judge");
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <div className="relative overflow-hidden min-h-[calc(100vh-8rem)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="den-ember absolute bottom-[-20%] left-1/2 h-[55%] w-[120%] max-w-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 50% 100%, rgba(185,28,92,0.22) 0%, rgba(124,20,50,0.08) 35%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-[8%] left-1/2 -translate-x-1/2 h-[280px] w-[90%] max-w-xl"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(185,28,92,0.12) 0%, transparent 65%)",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#070707_78%)]" />
        <div className="den-grain" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4 px-3.5 py-1.5 rounded-full border border-red-900/30 bg-black/40 backdrop-blur-sm shadow-[0_0_20px_-6px_rgba(185,28,92,0.4)]">
            <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-red-400 to-purple-500 animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.22em] text-neutral-300 font-medium">
              Playground
            </span>
          </div>

          <div className="flex items-center justify-center gap-2.5 mb-2">
            <h1 className="den-title-glow text-3xl sm:text-4xl md:text-[2.75rem] font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-300 via-rose-200 to-purple-300">
              Face The Den
            </h1>
            <button
              type="button"
              onClick={() => setInfoOpen((v) => !v)}
              className="relative w-6 h-6 rounded-full border border-neutral-600/80 text-[11px] font-semibold text-neutral-400 hover:text-neutral-100 hover:border-red-800/50 hover:bg-red-950/30 transition-all flex items-center justify-center shrink-0"
              aria-label="What is Face The Den?"
              title="What is Face The Den?"
            >
              i
            </button>
          </div>

          <p className="text-neutral-300 text-sm sm:text-base max-w-md mx-auto leading-relaxed font-medium">
            Upload. Get judged. Hit the gallery. Climb the ranks.
          </p>

          {infoOpen && (
            <div className="mt-5 mx-auto max-w-md text-left rounded-xl border border-red-900/25 bg-[#0a0a0a]/95 backdrop-blur-sm p-4 text-xs text-neutral-400 leading-relaxed space-y-2 shadow-[0_0_30px_-10px_rgba(185,28,92,0.35)]">
              <p>
                <span className="text-neutral-100 font-medium">Face The Den</span> is a roast / rating
                game. You upload a photo, pick a style (honest → filthy), and the Den scores it.
              </p>
              <p>
                Every public card gets a <span className="text-neutral-200">score</span>, a{" "}
                <span className="text-neutral-200">rarity tier</span> (Trash → Legendary), and lands in
                the gallery. Others swipe the stack and vote{" "}
                <span className="text-neutral-200">Nope</span> or{" "}
                <span className="text-orange-300">Fire</span>.
              </p>
              <p>
                Ranks track <span className="text-orange-300">Most Fire</span> and{" "}
                <span className="text-red-300">Most Nope</span> from gallery votes. Climb either board.
              </p>
              <button
                type="button"
                onClick={() => setInfoOpen(false)}
                className="text-neutral-500 hover:text-neutral-300 text-[11px]"
              >
                Close
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-1 p-1.5 rounded-2xl border border-neutral-800/90 bg-black/50 backdrop-blur-sm mb-8 shadow-[0_0_40px_-16px_rgba(185,28,92,0.25)]">
          {(
            [
              ["judge", "Judge"],
              ["gallery", "Gallery"],
              ["ranks", "Ranks"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all ${
                tab === id
                  ? "bg-gradient-to-b from-red-800/50 via-red-950/40 to-purple-950/50 text-neutral-50 border border-red-800/40 shadow-[0_0_20px_-6px_rgba(185,28,92,0.5)]"
                  : "text-neutral-500 hover:text-neutral-200 border border-transparent"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "judge" && <JudgePanel />}
      {tab === "gallery" && (
        <div className="pb-16 px-2">
          <GalleryStack compact />
        </div>
      )}
      {tab === "ranks" && (
        <div className="relative max-w-4xl mx-auto px-4 pb-16">
          <RanksList compact showHeader />
        </div>
      )}
    </div>
  );
}
