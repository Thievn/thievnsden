"use client";

import Link from "next/link";

const GAMES = [
  {
    href: "/playground/face-the-den",
    title: "Face The Den",
    tag: "Live",
    line: "Upload. Get judged. Climb the ranks.",
    tilt: "-rotate-1",
  },
  {
    href: "/playground/would-you-rather",
    title: "Would You Rather",
    tag: "Live",
    line: "Two real costs. Pick one. Get clocked.",
    tilt: "rotate-1",
  },
  {
    href: "#",
    title: "Den Arena",
    tag: "Soon",
    line: "1v1 face-off. ELO later.",
    tilt: "-rotate-[0.5deg]",
    disabled: true,
  },
];

export default function PlaygroundLobby() {
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

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-20">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4 px-3.5 py-1.5 rounded-full border border-red-900/30 bg-black/40">
            <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-red-400 to-purple-500 animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.22em] text-neutral-300 font-medium">
              Playground
            </span>
          </div>
          <h1 className="den-title-glow text-3xl sm:text-4xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-300 via-rose-200 to-purple-300">
            Pick a machine
          </h1>
          <p className="mt-3 text-sm text-neutral-400 max-w-md mx-auto">
            Short games. 18+. Each one has its own page if you want to send someone in.
          </p>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory px-1">
          {GAMES.map((g) => {
            const inner = (
              <div
                className={`wyr-cabinet snap-center shrink-0 w-[78vw] max-w-[280px] sm:w-[260px] rounded-3xl border border-neutral-800 bg-[#111] p-5 min-h-[280px] flex flex-col justify-between ${g.tilt} ${
                  g.disabled ? "opacity-55" : "hover:border-red-900/40"
                }`}
              >
                <div>
                  <span
                    className={`text-[10px] uppercase tracking-[0.18em] px-2 py-0.5 rounded border ${
                      g.disabled
                        ? "border-neutral-800 text-neutral-600"
                        : "border-red-900/40 text-red-300/90"
                    }`}
                  >
                    {g.tag}
                  </span>
                  <h2 className="mt-4 text-xl font-semibold text-neutral-50 leading-tight">
                    {g.title}
                  </h2>
                  <p className="mt-2 text-sm text-neutral-400 leading-relaxed">{g.line}</p>
                </div>
                <p className="text-sm text-red-400/80">
                  {g.disabled ? "Not open" : "Enter →"}
                </p>
              </div>
            );
            return g.disabled ? (
              <div key={g.title}>{inner}</div>
            ) : (
              <Link key={g.title} href={g.href} className="shrink-0">
                {inner}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
