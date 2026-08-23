"use client";

import { useEffect, useMemo, useState } from "react";
import { affiliateUrl, LOOT_SECTIONS, slugify, type LootPick } from "@/lib/loot-data";

const blank: LootPick = {
  id: "",
  section: "desk",
  name: "",
  snippet: "",
  body: "",
  search_query: "",
  asin: "",
  dest_url: "",
  tag_override: "",
  status: "In the Den",
  active: true,
  sort_order: 0,
};

export function LootTab() {
  const [picks, setPicks] = useState<LootPick[]>([]);
  const [tag, setTag] = useState("thievnsden-20");
  const [showCodes, setShowCodes] = useState(false);
  const [draft, setDraft] = useState<LootPick>({ ...blank });
  const [hint, setHint] = useState("");
  const [tone, setTone] = useState("dry");
  const [extra, setExtra] = useState("");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [fillSection, setFillSection] = useState("desk");
  const [fillHint, setFillHint] = useState("");
  const [fillCount, setFillCount] = useState(5);
  const [ideas, setIdeas] = useState<LootPick[]>([]);

  const load = async () => {
    const res = await fetch("/api/admin/loot");
    const data = await res.json();
    const rows: LootPick[] = data.picks?.length ? data.picks : data.seeded || [];
    const covers = data.covers || {};
    setPicks(
      rows.map((p) => ({
        ...p,
        image_url: p.image_url || covers[p.id]?.image_url,
      }))
    );
    if (data.settings?.default_tag) setTag(data.settings.default_tag);
  };

  useEffect(() => {
    load();
  }, []);

  const groups = useMemo(() => {
    const map: Record<string, LootPick[]> = {};
    picks.forEach((p) => {
      (map[p.section] ||= []).push(p);
    });
    return map;
  }, [picks]);

  const post = async (payload: any) => {
    const res = await fetch("/api/admin/loot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed");
    return data;
  };

  const field = "w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200";

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-amber-900/30 bg-[#111] p-5 space-y-3">
        <p className="text-sm text-neutral-100 font-medium">Loot desk</p>
        <p className="text-xs text-neutral-500">
          Grok does not scrape live Amazon. It writes search pages so Check it out opens a whole results list with your tag hidden.
        </p>
        <label className="flex items-center gap-2 text-sm text-neutral-300">
          <input type="checkbox" checked={showCodes} onChange={(e) => setShowCodes(e.target.checked)} />
          Show affiliate codes
        </label>
        {showCodes && (
          <div className="space-y-2">
            <input value={tag} onChange={(e) => setTag(e.target.value)} className={field} />
            <button
              type="button"
              onClick={async () => {
                setBusy("tag");
                try {
                  await post({ action: "settings", default_tag: tag });
                  setMsg("Tag saved");
                } catch (err: any) {
                  setMsg(err.message);
                } finally {
                  setBusy("");
                }
              }}
              className="px-3 py-2 rounded-lg text-xs border border-neutral-700"
            >
              Save default tag
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={async () => {
            setBusy("seed");
            try {
              const d = await post({ action: "seed" });
              setMsg(`Seeded ${d.seeded}`);
              await load();
            } catch (err: any) {
              setMsg(err.message);
            } finally {
              setBusy("");
            }
          }}
          className="px-3 py-2 rounded-lg text-xs border border-neutral-700"
        >
          Seed current six picks
        </button>
        {msg && <p className="text-xs text-amber-200">{msg}</p>}
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-3">
        <p className="text-xs uppercase tracking-wide text-neutral-500">Fill a section</p>
        <div className="grid sm:grid-cols-3 gap-2">
          <select value={fillSection} onChange={(e) => setFillSection(e.target.value)} className={field}>
            {LOOT_SECTIONS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          <input value={fillHint} onChange={(e) => setFillHint(e.target.value)} className={field} placeholder="optional vibe — late night desk, no RGB" />
          <select value={fillCount} onChange={(e) => setFillCount(Number(e.target.value))} className={field}>
            {[3, 4, 5, 6, 8].map((n) => (
              <option key={n} value={n}>{n} cards</option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!!busy}
            onClick={async () => {
              setBusy("research");
              try {
                const d = await post({
                  action: "research",
                  section: fillSection,
                  hint: fillHint,
                  count: fillCount,
                  avoid: picks.map((p) => p.name),
                });
                setIdeas(d.picks || []);
                setMsg(`${(d.picks || []).length} ideas — save the keepers`);
              } catch (err: any) {
                setMsg(err.message);
              } finally {
                setBusy("");
              }
            }}
            className="px-3 py-2 rounded-lg text-xs border border-neutral-700 disabled:opacity-40"
          >
            {busy === "research" ? "Researching…" : "Research only"}
          </button>
          <button
            type="button"
            disabled={!!busy}
            onClick={async () => {
              setBusy("fill");
              try {
                const d = await post({
                  action: "fill",
                  section: fillSection,
                  hint: fillHint,
                  count: fillCount,
                  avoid: picks.map((p) => p.name),
                });
                setIdeas([]);
                setMsg(`Saved ${d.picks?.length || 0} cards`);
                await load();
              } catch (err: any) {
                setMsg(err.message);
              } finally {
                setBusy("");
              }
            }}
            className="px-3 py-2 rounded-lg text-xs border border-amber-800/50 text-amber-100 disabled:opacity-40"
          >
            {busy === "fill" ? "Filling…" : "Fill and save"}
          </button>
        </div>
        {ideas.length > 0 && (
          <div className="space-y-2">
            {ideas.map((p) => (
              <div key={p.id} className="rounded-xl border border-neutral-800 p-3 space-y-1">
                <p className="text-sm text-neutral-100">{p.name}</p>
                <p className="text-xs text-neutral-500">{p.snippet}</p>
                <p className="text-[10px] text-neutral-600">Search: {p.search_query}</p>
                <button
                  type="button"
                  onClick={async () => {
                    await post({ action: "save", pick: p });
                    setIdeas((list) => list.filter((x) => x.id !== p.id));
                    await load();
                  }}
                  className="text-[11px] text-amber-200"
                >
                  Save this one
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-3">
        <p className="text-xs uppercase tracking-wide text-neutral-500">New / edit pick</p>
        <div className="grid sm:grid-cols-2 gap-2">
          <select value={draft.section} onChange={(e) => setDraft({ ...draft, section: e.target.value })} className={field}>
            {LOOT_SECTIONS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          <input value={hint} onChange={(e) => setHint(e.target.value)} className={field} placeholder="What it is — 60% board, black, no RGB" />
        </div>
        <div className="grid sm:grid-cols-3 gap-2">
          <input value={draft.search_query || ""} onChange={(e) => setDraft({ ...draft, search_query: e.target.value })} className={field} placeholder="Amazon search" />
          <input value={draft.asin || ""} onChange={(e) => setDraft({ ...draft, asin: e.target.value })} className={field} placeholder="ASIN only if you want one SKU" />
          <select value={tone} onChange={(e) => setTone(e.target.value)} className={field}>
            <option value="dry">dry</option>
            <option value="petty">petty</option>
            <option value="useful">useful</option>
          </select>
        </div>
        {showCodes && (
          <input value={draft.tag_override || ""} onChange={(e) => setDraft({ ...draft, tag_override: e.target.value })} className={field} placeholder="Tag override for this card only" />
        )}
        <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={field} placeholder="Title" />
        <input value={draft.snippet} onChange={(e) => setDraft({ ...draft, snippet: e.target.value })} className={field} placeholder="Snippet" />
        <textarea value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} rows={4} className={field} placeholder="Two short paragraphs" />
        <input value={extra} onChange={(e) => setExtra(e.target.value)} className={field} placeholder="Photo extra — matte black, RGB off" />
        {draft.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={draft.image_url} alt="" className="w-full max-w-sm aspect-[4/3] object-cover rounded-xl border border-neutral-800" />
        )}
        <div className="flex flex-wrap gap-2">
          {[
            ["title", "Write title"],
            ["snippet", "Write snippet"],
            ["body", "Write note"],
            ["all", "Write all copy"],
          ].map(([fieldName, label]) => (
            <button
              key={fieldName}
              type="button"
              disabled={!!busy}
              onClick={async () => {
                setBusy(fieldName);
                try {
                  const d = await post({
                    action: "copy",
                    field: fieldName,
                    hint: hint || draft.name,
                    section: draft.section,
                    tone,
                  });
                  setDraft((p) => ({
                    ...p,
                    name: d.name || p.name,
                    snippet: d.snippet || p.snippet,
                    body: d.body || p.body,
                    id: p.id || slugify(d.name || p.name || hint),
                  }));
                  setMsg("Copy ready");
                } catch (err: any) {
                  setMsg(err.message);
                } finally {
                  setBusy("");
                }
              }}
              className="px-3 py-2 rounded-lg text-xs border border-neutral-700 disabled:opacity-40"
            >
              {busy === fieldName ? "…" : label}
            </button>
          ))}
          <button
            type="button"
            disabled={!!busy || !draft.name}
            onClick={async () => {
              setBusy("photo");
              try {
                const id = draft.id || slugify(draft.name);
                const d = await post({
                  action: "photo",
                  id,
                  name: draft.name,
                  section: draft.section,
                  search_query: draft.search_query || hint,
                  snippet: draft.snippet,
                  body: draft.body,
                  extra,
                });
                setDraft((p) => ({ ...p, id, image_url: d.image_url }));
                setMsg("Photo saved");
                await load();
              } catch (err: any) {
                setMsg(err.message);
              } finally {
                setBusy("");
              }
            }}
            className="px-3 py-2 rounded-lg text-xs border border-amber-800/50 text-amber-200 disabled:opacity-40"
          >
            {busy === "photo" ? "Shooting…" : "Generate photo"}
          </button>
          <button
            type="button"
            disabled={!!busy || !draft.name}
            onClick={async () => {
              setBusy("save");
              try {
                const d = await post({ action: "save", pick: { ...draft, id: draft.id || slugify(draft.name) } });
                setDraft({ ...blank });
                setHint("");
                setMsg(`Saved ${d.pick.id}`);
                await load();
              } catch (err: any) {
                setMsg(err.message);
              } finally {
                setBusy("");
              }
            }}
            className="px-3 py-2 rounded-lg text-xs bg-amber-200 text-black disabled:opacity-40"
          >
            Save card
          </button>
        </div>
      </div>

      {LOOT_SECTIONS.map((sec) => (
        <section key={sec.id} className="space-y-3">
          <h2 className="text-xs uppercase tracking-wide text-neutral-500">{sec.label}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {(groups[sec.id] || []).map((p) => (
              <div key={p.id} className="rounded-2xl border border-neutral-800 bg-[#111] overflow-hidden">
                <div className="aspect-[4/3] bg-black">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="h-full flex items-center justify-center text-[11px] text-neutral-600">No cover</div>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  <p className="text-sm text-neutral-100">{p.name}</p>
                  <p className="text-xs text-neutral-500">{p.snippet}</p>
                  {showCodes && (
                    <p className="text-[10px] font-mono text-amber-200/80 break-all">{affiliateUrl(p, tag)}</p>
                  )}
                  <div className="flex gap-2 text-[11px]">
                    <button type="button" onClick={() => { setDraft(p); setHint(p.search_query || p.name); }} className="text-neutral-300">Edit</button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm("Delete?")) return;
                        await post({ action: "delete", id: p.id });
                        await load();
                      }}
                      className="text-red-400"
                    >Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
