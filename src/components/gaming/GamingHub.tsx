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

function sectionTitle(id: FilterId | "playing") {
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
      (i) => !(i.kind === "radar" && i.id === "radar-placeholder" && radarExtra.length > 0)
    );
    return [...withoutPlaceholderRadar, ...radarExtra].sort((a, b) => a.sort - b.sort);
  }, [items, radarExtra]);

  const visible = useMemo(() => {
    if (filter === "all") return merged;
    return merged.filter((i) => i.kind === filter);
  }, [merged, filter]);

  const playing = merged.filter((i) => i.kind === "playing");
  const currently =
    config.currently_line && !config.currently_line.includes("loading")
      ? config.currently_line
      : playing.length
        ? `Currently in: ${playing.map((p) => p.title).join(" · ")}`
        : config.currently_line;

  const grouped =
    filter === "all"
      ? ([
          "playing",
          "radar",
          "drama",
          "season",
          "watchlist",
          "library",
        ] as const)
          .map((kind) => ({
            kind,
            items: merged.filter((i) => i.kind === kind),
          }))
          .filter((g) => g.items.length > 0)
      : [{ kind: filter, items: visible }];

  return (
    <div className="relative min-h-[70vh]">
      {/* Atmosphere */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="den-ember absolute left-1/2 top-0 h-[420px] w-[720px] max-w-[140%] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,_rgba(185,28,92,0.14)_0%,_transparent_70%)] blur-2xl" />
        <div className="den-grain" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_transparent_0%,_#070707_70%)]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <header className="mb-10 sm:mb-12">
          <p className="text-[11px] uppercase tracking-[0.28em] text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 mb-3">
            Gaming
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-50 den-title-glow mb-3">
            In the Den
          </h1>
          <p className="text-neutral-500 max-w-xl text-sm sm:text-base leading-relaxed">
            {config.hero_line}
          </p>
          <p className="mt-3 text-sm text-neutral-400">{currently}</p>
        </header>

        {/* Filters */}
        <div className="sticky top-14 z-20 -mx-4 sm:mx-0 px-4 sm:px-0 py-3 mb-8 backdrop-blur-md bg-[#070707]/85 border-b border-neutral-900/80">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`shrink-0 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  filter === f.id
                    ? "bg-gradient-to-r from-red-900/50 to-purple-900/50 text-neutral-100 border border-red-900/40"
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

        <div className="space-y-12">
          {grouped.map((g) => (
            <section key={g.kind}>
              <div className="flex items-end justify-between gap-3 mb-4">
                <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-400">
                  {sectionTitle(g.kind as FilterId)}
                </h2>
                <span className="text-[11px] text-neutral-600 tabular-nums">
                  {g.items.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {g.items.map((item) => (
                  <GameCard key={item.id} item={item} />
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
      </div>
    </div>
  );
}
