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
  const [openId, setOpenId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, LootPick>>({});
  const [creating, setCreating] = useState(false);
  const [newPick, setNewPick] = useState<LootPick>({ ...blank });
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [fillSection, setFillSection] = useState("desk");
  const [fillHint, setFillHint] = useState("");
  const [fillCount, setFillCount] = useState(4);
  const [vault, setVault] = useState<string>("all");
  const [ideas, setIdeas] = useState<LootPick[]>([]);
  const [scene, setScene] = useState("auto");
  const [photoExtra, setPhotoExtra] = useState("");

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

  const workPick = async (pick: LootPick, kind: string) => {
    setBusy(kind === "photo" ? `photo-${pick.id || "new"}` : kind);
    setMsg("");
    try {
      if (kind === "save") {
        const d = await post({ action: "save", pick: { ...pick, id: pick.id || slugify(pick.name) } });
        setMsg(`Saved ${d.pick.id}`);
        setOpenId(null);
        setCreating(false);
        setNewPick({ ...blank });
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
        setMsg("Still saved onto the card");
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
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setBusy("");
    }
  };

  const Editor = ({ pick, onChange }: { pick: LootPick; onChange: (p: LootPick) => void }) => (
    <div className="p-4 space-y-2 border-t border-neutral-800">
      <div className="grid sm:grid-cols-2 gap-2">
        <select value={pick.section} onChange={(e) => onChange({ ...pick, section: e.target.value })} className={field}>
          {LOOT_SECTIONS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <input
          value={pick.search_query || ""}
          onChange={(e) => onChange({ ...pick, search_query: e.target.value })}
          className={field}
          placeholder="Amazon search keywords"
        />
      </div>
      <input value={pick.name} onChange={(e) => onChange({ ...pick, name: e.target.value })} className={field} placeholder="Title" />
      <input value={pick.snippet} onChange={(e) => onChange({ ...pick, snippet: e.target.value })} className={field} placeholder="Card snippet" />
      <textarea
        value={pick.body}
        onChange={(e) => onChange({ ...pick, body: e.target.value })}
        rows={8}
        className={field}
        placeholder="Mini article. Affiliate markdown like [headset](amazon:wireless gaming headset) is fine."
      />
      {showCodes ? (
        <input
          value={pick.tag_override || ""}
          onChange={(e) => onChange({ ...pick, tag_override: e.target.value })}
          className={field}
          placeholder="Tag override"
        />
      ) : null}
      <div className="flex flex-wrap gap-2">
        {[
          ["all", "Rewrite article"],
          ["title", "Title"],
          ["snippet", "Snippet"],
          ["body", "Body"],
        ].map(([k, label]) => (
          <button
            key={k}
            type="button"
            disabled={!!busy}
            onClick={() => workPick(pick, k)}
            className="px-3 py-2 rounded-xl text-xs border border-neutral-700 disabled:opacity-40"
          >
            {busy === k ? "…" : label}
          </button>
        ))}
        <button
          type="button"
          disabled={!!busy || !pick.name}
          onClick={() => workPick(pick, "photo")}
          className="px-3 py-2 rounded-xl text-xs border border-amber-800/50 text-amber-200 disabled:opacity-40"
        >
          {busy.startsWith("photo") ? "Shooting…" : "Generate still"}
        </button>
        <button
          type="button"
          disabled={!!busy || !pick.name}
          onClick={() => workPick(pick, "save")}
          className="px-3 py-2 rounded-xl text-xs bg-amber-200 text-black disabled:opacity-40"
        >
          Save
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-900/30 bg-[#111] p-5 space-y-3">
        <p className="text-xs uppercase tracking-wide text-neutral-500">Loot studio</p>
        <p className="text-sm text-neutral-300 leading-relaxed">
          Pick a category, generate a list of mini articles, then shoot a unique still per object. Photos are
          catalog packshots — not the same house interior every time. Shop links go to Amazon search with{" "}
          <span className="text-amber-200">thievnsden-20</span>.
        </p>
        <label className="flex items-center gap-2 text-sm text-neutral-300">
          <input type="checkbox" checked={showCodes} onChange={(e) => setShowCodes(e.target.checked)} />
          Show affiliate codes
        </label>
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
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={async () => {
              const d = await post({ action: "seed" });
              setMsg(`Seeded ${d.seeded}`);
              await load();
            }}
            className="px-3 py-2 rounded-xl text-xs border border-neutral-700"
          >
            Seed six
          </button>
          <button
            type="button"
            onClick={() => {
              setCreating(true);
              setOpenId(null);
            }}
            className="px-3 py-2 rounded-xl text-xs border border-amber-800/50 text-amber-100"
          >
            New card
          </button>
        </div>
        {msg ? <p className="text-sm text-amber-200">{msg}</p> : null}
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-3">
        <p className="text-xs uppercase tracking-wide text-neutral-500">Auto list</p>
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
          placeholder="Photo direction (optional) — lighting, material, angle"
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
              } catch (e: any) {
                setMsg(e.message);
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
              } catch (e: any) {
                setMsg(e.message);
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
              } catch (e: any) {
                setMsg(e.message);
              } finally {
                setBusy("");
              }
            }}
            className="py-2.5 rounded-xl text-sm border border-amber-800/60 text-amber-100 disabled:opacity-40"
          >
            {busy === "fill_full" ? "Shooting list…" : "Write + shoot stills"}
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
            } catch (e: any) {
              setMsg(e.message);
            } finally {
              setBusy("");
            }
          }}
          className="w-full py-2.5 rounded-xl text-sm border border-neutral-800 text-neutral-400 hover:text-neutral-200 disabled:opacity-40"
        >
          {busy === "photos" ? "Shooting missing…" : "Shoot missing stills in this category"}
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

      {creating ? (
        <div className="rounded-2xl border border-amber-800/40 bg-[#111] overflow-hidden">
          <div className="px-4 py-2 flex justify-between text-xs text-neutral-400">
            <span>New card</span>
            <button type="button" onClick={() => setCreating(false)}>
              Close
            </button>
          </div>
          <Editor pick={newPick} onChange={setNewPick} />
        </div>
      ) : null}

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {[{ id: "all", label: "All" }, ...LOOT_SECTIONS].map((s) => (
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

      <div className="grid sm:grid-cols-2 gap-3">
        {visible.map((p) => {
          const live = drafts[p.id] || p;
          const open = openId === p.id;
          return (
            <div
              key={p.id}
              className={`rounded-2xl border bg-[#111] overflow-hidden ${open ? "border-amber-800/50 sm:col-span-2" : "border-neutral-800"}`}
            >
              <div className={`grid ${open ? "sm:grid-cols-2" : ""}`}>
                <div className="aspect-[4/3] bg-black">
                  {live.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={live.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="h-full flex items-center justify-center text-[11px] text-neutral-600">No still</div>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  <p className="text-[10px] uppercase tracking-wide text-neutral-500">{live.section}</p>
                  <p className="text-sm text-neutral-100">{live.name}</p>
                  <p className="text-xs text-neutral-500 line-clamp-2">{live.snippet}</p>
                  {showCodes ? (
                    <p className="text-[10px] font-mono text-amber-200/80 break-all">{affiliateUrl(live, tag)}</p>
                  ) : null}
                  <div className="flex gap-3 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenId(open ? null : p.id);
                        setDrafts((m) => ({ ...m, [p.id]: live }));
                        setCreating(false);
                      }}
                      className="text-amber-200"
                    >
                      {open ? "Close" : "Edit"}
                    </button>
                    <a href={`/loot/${p.id}`} target="_blank" rel="noreferrer" className="text-neutral-500">
                      Preview
                    </a>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm("Delete?")) return;
                        await post({ action: "delete", id: p.id });
                        await load();
                      }}
                      className="text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
              {open ? <Editor pick={live} onChange={(next) => setDrafts((m) => ({ ...m, [p.id]: next }))} /> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
