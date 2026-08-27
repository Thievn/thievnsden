"use client";

import { useMemo, useState } from "react";
import { LOOT_SECTIONS, sectionBlurb, sectionLabel, type LootPick } from "@/lib/loot-data";
import { DenHero } from "@/components/den/DenHero";
import { LootCard, LootCover } from "@/components/loot/LootCard";

export function LootHub({ initialPicks }: { initialPicks: LootPick[] }) {
  const [filter, setFilter] = useState<string>("all");
  const live = useMemo(() => initialPicks.filter((p) => p.active !== false && p.name), [initialPicks]);
  const chips = [{ id: "all", label: "All" }, ...LOOT_SECTIONS.map((s) => ({ id: s.id, label: s.label }))];
  const shown = filter === "all" ? live : live.filter((p) => p.section === filter);
  const groups = LOOT_SECTIONS.map((s) => ({
    ...s,
    items: live.filter((p) => p.section === s.id),
  })).filter((g) => g.items.length);
  const hero = live.filter((p) => p.image_url).slice(0, 3);

  return (
    <div className="home-den relative min-h-[70vh]">
      <div className="loot-hero-orb pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[980px] h-[320px] bg-[radial-gradient(ellipse_at_center,_rgba(245,158,11,0.14)_0%,_transparent_68%)]" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <DenHero
          tone="amber"
          kicker="Loot · from the shelf"
          title="Things that earned a place."
          accent="No fake roundups."
          body="Mini takes on gear, merch, and den tools. Each card is a real search, not a SKU dump. Click through if you want the note."
          visual={
            <div className="relative h-[220px] sm:h-[280px]">
              {hero.length ? (
                hero.map((item, i) => (
                  <div
                    key={item.id}
                    className="absolute overflow-hidden rounded-2xl border border-amber-200/20 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.85)]"
                    style={{
                      width: i === 0 ? "70%" : "52%",
                      height: i === 0 ? "88%" : "68%",
                      left: i === 0 ? "6%" : i === 1 ? "42%" : "16%",
                      top: i === 0 ? "4%" : i === 1 ? "24%" : "40%",
                      transform: `rotate(${[-8, 7, 2][i]}deg)`,
                      zIndex: i === 0 ? 2 : i === 1 ? 3 : 1,
                    }}
                  >
                    <LootCover name={item.name} src={item.image_url} className="h-full w-full" />
                  </div>
                ))
              ) : (
                <div className="h-full rounded-2xl border border-amber-900/30 bg-gradient-to-br from-amber-800/20 to-black" />
              )}
            </div>
          }
        />

        <div className="sticky top-14 z-20 -mx-4 sm:mx-0 px-4 sm:px-0 py-3 mb-8 backdrop-blur-md bg-[#070707]/85">
          <div className="flex gap-1.5 overflow-x-auto pb-1 snap-x">
            {chips.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setFilter(c.id)}
                className={`snap-start shrink-0 px-3.5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                  filter === c.id
                    ? "border border-amber-500/40 bg-amber-950/40 text-amber-100"
                    : "border border-neutral-800 text-neutral-500 hover:text-neutral-200"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {shown.length === 0 ? (
          <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-10 text-center text-sm text-neutral-500">
            Nothing on this shelf yet.
          </div>
        ) : filter === "all" ? (
          <div className="space-y-14">
            {groups.map((g) => (
              <section key={g.id} id={g.id} className="scroll-mt-28">
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-amber-200/80">{g.label}</h2>
                    <p className="text-[12px] text-neutral-600 mt-1">{g.blurb}</p>
                  </div>
                  <button type="button" onClick={() => setFilter(g.id)} className="text-[11px] text-neutral-500 hover:text-amber-200">
                    Only this
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {g.items.map((item, i) => (
                    <LootCard key={item.id} item={item} featured={i === 0 && g.items.length > 2} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <section>
            <div className="mb-5">
              <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-amber-200/80">{sectionLabel(filter)}</h2>
              <p className="text-[12px] text-neutral-600 mt-1">{sectionBlurb(filter)}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {shown.map((item, i) => (
                <LootCard key={item.id} item={item} featured={i === 0} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
