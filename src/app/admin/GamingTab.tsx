"use client";

import { useEffect, useRef, useState } from "react";
import {
  DEFAULT_GAMING_CONFIG,
  SEED_GAMING_ITEMS,
  slugify,
  type GamingConfig,
  type GamingItem,
  type GamingKind,
  type GamingStatus,
} from "@/lib/gaming-data";

const KINDS: GamingKind[] = [
  "article",
  "playing",
  "radar",
  "drama",
  "season",
  "watchlist",
  "library",
];

const STATUSES: GamingStatus[] = [
  "playing",
  "hype",
  "dropped",
  "avoid",
  "season",
  "watch",
  "library",
];

const TONES = [
  { id: "den", label: "Den (honest)" },
  { id: "positive", label: "Positive" },
  { id: "critical", label: "Critical" },
  { id: "balanced", label: "Balanced" },
  { id: "hype", label: "Hype" },
] as const;

type ToneId = (typeof TONES)[number]["id"];

function emptyItem(): GamingItem {
  return {
    id: `item-${Date.now()}`,
    kind: "article",
    title: "New piece",
    slug: `new-piece-${Date.now().toString().slice(-4)}`,
    note: "",
    body: "",
    status: "hype",
    meta: "Den take",
    cover: "",
    url: "",
    featured: false,
    sort: 50,
    published: true,
  };
}

