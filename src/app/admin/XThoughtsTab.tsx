"use client";

import { useEffect, useState } from "react";
import { TOPICS } from "@/lib/thoughts-packs";
import { EMOTE_PACKS, SIGNOFFS, X_HEATS, X_LENGTHS, X_OUTLOOKS, X_PREMIUM_CAP } from "@/lib/x-thoughts";
import { readJson } from "@/lib/read-json";

export function XThoughtsTab() {
  const [topic, setTopic] = useState(TOPICS[2]?.id || TOPICS[0].id);
  const [outlook, setOutlook] = useState("honest");
  const [heat, setHeat] = useState("sharp");
  const [pack, setPack] = useState("dry");
  const [signoff, setSignoff] = useState("bio");
  const [length, setLength] = useState("medium");
  const [seed, setSeed] = useState("");
  const [fromSlug, setFromSlug] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [post, setPost] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/admin/thoughts")
      .then((r) => r.json())
      .then((d) => setRows(d.rows || []))
      .catch(() => {});
  }, []);

  const roll = () => {
    setTopic(TOPICS[Math.floor(Math.random() * TOPICS.length)].id);
    setOutlook(X_OUTLOOKS[Math.floor(Math.random() * X_OUTLOOKS.length)].id);
    setHeat(X_HEATS[Math.floor(Math.random() * X_HEATS.length)].id);
    setPack(EMOTE_PACKS[Math.floor(Math.random() * EMOTE_PACKS.length)].id);
    setLength(X_LENGTHS[Math.floor(Math.random() * X_LENGTHS.length)].id);
  };

  const run = async (tweak = "fresh") => {
    setBusy(true);
    setMsg("");
    try {
      const picked = rows.find((r) => r.slug === fromSlug);
      const source = picked ? `${picked.title}\n${picked.excerpt || ""}\n${picked.body || ""}` : "";
      const res = await fetch("/api/admin/x-thoughts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outlook, heat, pack, signoff, length, topic, seed, source, tweak, existing: post }),
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Draft failed");
      setPost(data.post || "");
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!post) return;
    await navigator.clipboard.writeText(post);
    setMsg("Copied");
  };

  const field = "w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-neutral-800 text-sm";
  const chars = [...post].length;
  const over = chars > X_PREMIUM_CAP;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-sky-900/30 bg-gradient-to-b from-sky-950/20 to-[#111] p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-neutral-100 font-medium">X Thoughts</p>
            <p className="text-xs text-neutral-500 mt-1">Premium length. No URL. Pick the lanes, then draft.</p>
          </div>
          <button type="button" onClick={roll} className="px-3 py-1.5 rounded-lg text-xs border border-sky-500/40 text-sky-200">Random</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-xs text-neutral-500 space-y-1">Topic
            <select value={topic} onChange={(e) => setTopic(e.target.value)} className={field}>
              {TOPICS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </label>
          <label className="text-xs text-neutral-500 space-y-1">Outlook
            <select value={outlook} onChange={(e) => setOutlook(e.target.value)} className={field}>
              {X_OUTLOOKS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </label>
          <label className="text-xs text-neutral-500 space-y-1">Heat
            <select value={heat} onChange={(e) => setHeat(e.target.value)} className={field}>
              {X_HEATS.map((h) => <option key={h.id} value={h.id}>{h.label}</option>)}
            </select>
          </label>
          <label className="text-xs text-neutral-500 space-y-1">Emotes
            <select value={pack} onChange={(e) => setPack(e.target.value)} className={field}>
              {EMOTE_PACKS.map((p) => <option key={p.id} value={p.id}>{p.label}{p.emotes ? ` · ${p.emotes}` : ""}</option>)}
            </select>
          </label>
          <label className="text-xs text-neutral-500 space-y-1">Length
            <select value={length} onChange={(e) => setLength(e.target.value)} className={field}>
              {X_LENGTHS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
          </label>
          <label className="text-xs text-neutral-500 space-y-1">Sign-off
            <select value={signoff} onChange={(e) => setSignoff(e.target.value)} className={field}>
              {SIGNOFFS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </label>
        </div>

        <label className="text-xs text-neutral-500 space-y-1 block">Cut from a thought
          <select value={fromSlug} onChange={(e) => setFromSlug(e.target.value)} className={field}>
            <option value="">New idea</option>
            {rows.map((r) => <option key={r.id || r.slug} value={r.slug}>{r.title}</option>)}
          </select>
        </label>
        <textarea value={seed} onChange={(e) => setSeed(e.target.value)} rows={3} className={field} placeholder="Optional extra direction" />
        <button type="button" onClick={() => run("fresh")} disabled={busy} className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-rose-400 text-black font-semibold disabled:opacity-50">
          {busy ? "Writing…" : "Draft post"}
        </button>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-3">
        <textarea value={post} onChange={(e) => setPost(e.target.value)} rows={length === "premium" || length === "long" ? 16 : 8} className={field + " font-medium leading-relaxed"} placeholder="Draft lands here" />
        <div className="flex items-center justify-between text-xs">
          <span className={over ? "text-red-400" : "text-neutral-500"}>{chars.toLocaleString()} / {X_PREMIUM_CAP.toLocaleString()}</span>
          {msg && <span className="text-amber-200">{msg}</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => run("shorter")} disabled={busy || !post} className="px-3 py-2 rounded-lg border border-neutral-700 text-xs">Shorter</button>
          <button type="button" onClick={() => run("meaner")} disabled={busy || !post} className="px-3 py-2 rounded-lg border border-neutral-700 text-xs">Meaner</button>
          <button type="button" onClick={() => run("softer")} disabled={busy || !post} className="px-3 py-2 rounded-lg border border-neutral-700 text-xs">Softer</button>
          <button type="button" onClick={copy} disabled={!post} className="ml-auto px-4 py-2 rounded-lg bg-neutral-100 text-black text-xs font-medium">Copy</button>
        </div>
      </div>
    </div>
  );
}
