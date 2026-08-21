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
        <div className="void-orb-a absolute top-[-10%] left-[15%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,_rgba(185,28,92,0.18)_0%,_transparent_70%)] blur-2xl" />
        <div className="void-orb-b absolute top-[20%] right-[-5%] h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,_rgba(124,58,237,0.16)_0%,_transparent_70%)] blur-2xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#070707_75%)]" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full border border-neutral-800/80 bg-[#0c0c0c]/80 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-red-500 to-purple-500 animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">Playground</span>
          </div>

          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-50">
              Face The Den
            </h1>
            <button
              type="button"
              onClick={() => setInfoOpen((v) => !v)}
              className="relative w-5 h-5 rounded-full border border-neutral-700 text-[10px] font-semibold text-neutral-400 hover:text-neutral-200 hover:border-neutral-500 transition-colors flex items-center justify-center"
              aria-label="What is Face The Den?"
              title="What is Face The Den?"
            >
              i
            </button>
          </div>

          <p className="text-neutral-400 text-sm max-w-md mx-auto leading-relaxed">
            Upload. Get judged. Hit the gallery. Climb the ranks.
          </p>

          {infoOpen && (
            <div className="mt-4 mx-auto max-w-md text-left rounded-xl border border-neutral-800 bg-[#0c0c0c] p-4 text-xs text-neutral-400 leading-relaxed space-y-2">
              <p>
                <span className="text-neutral-200 font-medium">Face The Den</span> is a roast / rating
                game. You upload a photo, pick a style (honest → filthy), and the Den scores it.
              </p>
              <p>
                Every public card gets a <span className="text-neutral-300">score</span>, a{" "}
                <span className="text-neutral-300">rarity tier</span> (Trash → Legendary), and lands in
                the gallery. Others swipe the stack and vote <span className="text-neutral-300">Nope</span>{" "}
                or <span className="text-orange-300">Fire</span>.
              </p>
              <p>
                Top scores and most-fired cards show up on <span className="text-neutral-300">Ranks</span>.
                Climb if you can take the heat.
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

        <div className="flex gap-1 p-1 rounded-xl border border-neutral-800/80 bg-[#0c0c0c] mb-8">
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
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === id
                  ? "bg-gradient-to-b from-red-900/40 to-purple-950/40 text-neutral-100 border border-red-900/30"
                  : "text-neutral-500 hover:text-neutral-300"
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
        <div className="relative max-w-2xl mx-auto px-4 pb-16">
          <RanksList compact limit={20} showHeader />
        </div>
      )}
    </div>
  );
}
