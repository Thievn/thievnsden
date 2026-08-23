"use client";

import { useEffect, useMemo, useState } from "react";
import { affiliateUrl, LOOT_SECTIONS, PHOTO_SCENES, slugify, type LootPick } from "@/lib/loot-data";

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

function Editor({
  pick,
  onChange,
  onSave,
  onPhoto,
  onCopy,
  busy,
  showCodes,
}: {
  pick: LootPick;
  onChange: (p: LootPick) => void;
  onSave: () => void;
  onPhoto: (scene: string, extra: string) => void;
  onCopy: (field: string) => void;
  busy: string;
  showCodes: boolean;
}) {
  const [scene, setScene] = useState("auto");
  const [extra, setExtra] = useState("");
  const field = "w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200";
  return (
    <div className="p-3 space-y-2 border-t border-neutral-800">
      <div className="grid sm:grid-cols-2 gap-2">
        <select value={pick.section} onChange={(e) => onChange({ ...pick, section: e.target.value })} className={field}>
          {LOOT_SECTIONS.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <input value={pick.search_query || ""} onChange={(e) => onChange({ ...pick, search_query: e.target.value })} className={field} placeholder="Amazon search" />
      </div>
      <input value={pick.name} onChange={(e) => onChange({ ...pick, name: e.target.value })} className={field} placeholder="Title" />
      <input value={pick.snippet} onChange={(e) => onChange({ ...pick, snippet: e.target.value })} className={field} placeholder="Snippet" />
      <textarea value={pick.body} onChange={(e) => onChange({ ...pick, body: e.target.value })} rows={4} className={field} placeholder="Two short paragraphs" />
      {showCodes && (
        <input value={pick.tag_override || ""} onChange={(e) => onChange({ ...pick, tag_override: e.target.value })} className={field} placeholder="Tag override" />
      )}
      <div className="grid sm:grid-cols-2 gap-2">
        <select value={scene} onChange={(e) => setScene(e.target.value)} className={field}>
          {PHOTO_SCENES.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <input value={extra} onChange={(e) => setExtra(e.target.value)} className={field} placeholder="Photo extra" />
      </div>
      <div className="flex flex-wrap gap-2">
        {[
          ["title", "Title"],
          ["snippet", "Snippet"],
          ["body", "Note"],
          ["all", "All copy"],
        ].map(([k, label]) => (
          <button key={k} type="button" disabled={!!busy} onClick={() => onCopy(k)} className="px-3 py-2 rounded-lg text-xs border border-neutral-700 disabled:opacity-40">
            {busy === k ? "…" : label}
          </button>
        ))}
        <button type="button" disabled={!!busy || !pick.name} onClick={() => onPhoto(scene, extra)} className="px-3 py-2 rounded-lg text-xs border border-amber-800/50 text-amber-200 disabled:opacity-40">
          {busy === "photo" ? "Shooting…" : "Photo"}
        </button>
        <button type="button" disabled={!!busy || !pick.name} onClick={onSave} className="px-3 py-2 rounded-lg text-xs bg-amber-200 text-black disabled:opacity-40">
          Save
        </button>
      </div>
    </div>
  );
}

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
  const [fillCount, setFillCount] = useState(5);
  const [ideas, setIdeas] = useState<LootPick[]>([]);

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

  const workPick = async (pick: LootPick, kind: string, extra?: { scene?: string; extra?: string; field?: string }) => {
    setBusy(kind);
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
          scene: extra?.scene || "auto",
          extra: extra?.extra || "",
        });
        const next = { ...pick, id, image_url: d.image_url };
        if (pick.id) setDrafts((m) => ({ ...m, [pick.id]: next }));
        else setNewPick(next);
        setMsg("Photo saved");
        await load();
      }
      if (["title", "snippet", "body", "all"].includes(kind)) {
        const d = await post({
          action: "copy",
          field: extra?.field || kind,
          hint: pick.search_query || pick.name,
          name: pick.name,
          section: pick.section,
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

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-amber-900/30 bg-[#111] p-5 space-y-3">
        <p className="text-sm text-neutral-100 font-medium">Loot desk</p>
        <p className="text-xs text-neutral-500">Edit opens on the card. Auto photo picks studio / shelf / hand from the item name.</p>
        <label className="flex items-center gap-2 text-sm text-neutral-300">
          <input type="checkbox" checked={showCodes} onChange={(e) => setShowCodes(e.target.checked)} />
          Show affiliate codes
        </label>
        {showCodes && (
          <div className="space-y-2">
            <input value={tag} onChange={(e) => setTag(e.target.value)} className={field} />
            <button type="button" onClick={async () => { await post({ action: "settings", default_tag: tag }); setMsg("Tag saved"); }} className="px-3 py-2 rounded-lg text-xs border border-neutral-700">Save default tag</button>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={async () => { const d = await post({ action: "seed" }); setMsg(`Seeded ${d.seeded}`); await load(); }} className="px-3 py-2 rounded-lg text-xs border border-neutral-700">Seed six</button>
          <button type="button" onClick={() => { setCreating(true); setOpenId(null); }} className="px-3 py-2 rounded-lg text-xs border border-amber-800/50 text-amber-100">New card</button>
        </div>
        {msg && <p className="text-xs text-amber-200">{msg}</p>}
      </div>

      {creating && (
        <div className="rounded-2xl border border-amber-800/40 bg-[#111] overflow-hidden">
          <div className="px-3 py-2 flex justify-between text-xs text-neutral-400">
            <span>New card</span>
            <button type="button" onClick={() => setCreating(false)}>Close</button>
          </div>
          <Editor
            pick={newPick}
            onChange={setNewPick}
            busy={busy}
            showCodes={showCodes}
            onSave={() => workPick(newPick, "save")}
            onPhoto={(scene, extra) => workPick(newPick, "photo", { scene, extra })}
            onCopy={(fieldName) => workPick(newPick, fieldName, { field: fieldName })}
          />
        </div>
      )}

      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-3">
        <p className="text-xs uppercase tracking-wide text-neutral-500">Fill a section</p>
        <div className="grid sm:grid-cols-3 gap-2">
          <select value={fillSection} onChange={(e) => setFillSection(e.target.value)} className={field}>
            {LOOT_SECTIONS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <input value={fillHint} onChange={(e) => setFillHint(e.target.value)} className={field} placeholder="optional vibe" />
          <select value={fillCount} onChange={(e) => setFillCount(Number(e.target.value))} className={field}>
            {[3, 4, 5, 6, 8].map((n) => <option key={n} value={n}>{n} cards</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button type="button" disabled={!!busy} onClick={async () => {
            setBusy("research");
            try {
              const d = await post({ action: "research", section: fillSection, hint: fillHint, count: fillCount, avoid: picks.map((p) => p.name) });
              setIdeas(d.picks || []);
            } catch (err: any) { setMsg(err.message); } finally { setBusy(""); }
          }} className="px-3 py-2 rounded-lg text-xs border border-neutral-700">Research</button>
          <button type="button" disabled={!!busy} onClick={async () => {
            setBusy("fill");
            try {
              const d = await post({ action: "fill", section: fillSection, hint: fillHint, count: fillCount, avoid: picks.map((p) => p.name) });
              setIdeas([]);
              setMsg(`Saved ${d.picks?.length || 0}`);
              await load();
            } catch (err: any) { setMsg(err.message); } finally { setBusy(""); }
          }} className="px-3 py-2 rounded-lg text-xs border border-amber-800/50 text-amber-100">Fill and save</button>
        </div>
        {ideas.map((p) => (
          <div key={p.id} className="rounded-xl border border-neutral-800 p-3">
            <p className="text-sm text-neutral-100">{p.name}</p>
            <p className="text-xs text-neutral-500">{p.snippet}</p>
            <button type="button" className="text-[11px] text-amber-200 mt-1" onClick={async () => { await post({ action: "save", pick: p }); setIdeas((x) => x.filter((i) => i.id !== p.id)); await load(); }}>Save this one</button>
          </div>
        ))}
      </div>

      {LOOT_SECTIONS.map((sec) => (
        <section key={sec.id} className="space-y-3">
          <h2 className="text-xs uppercase tracking-wide text-neutral-500">{sec.label}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {(groups[sec.id] || []).map((p) => {
              const live = drafts[p.id] || p;
              const open = openId === p.id;
              return (
                <div key={p.id} className={`rounded-2xl border bg-[#111] overflow-hidden ${
                  open ? "border-amber-800/50 sm:col-span-2" : "border-neutral-800"
                }`}>
                  <div className={`grid ${open ? "sm:grid-cols-2" : ""}`}>
                    <div className="aspect-[4/3] bg-black">
                      {live.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={live.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="h-full flex items-center justify-center text-[11px] text-neutral-600">No cover</div>
                      )}
                    </div>
                    <div className="p-3 space-y-2">
                      <p className="text-sm text-neutral-100">{live.name}</p>
                      <p className="text-xs text-neutral-500">{live.snippet}</p>
                      {showCodes && <p className="text-[10px] font-mono text-amber-200/80 break-all">{affiliateUrl(live, tag)}</p>}
                      <div className="flex gap-3 text-[11px]">
                        <button type="button" onClick={() => { setOpenId(open ? null : p.id); setDrafts((m) => ({ ...m, [p.id]: live })); setCreating(false); }} className="text-amber-200">
                          {open ? "Close" : "Edit here"}
                        </button>
                        <button type="button" onClick={async () => { if (!confirm("Delete?")) return; await post({ action: "delete", id: p.id }); await load(); }} className="text-red-400">Delete</button>
                      </div>
                    </div>
                  </div>
                  {open && (
                    <Editor
                      pick={live}
                      onChange={(next) => setDrafts((m) => ({ ...m, [p.id]: next }))}
                      busy={busy}
                      showCodes={showCodes}
                      onSave={() => workPick(live, "save")}
                      onPhoto={(scene, extra) => workPick(live, "photo", { scene, extra })}
                      onCopy={(fieldName) => workPick(live, fieldName, { field: fieldName })}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