export function GamingTab() {
  const [config, setConfig] = useState<GamingConfig>(DEFAULT_GAMING_CONFIG);
  const [items, setItems] = useState<GamingItem[]>(SEED_GAMING_ITEMS);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<
    {
      id: number;
      name: string;
      released?: string;
      background_image?: string;
      url?: string;
      slug?: string;
    }[]
  >([]);
  const [searching, setSearching] = useState(false);
  const [draftingId, setDraftingId] = useState<string | null>(null);
  const [tones, setTones] = useState<Record<string, ToneId>>({});
  const [pulses, setPulses] = useState<Record<string, string>>({});
  const [pulseLoading, setPulseLoading] = useState<string | null>(null);
  const listEndRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const res = await fetch("/api/admin/gaming");
    if (res.ok) {
      const data = await res.json();
      setConfig({ ...DEFAULT_GAMING_CONFIG, ...(data.config || {}) });
      setItems(Array.isArray(data.items) ? data.items : SEED_GAMING_ITEMS);
    }
    setLoaded(true);
    setDirty(false);
  };

  useEffect(() => {
    load();
  }, []);

  const markDirty = () => setDirty(true);

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const normalized = items.map((i) => ({
        ...i,
        slug: i.slug || slugify(i.title),
        title: i.title || "Untitled",
      }));
      const res = await fetch("/api/admin/gaming", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config, items: normalized }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.hint || "Save failed");
      setMsg("Gaming settings saved. Public page will pick this up on refresh.");
      setDirty(false);
      if (data.config) setConfig({ ...DEFAULT_GAMING_CONFIG, ...data.config });
      if (Array.isArray(data.items)) setItems(data.items);
    } catch (err: any) {
      setMsg(err.message || "Could not save.");
    } finally {
      setBusy(false);
    }
  };

  const updateItem = (id: string, patch: Partial<GamingItem>) => {
    markDirty();
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const removeItem = (id: string) => {
    if (!confirm("Remove this card?")) return;
    markDirty();
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const addCard = () => {
    markDirty();
    setItems((prev) => [...prev, emptyItem()]);
    setMsg("New card added at the bottom — fill it in, then hit Save gaming.");
    setTimeout(() => listEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const searchRawg = async () => {
    if (searchQ.trim().length < 2) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch(
        `/api/admin/gaming/search?q=${encodeURIComponent(searchQ.trim())}`
      );
      const data = await res.json();
      if (data.error && (!data.results || data.results.length === 0)) {
        setMsg(data.error);
      }
      setSearchResults(data.results || []);
    } catch {
      setMsg("Search failed");
    } finally {
      setSearching(false);
    }
  };

  const importGame = (g: {
    name: string;
    released?: string;
    background_image?: string;
    url?: string | null;
    slug?: string;
  }) => {
    markDirty();
    const item: GamingItem = {
      id: `rawg-${Date.now()}`,
      kind: "article",
      title: g.name,
      slug: slugify(g.name),
      note: "",
      body: "",
      status: "hype",
      meta: g.released ? `Released ${g.released}` : "RAWG import",
      cover: g.background_image || "",
      url: g.url || "",
      featured: false,
      sort: 40,
      published: true,
    };
    setItems((prev) => [...prev, item]);
    setMsg(`Imported “${g.name}”. Fetch pulse + pick tone, then draft.`);
    setTimeout(() => listEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const fetchPulse = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item?.title) {
      setMsg("Add a title first.");
      return;
    }
    setPulseLoading(id);
    setMsg(null);
    try {
      const res = await fetch(
        `/api/admin/gaming/pulse?q=${encodeURIComponent(item.title)}`
      );
      const data = await res.json();
      if (data.error && !data.pulse) throw new Error(data.error);
      setPulses((p) => ({ ...p, [id]: data.pulse || "" }));
      if (data.game?.background_image && !item.cover) {
        updateItem(id, { cover: data.game.background_image });
      }
      if (data.game?.url && !item.url) {
        updateItem(id, { url: data.game.url });
      }
      setMsg(data.pulse ? "Pulse loaded. Draft when ready." : "No pulse data found.");
    } catch (err: any) {
      setMsg(err.message || "Pulse failed");
    } finally {
      setPulseLoading(null);
    }
  };

  const draftWithGrok = async (
    id: string,
    mode: "note" | "article" | "rewrite"
  ) => {
    const item = items.find((i) => i.id === id);
    if (!item?.title) {
      setMsg("Add a title first.");
      return;
    }
    if (mode === "rewrite" && !item.body && !item.note) {
      setMsg("Nothing to rewrite yet.");
      return;
    }
    setDraftingId(id);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/gaming/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.title,
          hint: item.meta || "",
          pulse: pulses[id] || "",
          tone: tones[id] || "den",
          mode,
          existing: mode === "rewrite" ? item.body || item.note : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Draft failed");
      markDirty();
      if (mode === "note") {
        updateItem(id, { note: data.note || item.note });
      } else {
        updateItem(id, {
          note: data.note || item.note,
          body: data.body || item.body,
        });
      }
      const toneLabel = TONES.find((t) => t.id === (tones[id] || "den"))?.label;
      setMsg(
        mode === "rewrite"
          ? `Rewrote in ${toneLabel}. Review and Save.`
          : mode === "article"
            ? `Article drafted (${toneLabel}). Review and Save.`
            : `Note drafted (${toneLabel}). Review and Save.`
      );
    } catch (err: any) {
      setMsg(err.message || "Grok draft failed");
    } finally {
      setDraftingId(null);
    }
  };

  if (!loaded) {
    return <p className="text-sm text-neutral-500">Loading gaming…</p>;
  }

  const msgOk =
    msg &&
    (msg.toLowerCase().includes("saved") ||
      msg.toLowerCase().includes("imported") ||
      msg.toLowerCase().includes("drafted") ||
      msg.toLowerCase().includes("added") ||
      msg.toLowerCase().includes("pulse") ||
      msg.toLowerCase().includes("rewrote"));

  return (
    <div className="space-y-6">
      {msg && (
        <div
          className={`px-3 py-2.5 rounded-lg text-sm border ${
            msgOk
              ? "bg-green-950/30 border-green-900/40 text-green-400"
              : "bg-red-950/40 border-red-900/50 text-red-300"
          }`}
        >
          {msg}
        </div>
      )}

      {dirty && (
        <div className="px-3 py-2 rounded-lg text-xs border border-amber-900/40 bg-amber-950/20 text-amber-300">
          Unsaved changes — click <strong>Save gaming</strong> at the bottom.
        </div>
      )}

      <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5 space-y-4">
        <p className="text-xs uppercase tracking-wide text-neutral-500">Page copy</p>
        <label className="block space-y-1">
          <span className="text-xs text-neutral-500">Hero line</span>
          <input
            type="text"
            value={config.hero_line}
            onChange={(e) => {
              markDirty();
              setConfig((c) => ({ ...c, hero_line: e.target.value }));
            }}
            className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200 focus:outline-none focus:border-neutral-600"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-neutral-500">Currently line</span>
          <input
            type="text"
            value={config.currently_line}
            onChange={(e) => {
              markDirty();
              setConfig((c) => ({ ...c, currently_line: e.target.value }));
            }}
            className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200 focus:outline-none focus:border-neutral-600"
          />
        </label>
      </div>

      <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5 space-y-4">
        <p className="text-xs uppercase tracking-wide text-neutral-500">RAWG</p>
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm text-neutral-300">Enable radar</span>
          <input
            type="checkbox"
            checked={config.radar_enabled}
            onChange={(e) => {
              markDirty();
              setConfig((c) => ({ ...c, radar_enabled: e.target.checked }));
            }}
            className="w-4 h-4 accent-red-600"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-neutral-500">RAWG API key</span>
          <input
            type="password"
            value={config.rawg_api_key}
            onChange={(e) => {
              markDirty();
              setConfig((c) => ({ ...c, rawg_api_key: e.target.value }));
            }}
            placeholder="Paste key"
            className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200 focus:outline-none focus:border-neutral-600 font-mono"
          />
        </label>

        <div className="pt-2 border-t border-neutral-900 space-y-2">
          <p className="text-xs text-neutral-500">Import game (title, cover, link)</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchRawg()}
              placeholder="Search RAWG…"
              className="flex-1 px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200 focus:outline-none focus:border-neutral-600"
            />
            <button
              type="button"
              onClick={searchRawg}
              disabled={searching}
              className="px-3 py-2 rounded-xl text-xs border border-neutral-700 text-neutral-200 hover:bg-neutral-900 disabled:opacity-40"
            >
              {searching ? "…" : "Search"}
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {searchResults.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => importGame(g)}
                  className="w-full text-left px-3 py-2 rounded-lg border border-neutral-800 hover:border-neutral-600 text-sm text-neutral-300 flex gap-3 items-center"
                >
                  {g.background_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={g.background_image}
                      alt=""
                      className="w-12 h-8 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-8 rounded bg-neutral-900" />
                  )}
                  <span className="min-w-0 truncate">
                    {g.name}
                    {g.released ? (
                      <span className="text-neutral-600"> · {g.released}</span>
                    ) : null}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            Cards ({items.length})
          </p>
          <button
            type="button"
            onClick={addCard}
            className="px-3 py-1.5 rounded-lg text-xs border border-neutral-700 text-neutral-200 hover:bg-neutral-900"
          >
            Add card
          </button>
        </div>

        <p className="text-[11px] text-neutral-600 leading-relaxed">
          Den tone = honest, not forced-negative. Use pulse so drafts respect what players are actually saying.
        </p>

        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-neutral-800/80 bg-[#111] p-4 space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={item.title}
                onChange={(e) => {
                  const title = e.target.value;
                  updateItem(item.id, {
                    title,
                    slug: item.slug || slugify(title),
                  });
                }}
                placeholder="Title"
                className="px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200 focus:outline-none focus:border-neutral-600"
              />
              <input
                type="text"
                value={item.slug || ""}
                onChange={(e) => updateItem(item.id, { slug: e.target.value })}
                placeholder="url-slug"
                className="px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200 font-mono focus:outline-none focus:border-neutral-600"
              />
            </div>
            <input
              type="text"
              value={item.meta || ""}
              onChange={(e) => updateItem(item.id, { meta: e.target.value })}
              placeholder="Meta (season, date…)"
              className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200 focus:outline-none focus:border-neutral-600"
            />

            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-neutral-500">Community pulse</span>
                <button
                  type="button"
                  onClick={() => fetchPulse(item.id)}
                  disabled={pulseLoading === item.id}
                  className="text-[11px] text-neutral-400 hover:text-neutral-200 disabled:opacity-40"
                >
                  {pulseLoading === item.id ? "Fetching…" : "Fetch from RAWG"}
                </button>
              </div>
              <textarea
                value={pulses[item.id] || ""}
                onChange={(e) =>
                  setPulses((p) => ({ ...p, [item.id]: e.target.value }))
                }
                rows={3}
                placeholder="Ratings, majority take, or paste what people are saying…"
                className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-xs text-neutral-300 focus:outline-none focus:border-neutral-600 resize-y"
              />
            </div>

            <textarea
              value={item.note}
              onChange={(e) => updateItem(item.id, { note: e.target.value })}
              rows={2}
              placeholder="Short note (card blurb)"
              className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200 focus:outline-none focus:border-neutral-600 resize-none"
            />
            <textarea
              value={item.body || ""}
              onChange={(e) => updateItem(item.id, { body: e.target.value })}
              rows={4}
              placeholder="Full article body (paragraphs separated by blank lines)"
              className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200 focus:outline-none focus:border-neutral-600 resize-y"
            />

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={tones[item.id] || "den"}
                onChange={(e) =>
                  setTones((t) => ({
                    ...t,
                    [item.id]: e.target.value as ToneId,
                  }))
                }
                className="px-2 py-1.5 rounded-lg bg-[#0a0a0a] border border-neutral-800 text-[11px] text-neutral-300"
              >
                {TONES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={draftingId === item.id}
                onClick={() => draftWithGrok(item.id, "note")}
                className="px-2.5 py-1.5 rounded-lg text-[11px] border border-neutral-700 text-neutral-300 hover:text-white disabled:opacity-40"
              >
                {draftingId === item.id ? "…" : "Grok note"}
              </button>
              <button
                type="button"
                disabled={draftingId === item.id}
                onClick={() => draftWithGrok(item.id, "article")}
                className="px-2.5 py-1.5 rounded-lg text-[11px] border border-purple-900/50 text-purple-300 hover:text-purple-200 disabled:opacity-40"
              >
                Grok article
              </button>
              <button
                type="button"
                disabled={draftingId === item.id}
                onClick={() => draftWithGrok(item.id, "rewrite")}
                className="px-2.5 py-1.5 rounded-lg text-[11px] border border-neutral-700 text-neutral-400 hover:text-neutral-200 disabled:opacity-40"
              >
                Rewrite tone
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <select
                value={item.kind}
                onChange={(e) =>
                  updateItem(item.id, { kind: e.target.value as GamingKind })
                }
                className="px-2 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-xs text-neutral-300"
              >
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              <select
                value={item.status}
                onChange={(e) =>
                  updateItem(item.id, { status: e.target.value as GamingStatus })
                }
                className="px-2 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-xs text-neutral-300"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={item.sort}
                onChange={(e) =>
                  updateItem(item.id, { sort: Number(e.target.value) || 0 })
                }
                className="px-2 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-xs text-neutral-300"
                title="Sort"
              />
              <label className="flex items-center gap-2 text-xs text-neutral-400 px-1">
                <input
                  type="checkbox"
                  checked={item.published !== false}
                  onChange={(e) =>
                    updateItem(item.id, { published: e.target.checked })
                  }
                  className="accent-red-600"
                />
                Published
              </label>
            </div>
            <label className="flex items-center gap-2 text-xs text-neutral-400">
              <input
                type="checkbox"
                checked={!!item.featured}
                onChange={(e) =>
                  updateItem(item.id, { featured: e.target.checked })
                }
                className="accent-purple-600"
              />
              Feature on Gaming home
            </label>
            <input
              type="url"
              value={item.cover || ""}
              onChange={(e) => updateItem(item.id, { cover: e.target.value })}
              placeholder="Cover image URL"
              className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-xs text-neutral-300 focus:outline-none focus:border-neutral-600"
            />
            <input
              type="url"
              value={item.url || ""}
              onChange={(e) => updateItem(item.id, { url: e.target.value })}
              placeholder="External link (Steam, RAWG…)"
              className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-xs text-neutral-300 focus:outline-none focus:border-neutral-600"
            />
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="text-xs text-red-400/90 hover:text-red-300"
            >
              Remove
            </button>
          </div>
        ))}
        <div ref={listEndRef} />
      </div>

      <button
        type="button"
        onClick={save}
        disabled={busy}
        className="w-full py-3 rounded-xl bg-gradient-to-b from-red-700 via-red-800 to-purple-900 text-white text-sm font-medium disabled:opacity-50"
      >
        {busy ? "Saving…" : dirty ? "Save gaming (unsaved changes)" : "Save gaming"}
      </button>
    </div>
  );
}
