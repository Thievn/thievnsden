"use client";

import Link from "next/link";
import { DenHero } from "@/components/den/DenHero";
import { PlaygroundCardArt } from "@/components/playground/PlaygroundCardArt";
import { PLAYGROUND_GAMES } from "@/lib/playground-games";
import "./playground.css";

export function PlaygroundLobby({ arts }: { arts: Record<string, string> }) {
  return (
    <div className="home-den relative overflow-hidden min-h-[calc(100vh-8rem)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="pg-orb pg-orb-a" />
        <div className="pg-orb pg-orb-b" />
        <div className="pg-orb pg-orb-c" />
        <div className="den-grain" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <DenHero
          tone="red"
          kicker="Playground · 18+"
          title="Pick a machine."
          accent="Stay as long as you want."
          body="Short games. No tutorials. Send someone a link and watch them sit down."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {PLAYGROUND_GAMES.map((g) => {
            const card = (
              <div
                className={`home-room pg-card relative overflow-hidden rounded-3xl border border-white/10 bg-[#070507] p-6 sm:p-7 min-h-[240px] flex flex-col justify-between ${
                  g.disabled ? "pg-card-disabled opacity-70" : ""
                }`}
              >
                <PlaygroundCardArt url={arts[g.id]} />
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${g.accent} z-[1]`} />
                <div className="relative z-[3]">
                  <span className={`text-[10px] uppercase tracking-[0.18em] px-2 py-0.5 rounded-full border ${g.chip}`}>
                    {g.tag}
                  </span>
                  <h2 className="mt-5 text-2xl sm:text-3xl font-semibold text-neutral-50 leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
                    {g.title}
                  </h2>
                  <p className="mt-3 text-sm text-neutral-300 leading-relaxed max-w-[28ch]">{g.line}</p>
                </div>
                <p
                  className={`relative z-[3] mt-8 text-sm font-medium ${
                    g.disabled
                      ? "text-neutral-600"
                      : "text-transparent bg-clip-text bg-gradient-to-r from-rose-300 to-amber-200"
                  }`}
                >
                  {g.disabled ? "Not open" : "Enter →"}
                </p>
              </div>
            );
            return g.disabled ? (
              <div key={g.id}>{card}</div>
            ) : (
              <Link key={g.id} href={g.href} className="block">
                {card}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
