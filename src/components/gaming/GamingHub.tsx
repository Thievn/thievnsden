"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FILTERS,
  SEED_GAMING_ITEMS,
  type FilterId,
  type GamingConfig,
  type GamingItem,
  DEFAULT_GAMING_CONFIG,
} from "@/lib/gaming-data";
import { GameCard } from "@/components/gaming/GameCard";
import { CoverImage } from "@/components/gaming/CoverImage";
import { DenHero } from "@/components/den/DenHero";

function sectionTitle(id: FilterId | string) {
  switch (id) {
    case "playing":
      return "Now playing";
    case "radar":
      return "Release radar";
    case "drama":
      return "Drama & discourse";
    case "season":
      return "Seasons & patches";
    case "watchlist":
      return "Watchlist";
    case "library":
      return "Library pulse";
    case "article":
      return "Articles";
    default:
      return "Feed";
  }
}

export function GamingHub() {
  const [filter, setFilter] = useState<FilterId>("all");
  const [items, setItems] = useState<GamingItem[]>(SEED_GAMING_ITEMS);
  const [config, setConfig] = useState<GamingConfig>(DEFAULT_GAMING_CONFIG);
  const [radarExtra, setRadarExtra] = useState<GamingItem[]>([]);
  const [loadingRadar, setLoadingRadar] = useState(false);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (!config.radar_enabled || !config.rawg_api_key) {
      setRadarExtra([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingRadar(true);
      try {
        const res = await fetch("/api/gaming/radar");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data.items)) {
          setRadarExtra(data.items);
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoadingRadar(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [config.radar_enabled, config.rawg_api_key]);

  const merged = useMemo(() => {
    const base = items.filter((i) => i.published !== false);
    const withoutPlaceholderRadar = base.filter(
      (i) =>
        !(i.kind === "radar" && i.id === "radar-placeholder" && radarExtra.length > 0)
    );
    return [...withoutPlaceholderRadar, ...radarExtra].sort((a, b) => a.sort - b.sort);
  }, [items, radarExtra]);

  const visible = useMemo(() => {
    if (filter === "all") return merged;
    if (filter === "drama") {
      return merged.filter((i) => i.kind === "drama" || i.kind === "article");
    }
    return merged.filter((i) => i.kind === filter);
  }, [merged, filter]);

  const playing = merged.filter((i) => i.kind === "playing");
  const currently =
    config.currently_line && !config.currently_line.includes("loading")
      ? config.currently_line
      : playing.length
        ? `Currently in: ${playing.map((p) => p.title).join(" · ")}`
        : config.currently_line;

  const feature =
    filter === "all"
      ? visible.find((i) => i.featured) || visible[0]
      : null;
  const rest =
    filter === "all" && feature
      ? visible.filter((i) => i.id !== feature.id)
      : visible;

  const grouped =
    filter === "all"
      ? null
      : [{ kind: filter, items: visible }];

  const heroCovers = merged.filter((i) => i.cover).slice(0, 3);

  return (
    <div className="home-den relative min-h-[70vh]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="den-ember absolute left-1/2 top-0 h-[420px] w-[720px] max-w-[140%] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,_rgba(124,58,237,0.16)_0%,_transparent_70%)] blur-2xl" />
        <div className="den-grain" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <DenHero
          tone="violet"
          kicker="Gaming · now playing"
          title="What's on the plate."
          accent="No press kits."
          body={`${config.hero_line || "Builds, rants, radar, and whatever is actually eating the hours."} ${currently}`}
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
            {FILTERS.map((f) => (
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

        {loadingRadar && filter === "radar" && (
          <p className="text-xs text-neutral-600 mb-4">Pulling live releases…</p>
        )}

        {filter === "all" ? (
          <div className="space-y-10">
            {feature && (
              <section>
                <p className="text-xs uppercase tracking-wide text-neutral-500 mb-3">
                  Feature
                </p>
                <div className="grid grid-cols-1">
                  <GameCard item={feature} featured />
                </div>
              </section>
            )}

            {rest.length > 0 && (
              <section>
                <div className="flex items-end justify-between gap-3 mb-4">
                  <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-400">
                    Latest
                  </h2>
                  <span className="text-[11px] text-neutral-600 tabular-nums">
                    {rest.length}
                  </span>
                </div>
                <div className="flex sm:grid sm:grid-cols-2 gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible">
                  {rest.map((item) => (
                    <div key={item.id} className="min-w-[85%] sm:min-w-0 snap-start">
                      <GameCard item={item} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="space-y-12">
            {(grouped || []).map((g) => (
              <section key={g.kind}>
                <div className="flex items-end justify-between gap-3 mb-4">
                  <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-400">
                    {sectionTitle(g.kind)}
                  </h2>
                  <span className="text-[11px] text-neutral-600 tabular-nums">
                    {g.items.length}
                  </span>
                </div>
                <div className="flex sm:grid sm:grid-cols-2 gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible">
                  {g.items.map((item) => (
                    <div key={item.id} className="min-w-[85%] sm:min-w-0 snap-start">
                      <GameCard item={item} />
                    </div>
                  ))}
                </div>
              </section>
            ))}
            {visible.length === 0 && (
              <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-10 text-center">
                <p className="text-sm text-neutral-500">Nothing in this filter yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
