"use client";

import { useEffect, useMemo, useState } from "react";
import {
  affiliateUrl,
  LOOT_SECTIONS,
  PHOTO_SCENES,
  slugify,
  type LootPick,
} from "@/lib/loot-data";

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

const field =
  "w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200";

export function LootTab() {
  const [picks, setPicks] = useState<LootPick[]>([]);
  const [tag, setTag] = useState("thievnsden-20");
  const [showCodes, setShowCodes] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, LootPick>>({});
  const [creating, setCreating] = useState(false);
  const [newPick, setNewPick] = useState<LootPick>({ ...blank });
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [fillSection, setFillSection] = useState("desk");
  const [fillHint, setFillHint] = useState("");
  const [fillCount, setFillCount] = useState(4);
  const [vault, setVault] = useState("all");
  const [ideas, setIdeas] = useState<LootPick[]>([]);
  const [scene, setScene] = useState("auto");
  const [photoExtra, setPhotoExtra] = useState("");
  const [fillOpen, setFillOpen] = useState(false);

  const load = async () => {
    const res = await fetch("/api/admin/loot");
    const data = await res.json();
    const rows: LootPick[] = data.picks?.length ? data.picks : data.seeded || [];
    const covers = data.covers || {};
    setPicks(rows.map((p) => ({ ...p, image_url: p.image_url || covers[p.id]?.image_url })));
    if (data.settings?.default_tag) setTag(data.settings.default_tag);
  };

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(() => {
    if (vault === "all") return picks;
    return picks.filter((p) => p.section === vault);
  }, [picks, vault]);

  const grouped = useMemo(
    () =>
      LOOT_SECTIONS.map((s) => ({
        ...s,
        items: visible.filter((p) => p.section === s.id),
      })).filter((g) => g.items.length || vault === g.id),
    [visible, vault]
  );

  const selected = creating ? newPick : selectedId ? drafts[selectedId] || picks.find((p) => p.id === selectedId) || null : null;

  const post = async (payload: unknown) => {
    const res = await fetch("/api/admin/loot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed");
    return data;
  };

  const setSelected = (pick: LootPick) => {
    setCreating(false);
    setSelectedId(pick.id);
    setDrafts((m) => ({ ...m, [pick.id]: m[pick.id] || pick }));
  };

  const workPick = async (pick: LootPick, kind: string) => {
    setBusy(kind === "photo" ? `photo-${pick.id || "new"}` : kind);
    setMsg("");
    try {
      if (kind === "save") {
        const d = await post({ action: "save", pick: { ...pick, id: pick.id || slugify(pick.name) } });
        setMsg(`Saved ${d.pick.id}`);
        setCreating(false);
        setNewPick({ ...blank });
        setSelectedId(d.pick.id);
        await load();
      }
      if (kind === "photo") {
        const id = pick.id || slugify(pick.name);
        const d = await post({
          action: "photo",
          id,
          name: pick.name,
          section: pick.section,
          search_query: pick.search_query,
          snippet: pick.snippet,
          body: pick.body,
          scene,
          extra: photoExtra,
        });
        const next = { ...pick, id, image_url: d.image_url };
        if (pick.id) setDrafts((m) => ({ ...m, [pick.id]: next }));
        else setNewPick(next);
        setMsg("Lookbook still saved");
        await load();
      }
      if (["title", "snippet", "body", "all"].includes(kind)) {
        const d = await post({
          action: "copy",
          field: kind,
          hint: pick.search_query || pick.name,
          name: pick.name,
          section: pick.section,
          search_query: pick.search_query,
        });
        const next = {
          ...pick,
          name: d.name || pick.name,
          snippet: d.snippet || pick.snippet,
          body: d.body || pick.body,
          id: pick.id || slugify(d.name || pick.name),
        };
        if (pick.id) setDrafts((m) => ({ ...m, [pick.id]: next }));
        else setNewPick(next);
        setMsg("Copy ready");
      }
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-amber-300/80 mb-1">Loot · studio</p>
          <h2 className="text-2xl font-semibold text-neutral-50">Lookbook shelf</h2>
          <p className="text-sm text-neutral-500 mt-2 max-w-xl">
            Fill a category, then click a card to rewrite or reshoot. Stills are editorial, not generic packshots.
            Shop links are Amazon searches with <span className="text-amber-200">thievnsden-20</span>.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setCreating(true);
              setSelectedId(null);
              setNewPick({ ...blank, section: vault === "all" ? "desk" : vault });
            }}
            className="px-3 py-2 rounded-xl text-xs border border-amber-800/50 text-amber-100"
          >
            New card
          </button>
          <button
            type="button"
            onClick={() => setFillOpen((v) => !v)}
            className="px-3 py-2 rounded-xl text-xs border border-neutral-700 text-neutral-200"
          >
            {fillOpen ? "Hide filler" : "Fill a shelf"}
          </button>
        </div>
      </div>

      {msg ? <p className="text-sm text-amber-200">{msg}</p> : null}

      {fillOpen ? (
        <div className="rounded-2xl border border-amber-900/30 bg-[#111] p-5 space-y-3">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Generate a list</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <select value={fillSection} onChange={(e) => setFillSection(e.target.value)} className={field}>
              {LOOT_SECTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <input value={fillHint} onChange={(e) => setFillHint(e.target.value)} className={field} placeholder="vibe / what to hunt" />
            <select value={fillCount} onChange={(e) => setFillCount(Number(e.target.value))} className={field}>
              {[3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} cards
                </option>
              ))}
            </select>
            <select value={scene} onChange={(e) => setScene(e.target.value)} className={field}>
              {PHOTO_SCENES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <input
            value={photoExtra}
            onChange={(e) => setPhotoExtra(e.target.value)}
            className={field}
            placeholder="Photo direction — lighting, material, angle"
          />
          <div className="grid sm:grid-cols-3 gap-2">
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
                  setMsg(`Drafted ${(d.picks || []).length} ideas`);
                } catch (e: unknown) {
                  setMsg(e instanceof Error ? e.message : "Failed");
                } finally {
                  setBusy("");
                }
              }}
              className="py-2.5 rounded-xl text-sm border border-neutral-700 disabled:opacity-40"
            >
              {busy === "research" ? "Drafting…" : "Draft list"}
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
                  setMsg(`Saved ${d.picks?.length || 0} articles`);
                  await load();
                } catch (e: unknown) {
                  setMsg(e instanceof Error ? e.message : "Failed");
                } finally {
                  setBusy("");
                }
              }}
              className="py-2.5 rounded-xl text-sm border border-neutral-700 disabled:opacity-40"
            >
              {busy === "fill" ? "Writing…" : "Write + save"}
            </button>
            <button
              type="button"
              disabled={!!busy}
              onClick={async () => {
                setBusy("fill_full");
                try {
                  const d = await post({
                    action: "fill_full",
                    section: fillSection,
                    hint: fillHint,
                    count: fillCount,
                    avoid: picks.map((p) => p.name),
                    scene,
                    extra: photoExtra,
                  });
                  setIdeas([]);
                  setMsg(`Saved ${d.picks?.length || 0} with stills`);
                  await load();
                } catch (e: unknown) {
                  setMsg(e instanceof Error ? e.message : "Failed");
                } finally {
                  setBusy("");
                }
              }}
              className="py-2.5 rounded-xl text-sm border border-amber-800/60 text-amber-100 disabled:opacity-40"
            >
              {busy === "fill_full" ? "Shooting list…" : "Write + shoot"}
            </button>
          </div>
          <button
            type="button"
            disabled={!!busy}
            onClick={async () => {
              setBusy("photos");
              try {
                const d = await post({ action: "photos_missing", section: vault === "all" ? fillSection : vault });
                setMsg(`Shot ${d.shot || 0} missing stills`);
                await load();
              } catch (e: unknown) {
                setMsg(e instanceof Error ? e.message : "Failed");
              } finally {
                setBusy("");
              }
            }}
            className="w-full py-2.5 rounded-xl text-sm border border-neutral-800 text-neutral-400 hover:text-neutral-200 disabled:opacity-40"
          >
            {busy === "photos" ? "Shooting missing…" : "Shoot missing stills in this category"}
          </button>
          <button
            type="button"
            disabled={!!busy}
            onClick={async () => {
              setBusy("refresh");
              try {
                const d = await post({
                  action: "photos_refresh",
                  section: vault === "all" ? fillSection : vault,
                  scene,
                  extra: photoExtra,
                });
                setMsg(`Reshot ${d.shot || 0} lookbook stills`);
                await load();
              } catch (e: unknown) {
                setMsg(e instanceof Error ? e.message : "Failed");
              } finally {
                setBusy("");
              }
            }}
            className="w-full py-2.5 rounded-xl text-sm border border-amber-900/40 text-amber-200/90 disabled:opacity-40"
          >
            {busy === "refresh" ? "Reshooting shelf…" : "Reshoot this shelf (new editorial stills)"}
          </button>
          {ideas.map((p) => (
            <div key={p.id} className="rounded-xl border border-neutral-800 p-3">
              <p className="text-sm text-neutral-100">{p.name}</p>
              <p className="text-xs text-neutral-500">{p.snippet}</p>
              <button
                type="button"
                className="text-[11px] text-amber-200 mt-1"
                onClick={async () => {
                  await post({ action: "save", pick: p });
                  setIdeas((x) => x.filter((i) => i.id !== p.id));
                  await load();
                }}
              >
                Save this one
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1 flex-1">
          {[{ id: "all", label: `All · ${picks.length}` }, ...LOOT_SECTIONS.map((s) => ({
            id: s.id,
            label: `${s.label} · ${picks.filter((p) => p.section === s.id).length}`,
          }))].map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setVault(s.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs ${
                vault === s.id
                  ? "border border-amber-500/40 text-amber-100 bg-amber-950/40"
                  : "border border-neutral-800 text-neutral-500"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-[11px] text-neutral-500 shrink-0">
          <input type="checkbox" checked={showCodes} onChange={(e) => setShowCodes(e.target.checked)} />
          Codes
        </label>
      </div>

      {showCodes ? (
        <div className="flex gap-2">
          <input value={tag} onChange={(e) => setTag(e.target.value)} className={field} />
          <button
            type="button"
            onClick={async () => {
              await post({ action: "settings", default_tag: tag });
              setMsg("Tag saved");
            }}
            className="px-3 py-2 rounded-xl text-xs border border-neutral-700"
          >
            Save tag
          </button>
        </div>
      ) : null}

      <div className="grid lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 space-y-8">
          {grouped.map((g) =>
            g.items.length || vault === g.id ? (
              <section key={g.id}>
                <div className="flex items-baseline justify-between mb-3">
                  <h3 className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">{g.label}</h3>
                  <p className="text-[11px] text-neutral-600">{g.blurb}</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {g.items.map((p) => {
                    const live = drafts[p.id] || p;
                    const on = selectedId === p.id && !creating;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelected(live)}
                        className={`text-left rounded-2xl overflow-hidden border bg-[#0d0d0d] ${
                          on ? "border-amber-400/60 ring-1 ring-amber-400/30" : "border-neutral-800 hover:border-neutral-600"
                        }`}
                      >
                        <div className="aspect-[4/3] bg-black">
                          {live.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={live.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="h-full grid place-items-center text-[10px] text-neutral-600">No still</div>
                          )}
                        </div>
                        <div className="p-2.5">
                          <p className="text-[12px] text-neutral-100 line-clamp-1">{live.name}</p>
                          <p className="text-[10px] text-neutral-500 line-clamp-1">{live.snippet}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : null
          )}
        </div>

        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-20 rounded-2xl border border-neutral-800 bg-[#111] overflow-hidden">
            {!selected ? (
              <p className="p-8 text-sm text-neutral-500">Select a card on the shelf, or make a new one.</p>
            ) : (
              <>
                <div className="aspect-[16/10] bg-black">
                  {selected.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selected.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="h-full grid place-items-center text-xs text-neutral-600">No still yet</div>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <div className="grid sm:grid-cols-2 gap-2">
                    <select
                      value={selected.section}
                      onChange={(e) => {
                        const next = { ...selected, section: e.target.value };
                        if (creating) setNewPick(next);
                        else if (selected.id) setDrafts((m) => ({ ...m, [selected.id]: next }));
                      }}
                      className={field}
                    >
                      {LOOT_SECTIONS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <input
                      value={selected.search_query || ""}
                      onChange={(e) => {
                        const next = { ...selected, search_query: e.target.value };
                        if (creating) setNewPick(next);
                        else if (selected.id) setDrafts((m) => ({ ...m, [selected.id]: next }));
                      }}
                      className={field}
                      placeholder="Amazon search keywords"
                    />
                  </div>
                  <input
                    value={selected.name}
                    onChange={(e) => {
                      const next = { ...selected, name: e.target.value };
                      if (creating) setNewPick(next);
                      else if (selected.id) setDrafts((m) => ({ ...m, [selected.id]: next }));
                    }}
                    className={field}
                    placeholder="Title"
                  />
                  <input
                    value={selected.snippet}
                    onChange={(e) => {
                      const next = { ...selected, snippet: e.target.value };
                      if (creating) setNewPick(next);
                      else if (selected.id) setDrafts((m) => ({ ...m, [selected.id]: next }));
                    }}
                    className={field}
                    placeholder="Card snippet"
                  />
                  <textarea
                    value={selected.body}
                    onChange={(e) => {
                      const next = { ...selected, body: e.target.value };
                      if (creating) setNewPick(next);
                      else if (selected.id) setDrafts((m) => ({ ...m, [selected.id]: next }));
                    }}
                    rows={8}
                    className={field}
                    placeholder="Mini article"
                  />
                  {showCodes ? (
                    <p className="text-[10px] font-mono text-amber-200/80 break-all">{affiliateUrl(selected, tag)}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    {[
                      ["all", "Rewrite"],
                      ["snippet", "Snippet"],
                      ["body", "Body"],
                    ].map(([k, label]) => (
                      <button
                        key={k}
                        type="button"
                        disabled={!!busy}
                        onClick={() => workPick(selected, k)}
                        className="px-3 py-2 rounded-xl text-xs border border-neutral-700 disabled:opacity-40"
                      >
                        {busy === k ? "…" : label}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={!!busy || !selected.name}
                      onClick={() => workPick(selected, "photo")}
                      className="px-3 py-2 rounded-xl text-xs border border-amber-800/50 text-amber-200 disabled:opacity-40"
                    >
                      {busy.startsWith("photo") ? "Shooting…" : "Reshoot still"}
                    </button>
                    <button
                      type="button"
                      disabled={!!busy || !selected.name}
                      onClick={() => workPick(selected, "save")}
                      className="px-3 py-2 rounded-xl text-xs bg-amber-200 text-black disabled:opacity-40"
                    >
                      Save
                    </button>
                    {selected.id && !creating ? (
                      <>
                        <a href={`/loot/${selected.id}`} target="_blank" rel="noreferrer" className="px-3 py-2 text-xs text-neutral-500">
                          Preview
                        </a>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm("Delete this card?")) return;
                            await post({ action: "delete", id: selected.id });
                            setSelectedId(null);
                            await load();
                          }}
                          className="px-3 py-2 text-xs text-red-400"
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <button type="button" onClick={() => setCreating(false)} className="px-3 py-2 text-xs text-neutral-500">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
