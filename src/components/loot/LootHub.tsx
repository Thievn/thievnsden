"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LOOT_SECTIONS, sectionBlurb, sectionLabel, type LootPick } from "@/lib/loot-data";
import { LootCover, LootHeroCard, LootLead, LootRow, LootSpread, LootTile } from "@/components/loot/LootCard";

function SectionLook({ items }: { items: LootPick[] }) {
  if (!items.length) return null;
  const lead = items[0];
  const rest = items.slice(1);
  const tiles = rest.slice(0, 2);
  const rows = rest.slice(2);

  return (
    <div className="space-y-4">
      {items.length === 1 ? (
        <LootSpread item={lead} />
      ) : items.length === 2 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((item) => (
            <LootTile key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7">
              <LootLead item={lead} />
            </div>
            <div className="lg:col-span-5 grid gap-4">
              {tiles.map((item) => (
                <LootTile key={item.id} item={item} />
              ))}
            </div>
          </div>
          {rows.length ? (
            <div className="rounded-[1.4rem] border border-white/8 bg-black/30 px-4 sm:px-5 divide-y divide-white/6">
              {rows.map((item) => (
                <LootRow key={item.id} item={item} />
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

export function LootHub({ initialPicks }: { initialPicks: LootPick[] }) {
  const [filter, setFilter] = useState("all");
  const live = useMemo(() => initialPicks.filter((p) => p.active !== false && p.name), [initialPicks]);
  const groups = LOOT_SECTIONS.map((s) => ({
    ...s,
    items: live.filter((p) => p.section === s.id),
  }));
  const filled = groups.filter((g) => g.items.length);
  const featured = live.find((p) => p.image_url) || live[0];
  const shown = filter === "all" ? live : live.filter((p) => p.section === filter);

  return (
    <div className="home-den relative min-h-[70vh]">
      <div className="loot-hero-orb pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1100px] h-[380px]" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pb-20 sm:pb-28">
        <header className="pt-8 sm:pt-12 pb-8 sm:pb-10">
          <p className="text-[11px] uppercase tracking-[0.32em] text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-purple-300 mb-4 font-medium">
            Loot · lookbook
          </p>
          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-neutral-50 leading-[0.98] max-w-3xl">
            Things that earned a place.
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-rose-200 to-purple-200">
              Not a dump of ASINs.
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-neutral-400 leading-relaxed">
            Mini takes, real searches. Browse like a shelf, not a spreadsheet.
          </p>
        </header>

        {featured ? (
          <div className="mb-10">
            <LootHeroCard item={featured} />
          </div>
        ) : null}

        <nav className="mb-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5" aria-label="Loot shelves">
          {groups.map((g) => {
            const cover = g.items.find((i) => i.image_url)?.image_url;
            const on = filter === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setFilter(on ? "all" : g.id)}
                className={`loot-shelf-chip relative overflow-hidden rounded-2xl border text-left min-h-[88px] ${
                  on ? "border-amber-400/50" : "border-white/10 hover:border-amber-500/30"
                }`}
              >
                {cover ? <LootCover name={g.label} src={cover} className="absolute inset-0 opacity-50" /> : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/20" />
                <div className="relative p-3.5">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-amber-100">{g.label}</p>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    {g.items.length ? `${g.items.length} on the shelf` : "Empty"}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="sticky top-14 z-20 -mx-4 sm:mx-0 px-4 sm:px-0 py-3 mb-8 backdrop-blur-md bg-[#070707]/88 border-b border-white/5">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {[{ id: "all", label: "All shelves" }, ...LOOT_SECTIONS.map((s) => ({ id: s.id, label: s.label }))].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setFilter(c.id)}
                className={`shrink-0 px-3.5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
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
          <div className="space-y-16">
            {filled.map((g) => (
              <section key={g.id} id={g.id} className="scroll-mt-28">
                <div className="mb-5 flex items-end justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-amber-200/85">{g.label}</h2>
                    <p className="text-sm text-neutral-500 mt-1">{g.blurb}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFilter(g.id)}
                    className="text-[11px] text-neutral-500 hover:text-amber-200"
                  >
                    Only this
                  </button>
                </div>
                <SectionLook items={g.items} />
              </section>
            ))}
          </div>
        ) : (
          <section>
            <div className="mb-6">
              <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-amber-200/85">{sectionLabel(filter)}</h2>
              <p className="text-sm text-neutral-500 mt-1">{sectionBlurb(filter)}</p>
            </div>
            <SectionLook items={shown} />
          </section>
        )}

        <p className="mt-16 text-[11px] text-neutral-600">
          Product links on this page are Amazon searches with the Den tag.{" "}
          <Link href="/about" className="text-neutral-500 hover:text-amber-200">
            How the house works
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
