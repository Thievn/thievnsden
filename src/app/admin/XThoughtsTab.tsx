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
  const [image, setImage] = useState("");
  const [aspect, setAspect] = useState<"16:9" | "9:16">("16:9");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [imaging, setImaging] = useState(false);

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

  const makeImage = async () => {
    if (!post && !seed) {
      setMsg("Draft first, then make the pic.");
      return;
    }
    setImaging(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/x-thoughts/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, post, seed, aspect }),
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Image failed");
      setImage(data.image || "");
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setImaging(false);
    }
  };

  const copy = async () => {
    if (!post) return;
    await navigator.clipboard.writeText(post);
    setMsg("Copied");
  };

  const downloadPic = async () => {
    if (!image) return;
    try {
      const res = await fetch(image);
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `x-thought-${aspect.replace(":", "x")}-${topic || "den"}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
      setMsg("Downloaded");
    } catch {
      window.open(image, "_blank");
    }
  };

  const field = "w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-neutral-800 text-sm";
  const chars = [...post].length;
  const over = chars > X_PREMIUM_CAP;
  const frame = aspect === "9:16" ? "aspect-[9/16] max-w-[200px] mx-auto" : "aspect-[16/9] w-full";

  return (
    <div className="space-y-4 pb-28">
      <div className="rounded-2xl border border-sky-900/30 bg-gradient-to-b from-sky-950/20 to-[#111] p-4 sm:p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-neutral-100 font-medium">X Thoughts</p>
            <p className="text-xs text-neutral-500 mt-1">Draft the post, then make the pic in this same card.</p>
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
        <textarea value={seed} onChange={(e) => setSeed(e.target.value)} rows={2} className={field} placeholder="Optional extra direction" />

        <button type="button" onClick={() => run("fresh")} disabled={busy} className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-rose-400 text-black font-semibold disabled:opacity-50">
          {busy ? "Writing…" : "Draft post"}
        </button>

        <textarea value={post} onChange={(e) => setPost(e.target.value)} rows={7} className={field + " font-medium leading-relaxed"} placeholder="Draft lands here" />
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

        <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-sky-100 font-medium">Make a pic for this post</p>
            <div className="flex gap-1">
              {(["16:9", "9:16"] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAspect(a)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] border ${
                    aspect === a
                      ? "border-sky-400 text-sky-50 bg-sky-900/70"
                      : "border-neutral-800 text-neutral-500"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={makeImage}
            disabled={imaging || (!post && !seed)}
            className="w-full py-3 rounded-xl text-sm font-semibold bg-sky-400 text-black disabled:opacity-40"
          >
            {imaging ? "Making pic…" : image ? "Regenerate pic" : "Make pic"}
          </button>
          {image ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="" className={`rounded-xl border border-neutral-800 object-cover ${frame}`} />
              <button type="button" onClick={downloadPic} className="w-full py-2.5 rounded-xl text-sm border border-neutral-600 text-neutral-100">
                Download for X
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
