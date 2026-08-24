"use client";

import Link from "next/link";
import "./playground.css";

const GAMES = [
  {
    href: "/playground/face-the-den",
    title: "Face The Den",
    tag: "Live",
    line: "Upload. Get judged. Climb the ranks.",
    accent: "from-red-500/30 via-rose-500/10 to-transparent",
    border: "hover:border-rose-500/40",
    chip: "border-rose-500/40 text-rose-200",
  },
  {
    href: "/playground/would-you-rather",
    title: "Would You Rather",
    tag: "Live",
    line: "Two real costs. Pick one. Get clocked.",
    accent: "from-purple-500/30 via-fuchsia-500/10 to-transparent",
    border: "hover:border-purple-500/40",
    chip: "border-purple-500/40 text-purple-200",
  },
  {
    href: "/playground/highway-hunter",
    title: "Highway Hunter",
    tag: "Preview",
    line: "Night interstate. Guns. Power-ups. Soft wrecks.",
    accent: "from-amber-500/25 via-orange-500/10 to-transparent",
    border: "hover:border-amber-500/40",
    chip: "border-amber-500/40 text-amber-200",
  },
  {
    href: "#",
    title: "Den Arena",
    tag: "Soon",
    line: "1v1 face-off. ELO later.",
    accent: "from-neutral-700/20 to-transparent",
    border: "",
    chip: "border-neutral-800 text-neutral-600",
    disabled: true,
  },
];

export default function PlaygroundLobby() {
  return (
    <div className="relative overflow-hidden min-h-[calc(100vh-8rem)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="pg-orb pg-orb-a" />
        <div className="pg-orb pg-orb-b" />
        <div className="pg-orb pg-orb-c" />
        <div className="den-grain" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-20">
        <div className="text-center mb-10">
          <p className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full border border-rose-500/30 bg-black/40 text-[10px] uppercase tracking-[0.28em] text-rose-200">
            Playground
          </p>
          <h1 className="pg-title text-4xl sm:text-6xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-300 via-fuchsia-200 to-amber-200">
            Pick a machine
          </h1>
          <p className="mt-3 text-neutral-300 max-w-lg mx-auto text-sm sm:text-base">
            Short games. 18+. Each one has its own page if you want to send someone in.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {GAMES.map((g) => {
            const card = (
              <div
                className={`pg-card relative overflow-hidden rounded-3xl border border-white/10 bg-black/55 backdrop-blur-md p-5 sm:p-6 min-h-[200px] flex flex-col justify-between ${
                  g.disabled ? "pg-card-disabled opacity-55" : g.border
                }`}
              >
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${g.accent}`} />
                <div className="relative">
                  <span className={`text-[10px] uppercase tracking-[0.18em] px-2 py-0.5 rounded-full border ${g.chip}`}>
                    {g.tag}
                  </span>
                  <h2 className="mt-4 text-xl sm:text-2xl font-semibold text-neutral-50 leading-tight">{g.title}</h2>
                  <p className="mt-2 text-sm text-neutral-400 leading-relaxed">{g.line}</p>
                </div>
                <p className={`relative mt-6 text-sm font-medium ${
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
