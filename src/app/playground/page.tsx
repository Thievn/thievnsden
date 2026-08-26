"use client";

import Link from "next/link";
import "./playground.css";
import { DenHero } from "@/components/den/DenHero";

const GAMES = [
  {
    href: "/playground/face-the-den",
    title: "Face The Den",
    tag: "Live",
    line: "Walk in looking pretty. Leave with notes.",
    accent: "from-red-600/35 via-rose-900/20 to-transparent",
    chip: "border-rose-500/40 text-rose-200",
  },
  {
    href: "/playground/would-you-rather",
    title: "Would You Rather",
    tag: "Live",
    line: "Two bad options. Pick anyway. Get clocked.",
    accent: "from-violet-600/30 via-fuchsia-900/20 to-transparent",
    chip: "border-violet-500/40 text-violet-200",
  },
  {
    href: "/playground/highway-hunter",
    title: "Highway Hunter",
    tag: "Live",
    line: "Night interstate. Kits. Rebirths. Soft wrecks.",
    accent: "from-amber-500/25 via-orange-900/20 to-transparent",
    chip: "border-amber-500/40 text-amber-200",
  },
  {
    href: "#",
    title: "Den Arena",
    tag: "Soon",
    line: "1v1 later. The lights aren't on yet.",
    accent: "from-neutral-800/20 to-transparent",
    chip: "border-neutral-800 text-neutral-600",
    disabled: true,
  },
];

export default function PlaygroundLobby() {
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
          {GAMES.map((g) => {
            const card = (
              <div
                className={`home-room pg-card relative overflow-hidden rounded-3xl border border-white/10 bg-black/55 backdrop-blur-md p-6 sm:p-7 min-h-[220px] flex flex-col justify-between ${
                  g.disabled ? "pg-card-disabled opacity-55" : ""
                }`}
              >
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${g.accent}`} />
                <div className="relative">
                  <span className={`text-[10px] uppercase tracking-[0.18em] px-2 py-0.5 rounded-full border ${g.chip}`}>
                    {g.tag}
                  </span>
                  <h2 className="mt-5 text-2xl sm:text-3xl font-semibold text-neutral-50 leading-tight">{g.title}</h2>
                  <p className="mt-3 text-sm text-neutral-400 leading-relaxed">{g.line}</p>
                </div>
                <p className={`relative mt-8 text-sm font-medium ${
                  g.disabled ? "text-neutral-600" : "text-transparent bg-clip-text bg-gradient-to-r from-rose-300 to-amber-200"
                }`}>
                  {g.disabled ? "Not open" : "Enter →"}
                </p>
              </div>
            );
            return g.disabled ? (
              <div key={g.title}>{card}</div>
            ) : (
              <Link key={g.title} href={g.href} className="block">
                {card}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
