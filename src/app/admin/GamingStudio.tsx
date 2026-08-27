"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_GAMING_CONFIG,
  ESSAY_TOPICS,
  SHELVES,
  slugify,
  type GamingConfig,
  type GamingItem,
  type GamingShelf,
  type PullEra,
} from "@/lib/gaming-data";
import { GamingCoverField } from "@/app/admin/GamingCoverField";

type SearchHit = {
  id: number;
  name: string;
  released?: string;
  background_image?: string | null;
  rating?: number;
  slug?: string;
};

export function GamingStudio() {
  const [config, setConfig] = useState<GamingConfig>(DEFAULT_GAMING_CONFIG);
  const [hasKey, setHasKey] = useState(false);
  const [items, setItems] = useState<GamingItem[]>([]);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [eraPick, setEraPick] = useState<PullEra | "auto">("auto");
  const [vault, setVault] = useState<GamingShelf | "all">("all");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [essayTopic, setEssayTopic] = useState(ESSAY_TOPICS[0]);

  const load = async () => {
    const res = await fetch("/api/admin/gaming");
    if (!res.ok) return;
    const data = await res.json();
    setConfig({ ...DEFAULT_GAMING_CONFIG, ...(data.config || {}) });
    setHasKey(Boolean(data.has_rawg_key));
    if (Array.isArray(data.items)) setItems(data.items);
  };

  useEffect(() => {
    load();
  }, []);

  const persistConfig = async (next: GamingConfig) => {
    setConfig(next);
    await fetch("/api/admin/gaming", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config: next }),
    });
  };

  const saveItems = async (next: GamingItem[], extraConfig?: Partial<GamingConfig>) => {
    setBusy("save");
    setMsg("");
    try {
      const res = await fetch("/api/admin/gaming", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: extraConfig ? { ...config, ...extraConfig } : config,
          items: next.map((i) => ({ ...i, slug: i.slug || slugify(i.title) })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      if (Array.isArray(data.items)) setItems(data.items);
      if (data.config) setConfig({ ...DEFAULT_GAMING_CONFIG, ...data.config });
      if (typeof data.has_rawg_key === "boolean") setHasKey(data.has_rawg_key);
      setMsg("Saved.");
    } catch (e: any) {
      setMsg(e.message || "Save failed");
    } finally {
      setBusy("");
    }
  };

  const search = async () => {
    if (query.trim().length < 2) return;
    setBusy("search");
    setMsg("");
    try {
      const res = await fetch(`/api/admin/gaming/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (data.error && (!data.results || !data.results.length)) throw new Error(data.error);
      setHits(data.results || []);
      if (!(data.results || []).length) setMsg("No games matched.");
    } catch (e: any) {
      setMsg(e.message || "Search failed");
    } finally {
      setBusy("");
    }
  };

  const addGame = async (hit: SearchHit) => {
    setBusy(`add-${hit.id}`);
    setMsg("");
    try {
      const res = await fetch("/api/admin/gaming/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawgId: hit.id,
          era: eraPick === "auto" ? undefined : eraPick,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Add failed");
      if (Array.isArray(data.items)) setItems(data.items);
      setHits([]);
      setQuery("");
      setMsg(`Added ${data.item?.title || hit.name} with a short take.`);
    } catch (e: any) {
      setMsg(e.message || "Add failed");
    } finally {
      setBusy("");
    }
  };

  const run = async (path: string, label: string, body?: unknown) => {
    setBusy(label);
    setMsg("");
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : "{}",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `${label} failed`);
      if (Array.isArray(data.items)) setItems(data.items);
      if (data.config) setConfig({ ...DEFAULT_GAMING_CONFIG, ...data.config });
      if (typeof data.has_rawg_key === "boolean") setHasKey(data.has_rawg_key);
      if (label === "pull") {
        setMsg(
          data.count
            ? `Pulled ${data.count}: ${(data.added || []).join(", ")}`
            : "Nothing new in the pool today."
        );
      } else if (label === "essay") {
        setMsg(`Wrote “${data.item?.title || "Den take"}”.`);
      } else if (label === "backfill") {
        setMsg(data.filled ? `Wrote takes for ${data.filled} empty cards.` : "Every card already has a take.");
      } else {
        setMsg("Done.");
      }
    } catch (e: any) {
      setMsg(e.message || `${label} failed`);
    } finally {
      setBusy("");
    }
  };

  const visible = useMemo(() => {
    if (vault === "all") return items;
    return items.filter((i) => (i.shelf || "current") === vault);
  }, [items, vault]);

  const patch = (id: string, next: Partial<GamingItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...next } : i)));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5 space-y-4">
        <p className="text-xs uppercase tracking-wide text-neutral-500">Automation</p>
        <p className="text-sm text-neutral-300 leading-relaxed">
          Every day at 15:00 UTC the site pulls five random games mixed across just-out, coming soon,
          and classics. RAWG supplies facts and JPEG covers when they exist. Grok only paints a still
          if RAWG has no art, or if the piece is a Den take / news note. Generated stills save onto
          the card automatically.
        </p>
        <label className="block space-y-1">
          <span className="text-xs text-neutral-500">RAWG API key {hasKey ? "· saved" : "· missing"}</span>
          <input
            type="text"
            value={config.rawg_api_key}
            onChange={(e) => setConfig({ ...config, rawg_api_key: e.target.value })}
            onBlur={() => persistConfig(config)}
            placeholder="Paste key from rawg.io/apidocs"
            className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200"
          />
        </label>
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm text-neutral-300">Auto-add games daily</span>
          <input
            type="checkbox"
            checked={!!config.auto_pull_enabled}
            onChange={(e) => persistConfig({ ...config, auto_pull_enabled: e.target.checked })}
            className="w-4 h-4 accent-red-600"
          />
        </label>
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm text-neutral-300">Auto Den takes</span>
          <input
            type="checkbox"
            checked={!!config.auto_essay_enabled}
            onChange={(e) => persistConfig({ ...config, auto_essay_enabled: e.target.checked })}
            className="w-4 h-4 accent-red-600"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-neutral-500">Games per day</span>
          <input
            type="number"
            min={3}
            max={8}
            value={config.auto_pull_per_day || 5}
            onChange={(e) =>
              persistConfig({ ...config, auto_pull_per_day: Number(e.target.value) || 5 })
            }
            className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200"
          />
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            disabled={!!busy}
            onClick={() => run("/api/admin/gaming/pull", "pull", { count: config.auto_pull_per_day || 5 })}
            className="py-2.5 rounded-xl text-sm border border-neutral-700 text-neutral-200 hover:bg-neutral-900 disabled:opacity-40"
          >
            {busy === "pull" ? "Pulling…" : "Pull today now"}
          </button>
          <button
            type="button"
            disabled={!!busy}
            onClick={() => run("/api/admin/gaming/backfill", "backfill")}
            className="py-2.5 rounded-xl text-sm border border-violet-800/60 text-violet-200 hover:bg-violet-950/30 disabled:opacity-40"
          >
            {busy === "backfill" ? "Writing…" : "Fill empty takes"}
          </button>
          <button
            type="button"
            disabled={!!busy}
            onClick={() => run("/api/admin/gaming/fill-covers", "covers")}
            className="py-2.5 rounded-xl text-sm border border-neutral-800 text-neutral-400 hover:text-neutral-200 disabled:opacity-40"
          >
            {busy === "covers" ? "Mirroring…" : "Fix covers"}
          </button>
        </div>
        {config.auto_last_date ? (
          <p className="text-[11px] text-neutral-600">Last auto pull {config.auto_last_date}</p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5 space-y-4">
        <p className="text-xs uppercase tracking-wide text-neutral-500">Search the pool</p>
        <p className="text-[12px] text-neutral-500">
          Find a game on RAWG, drop it on a shelf, and Grok writes the short take from the ratings.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Search a title…"
            className="flex-1 px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200"
          />
          <select
            value={eraPick}
            onChange={(e) => setEraPick(e.target.value as PullEra | "auto")}
            className="px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200"
          >
            <option value="auto">Shelf from release date</option>
            <option value="current">Just out</option>
            <option value="coming">Coming soon</option>
            <option value="classic">Older / classic</option>
          </select>
          <button
            type="button"
            onClick={search}
            disabled={!!busy}
            className="px-4 py-2 rounded-xl text-sm border border-neutral-700 text-neutral-200 disabled:opacity-40"
          >
            {busy === "search" ? "Searching…" : "Search"}
          </button>
        </div>
        {hits.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {hits.map((hit) => (
              <button
                key={hit.id}
                type="button"
                onClick={() => addGame(hit)}
                disabled={!!busy}
                className="flex items-center gap-3 text-left rounded-xl border border-neutral-800 bg-[#0a0a0a] p-2 hover:border-violet-800/60 disabled:opacity-40"
              >
                {hit.background_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/gaming/cover?u=${encodeURIComponent(hit.background_image)}`} alt="" className="h-14 w-14 rounded-lg object-cover" />
                ) : (
                  <div className="h-14 w-14 rounded-lg bg-neutral-900" />
                )}
                <span className="min-w-0">
                  <span className="block text-sm text-neutral-100 truncate">{hit.name}</span>
                  <span className="block text-[11px] text-neutral-500">
                    {hit.released || "TBA"}
                    {busy === `add-${hit.id}` ? " · writing…" : ""}
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5 space-y-3">
        <p className="text-xs uppercase tracking-wide text-neutral-500">Den take</p>
        <select
          value={essayTopic}
          onChange={(e) => setEssayTopic(e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200"
        >
          {ESSAY_TOPICS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!!busy}
          onClick={() => run("/api/admin/gaming/essay", "essay", { topic: essayTopic })}
          className="w-full py-2.5 rounded-xl text-sm border border-fuchsia-900/50 text-fuchsia-200 hover:bg-fuchsia-950/20 disabled:opacity-40"
        >
          {busy === "essay" ? "Writing…" : "Write this take"}
        </button>
      </div>

      {msg ? <p className="text-sm text-neutral-300">{msg}</p> : null}

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {SHELVES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setVault(s.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs ${
              vault === s.id
                ? "border border-violet-500/40 text-violet-100 bg-violet-950/40"
                : "border border-neutral-800 text-neutral-500"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {visible.map((item) => (
        <div key={item.id} className="rounded-2xl border border-neutral-800/80 bg-[#111] p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              {item.shelf || item.kind}
            </p>
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-neutral-500 flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={item.published !== false}
                  onChange={(e) => patch(item.id, { published: e.target.checked })}
                />
                live
              </label>
              <button
                type="button"
                onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}
                className="text-[11px] text-rose-400/80"
              >
                Remove
              </button>
            </div>
          </div>
          <input
            value={item.title}
            onChange={(e) => patch(item.id, { title: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200"
          />
          <textarea
            value={item.note}
            onChange={(e) => patch(item.id, { note: e.target.value })}
            rows={2}
            placeholder="Card snippet"
            className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200"
          />
          <textarea
            value={item.body || ""}
            onChange={(e) => patch(item.id, { body: e.target.value })}
            rows={5}
            placeholder="Short article body — this is what the click opens"
            className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200"
          />
          <GamingCoverField
            item={item}
            onCover={(cover) => patch(item.id, { cover })}
            onItems={(next) => setItems(next)}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={() => saveItems(items)}
        disabled={!!busy}
        className="w-full py-3 rounded-xl bg-gradient-to-b from-red-700 via-red-800 to-purple-900 text-white text-sm font-medium disabled:opacity-50"
      >
        {busy === "save" ? "Saving…" : "Save gaming"}
      </button>
    </div>
  );
}
