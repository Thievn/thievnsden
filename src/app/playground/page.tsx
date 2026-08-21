"use client";

import { useState } from "react";
import { GalleryStack } from "@/components/GalleryStack";
import { JudgePanel } from "@/app/playground/JudgePanel";
import { RanksList } from "@/components/RanksList";

type Tab = "judge" | "gallery" | "ranks";

export default function PlaygroundPage() {
  const [tab, setTab] = useState<Tab>("judge");

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
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-50 mb-1">
            Face The Den
          </h1>
          <p className="text-neutral-500 text-sm">Judge · Gallery · Ranks — one place</p>
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
