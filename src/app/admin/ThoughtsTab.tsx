"use client";

import { useEffect, useState } from "react";
import { CLASSICS, COVER_STYLES, FORMS, HEATS, OUTLOOKS, TOPICS, packOfTopic, pickRandom } from "@/lib/thoughts-packs";

export function ThoughtsTab() {
  const [topic, setTopic] = useState(TOPICS[0].id);
  const [outlook, setOutlook] = useState("honest");
  const [heat, setHeat] = useState("sharp");
  const [form, setForm] = useState("essay");
  const [coverStyle, setCoverStyle] = useState("object");
  const [seed, setSeed] = useState("");
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [slug, setSlug] = useState("");
  const [cover, setCover] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");

  const load = async () => {
    const res = await fetch("/api/admin/thoughts");
    const data = await res.json();
    setRows(data.rows || []);
    if (data.error) setMsg(data.error);
  };

  useEffect(() => {
    load();
  }, []);

  const roll = () => {
    const r = pickRandom();
    setTopic(r.topic.id);
    setOutlook(r.outlook.id);
    setHeat(r.heat.id);
    setForm(r.form.id);
    setCoverStyle(r.cover.id);
    setSeed("");
  };

  const draft = async () => {
    setBusy("draft");
    setMsg("");
    try {
      const res = await fetch("/api/admin/thoughts/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed, topic, outlook, heat, form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Draft failed");
      setTitle(data.title || "");
      setExcerpt(data.excerpt || "");
      setBody(data.body || "");
      setSlug(data.slug || "");
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setBusy("");
    }
  };

  const requestCover = async (t: string, e: string) => {
    const res = await fetch("/api/admin/thoughts/cover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: t, excerpt: e, style: coverStyle }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Cover failed");
    return String(data.cover_url || "");
  };

  const makeCover = async () => {
    if (!title) return setMsg("Draft a title first");
    setBusy("cover");
    setMsg("");
    try {
      setCover(await requestCover(title, excerpt));
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setBusy("");
    }
  };

  const headerClassic = async (c: (typeof CLASSICS)[number]) => {
    setBusy(c.slug);
    setMsg("");
    try {
      const url = await requestCover(c.title, c.excerpt);
      const res = await fetch("/api/admin/thoughts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: c.slug,
          title: c.title,
          excerpt: c.excerpt,
          body: "Classic essay.",
          cover_url: url,
          topic: c.pack,
          published: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setMsg(`Header on ${c.slug}`);
      await load();
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setBusy("");
    }
  };

  const save = async (published: boolean) => {
    setBusy("save");
    setMsg("");
    try {
      const res = await fetch("/api/admin/thoughts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug, title, excerpt, body, cover_url: cover || null,
          outlook, heat, topic: packOfTopic(topic), published,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setMsg(published ? "Live on Thoughts" : "Saved as draft");
      await load();
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setBusy("");
    }
  };

  const field = "w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-neutral-800 text-sm";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-rose-900/30 bg-gradient-to-b from-rose-950/20 to-[#111] p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-neutral-100 font-medium">Thought press</p>
            <p className="text-xs text-neutral-500 mt-1">Grok drafts. You edit. Header optional. Nothing auto-posts.</p>
          </div>
          <button type="button" onClick={roll} className="px-3 py-1.5 rounded-lg text-xs border border-amber-500/40 text-amber-200">Random</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-xs text-neutral-500 space-y-1">Topic
            <select value={topic} onChange={(e) => setTopic(e.target.value)} className={field}>
              {TOPICS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </label>
          <label className="text-xs text-neutral-500 space-y-1">Outlook
            <select value={outlook} onChange={(e) => setOutlook(e.target.value)} className={field}>
              {OUTLOOKS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </label>
          <label className="text-xs text-neutral-500 space-y-1">Heat
            <select value={heat} onChange={(e) => setHeat(e.target.value)} className={field}>
              {HEATS.map((h) => <option key={h.id} value={h.id}>{h.label}</option>)}
            </select>
          </label>
          <label className="text-xs text-neutral-500 space-y-1">Form
            <select value={form} onChange={(e) => setForm(e.target.value)} className={field}>
              {FORMS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </label>
        </div>
        <input value={seed} onChange={(e) => setSeed(e.target.value)} className={field} placeholder="Optional extra direction" />
        <button type="button" onClick={draft} disabled={!!busy} className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-400 text-black font-semibold disabled:opacity-50">
          {busy === "draft" ? "Writing…" : "Draft thought"}
        </button>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={field} placeholder="Title" />
        <input value={slug} onChange={(e) => setSlug(e.target.value)} className={field} placeholder="slug" />
        <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} className={field} placeholder="Excerpt" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={12} className={field} placeholder="Body" />
        <div className="flex flex-wrap gap-2 items-end">
          <label className="text-xs text-neutral-500 space-y-1 flex-1 min-w-[160px]">Header style
            <select value={coverStyle} onChange={(e) => setCoverStyle(e.target.value)} className={field}>
              {COVER_STYLES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </label>
          <button type="button" onClick={makeCover} disabled={!!busy} className="px-4 py-2 rounded-lg border border-neutral-700 text-sm">
            {busy === "cover" ? "Making header…" : "Make header"}
          </button>
        </div>
        {cover && (
          <div className="relative w-full h-40 overflow-hidden rounded-xl border border-neutral-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover" />
          </div>
        )}
        <div className="flex gap-2">
          <button type="button" onClick={() => save(false)} disabled={!!busy || !title || !slug} className="flex-1 py-2.5 rounded-xl border border-neutral-700 text-sm">Save draft</button>
          <button type="button" onClick={() => save(true)} disabled={!!busy || !title || !slug} className="flex-1 py-2.5 rounded-xl bg-neutral-100 text-black text-sm font-medium">Publish</button>
        </div>
        {msg && <p className="text-xs text-amber-200">{msg}</p>}
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-3">
        <p className="text-xs uppercase tracking-wide text-neutral-500">Headers for the original six</p>
        {CLASSICS.map((c) => {
          const existing = rows.find((r) => r.slug === c.slug);
          return (
            <div key={c.slug} className="flex items-center justify-between gap-3">
              <p className="text-sm text-neutral-300 truncate">{c.title}</p>
              <button
                type="button"
                disabled={!!busy}
                onClick={() => headerClassic(c)}
                className="text-[11px] text-fuchsia-300 shrink-0"
              >
                {busy === c.slug ? "Making…" : existing?.cover_url ? "Remake header" : "Make header"}
              </button>
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-wide text-neutral-500">Saved</p>
        {rows.map((r) => (
          <div key={r.id} className="rounded-xl border border-neutral-800 bg-[#111] p-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-neutral-200 truncate">{r.title}</p>
              <p className="text-[11px] text-neutral-500">{r.slug} · {r.published ? "live" : "draft"}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button type="button" onClick={() => { setTitle(r.title); setExcerpt(r.excerpt || ""); setBody(r.body || ""); setSlug(r.slug); setCover(r.cover_url || ""); }} className="text-[11px] text-fuchsia-300">Load</button>
              <button type="button" onClick={async () => { await fetch("/api/admin/thoughts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: r.id, published: !r.published }) }); load(); }} className="text-[11px] text-neutral-400">{r.published ? "Hide" : "Live"}</button>
              <button type="button" onClick={async () => { if (!confirm("Delete?")) return; await fetch("/api/admin/thoughts", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: r.id }) }); load(); }} className="text-[11px] text-red-400">Del</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
