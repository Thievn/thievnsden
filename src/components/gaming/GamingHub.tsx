"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_GAMING_CONFIG,
  SEED_GAMING_ITEMS,
  SHELVES,
  shelfOf,
  type GamingConfig,
  type GamingItem,
  type GamingShelf,
} from "@/lib/gaming-data";
import { GameTile } from "@/components/gaming/GameTile";
import { CoverImage } from "@/components/gaming/CoverImage";
import { DenHero } from "@/components/den/DenHero";

const SECTION: Record<GamingShelf, { title: string; blurb: string }> = {
  current: { title: "Just out", blurb: "Current and recently released." },
  coming: { title: "Coming soon", blurb: "On the radar. Not pre-orders." },
  classic: { title: "Older & classics", blurb: "The pile that still holds up." },
  essay: { title: "Den takes", blurb: "Short notes on the culture, not recaps." },
};

export function GamingHub({
  initialItems,
  initialConfig,
}: {
  initialItems?: GamingItem[];
  initialConfig?: GamingConfig;
}) {
  const [filter, setFilter] = useState<GamingShelf | "all">("all");
  const [items, setItems] = useState<GamingItem[]>(initialItems?.length ? initialItems : SEED_GAMING_ITEMS);
  const [config, setConfig] = useState<GamingConfig>(initialConfig || DEFAULT_GAMING_CONFIG);

  useEffect(() => {
    if (initialItems?.length) return;
    (async () => {
      try {
        const res = await fetch("/api/gaming");
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data.items) && data.items.length > 0) {
          setItems(data.items);
        }
        if (data.config) {
          setConfig({ ...DEFAULT_GAMING_CONFIG, ...data.config });
        }
      } catch {
        /* seed fallback */
      }
    })();
  }, [initialItems]);

  const live = useMemo(
    () => items.filter((i) => i.published !== false && i.title),
    [items]
  );

  const playing = live.filter((i) => i.kind === "playing" || i.status === "playing");
  const currently =
    config.currently_line && !config.currently_line.includes("loading")
      ? config.currently_line
      : playing.length
        ? `In rotation: ${playing.map((p) => p.title).join(" · ")}`
        : "";

  const byShelf = (shelf: GamingShelf) => live.filter((i) => shelfOf(i) === shelf);

  const sections = (filter === "all" ? (["current", "coming", "classic", "essay"] as GamingShelf[]) : [filter])
    .map((id) => ({ id, items: byShelf(id) }))
    .filter((s) => s.items.length > 0);

  const heroCovers = live.filter((i) => i.cover).slice(0, 3);

  return (
    <div className="home-den relative min-h-[70vh]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="den-ember absolute left-1/2 top-0 h-[420px] w-[720px] max-w-[140%] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,_rgba(124,58,237,0.16)_0%,_transparent_70%)] blur-2xl" />
        <div className="den-grain" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <DenHero
          tone="violet"
          kicker="Gaming · short takes"
          title="What's on the plate."
          accent="No press kits."
          body={`${config.hero_line || "Small squares. Honest notes. Click through if you want more."} ${currently}`}
          visual={
            <div className="relative h-[240px] sm:h-[300px]">
              {heroCovers.length ? (
                heroCovers.map((item, i) => (
                  <div
                    key={item.id}
                    className="absolute overflow-hidden rounded-2xl border border-white/20 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.85)]"
                    style={{
                      width: i === 0 ? "68%" : "54%",
                      height: i === 0 ? "86%" : "70%",
                      left: i === 0 ? "8%" : i === 1 ? "38%" : "18%",
                      top: i === 0 ? "6%" : i === 1 ? "22%" : "38%",
                      transform: `rotate(${[-9, 7, 2][i]}deg)`,
                      zIndex: i === 0 ? 2 : i === 1 ? 3 : 1,
                    }}
                  >
                    <CoverImage
                      src={item.cover}
                      alt={item.title}
                      className="h-full w-full"
                      imgClassName="h-full w-full object-cover"
                    />
                  </div>
                ))
              ) : (
                <div className="h-full rounded-2xl bg-gradient-to-br from-violet-700/30 via-fuchsia-950/40 to-rose-900/20 border border-white/10" />
              )}
            </div>
          }
        />

        <div className="sticky top-14 z-20 -mx-4 sm:mx-0 px-4 sm:px-0 py-3 mb-8 backdrop-blur-md bg-[#070707]/85">
          <div className="flex gap-1.5 overflow-x-auto pb-1 snap-x snap-mandatory">
            {SHELVES.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`snap-start shrink-0 px-3.5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                  filter === f.id
                    ? "border border-violet-500/40 bg-violet-950/40 text-violet-100"
                    : "border border-neutral-800 text-neutral-500 hover:text-neutral-200 hover:border-neutral-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {sections.length === 0 ? (
          <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-10 text-center">
            <p className="text-sm text-neutral-500">Nothing on this shelf yet.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {sections.map((section) => (
              <section key={section.id}>
                <div className="mb-4">
                  <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-400">
                    {SECTION[section.id].title}
                  </h2>
                  <p className="text-[12px] text-neutral-600 mt-1">{SECTION[section.id].blurb}</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {section.items.map((item) => (
                    <GameTile key={item.id} item={item} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
