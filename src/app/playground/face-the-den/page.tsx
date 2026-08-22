"use client";

import { useState } from "react";
import Link from "next/link";
import { GalleryStack } from "@/components/GalleryStack";
import { JudgePanel } from "@/app/playground/JudgePanel";
import { RanksList } from "@/components/RanksList";

type Tab = "judge" | "gallery" | "ranks";

export default function FaceTheDenPage() {
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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#070707_78%)]" />
        <div className="den-grain" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14">
        <Link
          href="/playground"
          className="inline-block mb-6 text-sm text-neutral-500 hover:text-neutral-300"
        >
          ← Playground
        </Link>
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2.5 mb-2">
            <h1 className="den-title-glow text-3xl sm:text-4xl md:text-[2.75rem] font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-300 via-rose-200 to-purple-300">
              Face The Den
            </h1>
            <button
              type="button"
              onClick={() => setInfoOpen((v) => !v)}
              className="relative w-6 h-6 rounded-full border border-neutral-600/80 text-[11px] font-semibold text-neutral-400 hover:text-neutral-100 hover:border-red-800/50 flex items-center justify-center shrink-0"
              aria-label="What is Face The Den?"
            >
              i
            </button>
          </div>
          <p className="text-neutral-300 text-sm sm:text-base max-w-md mx-auto leading-relaxed font-medium">
            Upload. Get judged. Hit the gallery. Climb the ranks.
          </p>
          {infoOpen && (
            <div className="mt-5 mx-auto max-w-md text-left rounded-xl border border-red-900/25 bg-[#0a0a0a]/95 p-4 text-xs text-neutral-400 leading-relaxed space-y-2">
              <p>
                <span className="text-neutral-100 font-medium">Face The Den</span> is a roast / rating
                game. You upload a photo, pick a style, and the Den scores it.
              </p>
              <p>
                Public cards get a score, a rarity, and land in the gallery. Vote Nope or Fire.
              </p>
              <button type="button" onClick={() => setInfoOpen(false)} className="text-neutral-500">
                Close
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-1 p-1.5 rounded-2xl border border-neutral-800/90 bg-black/50 backdrop-blur-sm mb-8">
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
                  ? "bg-gradient-to-b from-red-800/50 via-red-950/40 to-purple-950/50 text-neutral-50 border border-red-800/40"
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
