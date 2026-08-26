"use client";

import { useEffect, useState } from "react";
import { XDropPanel } from "@/app/admin/XDropPanel";
import { TOPICS } from "@/lib/thoughts-packs";
import { EMOTE_PACKS, SIGNOFFS, X_HEATS, X_LENGTHS, X_OUTLOOKS, X_PREMIUM_CAP } from "@/lib/x-thoughts";
import { readJson } from "@/lib/read-json";

type LedgerRow = {
  id: string;
  post_id: string | null;
  url: string | null;
  body: string;
  source: string;
  posted_at: string | null;
};

type DupHit = {
  id: string;
  score: number;
  body: string;
  url: string | null;
  posted_at: string | null;
};

export function XThoughtsTab() {
  const [pane, setPane] = useState<"drop" | "thoughts">("drop");
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
  const [look, setLook] = useState("");
  const [aspect, setAspect] = useState<"16:9" | "9:16">("16:9");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [imaging, setImaging] = useState(false);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [hits, setHits] = useState<DupHit[]>([]);
  const [connected, setConnected] = useState(false);
  const [handle, setHandle] = useState("Thievn");
  const [postedUrl, setPostedUrl] = useState("");
  const [syncing, setSyncing] = useState(false);

  const loadLedger = async () => {
    const res = await fetch("/api/admin/x-posts");
    const data = await readJson(res);
    setLedger(data.rows || []);
    setConnected(Boolean(data.connected));
    if (data.handle) setHandle(data.handle);
  };

  useEffect(() => {
    fetch("/api/admin/thoughts")
      .then((r) => r.json())
      .then((d) => setRows(d.rows || []))
      .catch(() => {});
    loadLedger().catch(() => {});
  }, []);

  const checkDupes = async (draft: string) => {
    if (!draft.trim()) {
      setHits([]);
      return [] as DupHit[];
    }
    const res = await fetch("/api/admin/x-posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "check", body: draft }),
    });
    const data = await readJson(res);
    const next = (data.hits || []) as DupHit[];
    setHits(next);
    return next;
  };

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
      const next = data.post || "";
      setPost(next);
      await checkDupes(next);
      await loadLedger();
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
    setLook("");
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
      setLook(data.look || data.style || "");
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setImaging(false);
    }
  };

  const copy = async () => {
    if (!post) return;
    const found = await checkDupes(post);
    await navigator.clipboard.writeText(post);
    setMsg(found.length ? "Copied — check the near-dupes first" : "Copied");
  };

  const markPosted = async () => {
    if (!post && !postedUrl) {
      setMsg("Draft or paste the live X link first.");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/x-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "log", body: post, url: postedUrl }),
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Could not save");
      setPostedUrl("");
      setMsg("Saved to your private X log");
      await loadLedger();
      await checkDupes(post);
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  const syncFromX = async () => {
    setSyncing(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/x-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Sync failed");
      setLedger(data.rows || []);
      setConnected(true);
      setMsg(`Pulled ${data.synced || 0} posts from @${data.handle || handle}`);
      if (post) await checkDupes(post);
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const dropRow = async (id: string) => {
    await fetch("/api/admin/x-posts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await loadLedger();
    if (post) await checkDupes(post);
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
  const btn = "px-3 py-2 rounded-lg border border-neutral-700 text-xs";
  const chars = [...post].length;
  const over = chars > X_PREMIUM_CAP;
  const frame = aspect === "9:16" ? "aspect-[9/16] max-w-[200px] mx-auto" : "aspect-[16/9] w-full";

  return (
    <div className="space-y-4 pb-28">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setPane("drop")}
          className={`px-3 py-1.5 rounded-lg text-xs border ${
            pane === "drop" ? "border-amber-400/50 text-amber-100" : "border-neutral-800 text-neutral-500"
          }`}
        >
          Drop for X
        </button>
        <button
          type="button"
          onClick={() => setPane("thoughts")}
          className={`px-3 py-1.5 rounded-lg text-xs border ${
            pane === "thoughts" ? "border-sky-500/50 text-sky-100" : "border-neutral-800 text-neutral-500"
          }`}
        >
          Write a thought
        </button>
      </div>

      {pane === "drop" ? <XDropPanel /> : (
      <>
      <div className="rounded-2xl border border-sky-900/30 bg-gradient-to-b from-sky-950/20 to-[#111] p-4 sm:p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-neutral-100 font-medium">X Thoughts</p>
            <p className="text-xs text-neutral-500 mt-1">Private drafts land in Supabase so the next one cannot copy them. Pics follow the writing in a new art style each time.</p>
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
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-3">
        <textarea
          value={post}
          onChange={(e) => setPost(e.target.value)}
          onBlur={() => { if (post) checkDupes(post); }}
          rows={7}
          className={field + " font-medium leading-relaxed"}
          placeholder="Draft lands here"
        />
        <div className="flex items-center justify-between text-xs">
          <span className={over ? "text-red-400" : "text-neutral-500"}>{chars.toLocaleString()} / {X_PREMIUM_CAP.toLocaleString()}</span>
          {msg && <span className="text-amber-200">{msg}</span>}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <button type="button" onClick={() => run("shorter")} disabled={busy || !post} className={btn}>Shorter</button>
          <button type="button" onClick={() => run("meaner")} disabled={busy || !post} className={btn}>Meaner</button>
          <button type="button" onClick={() => run("softer")} disabled={busy || !post} className={btn}>Softer</button>
          <button type="button" onClick={() => run("funnier")} disabled={busy || !post} className={btn}>Funnier</button>
          <button type="button" onClick={() => run("filthier")} disabled={busy || !post} className={btn}>Filthier</button>
          <button type="button" onClick={() => setAspect("16:9")} className={`${btn} ${aspect === "16:9" ? "border-sky-400 text-sky-100" : ""}`}>16:9</button>
          <button type="button" onClick={() => setAspect("9:16")} className={`${btn} ${aspect === "9:16" ? "border-sky-400 text-sky-100" : ""}`}>9:16</button>
          <button type="button" onClick={makeImage} disabled={imaging || (!post && !seed)} className="px-3 py-2 rounded-lg bg-sky-400 text-black text-xs font-semibold disabled:opacity-40">
            {imaging ? "Making…" : image ? "New pic" : "Make pic"}
          </button>
          <button type="button" onClick={copy} disabled={!post} className="ml-auto px-4 py-2 rounded-lg bg-neutral-100 text-black text-xs font-medium">Copy</button>
        </div>
        {hits.length ? (
          <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-3 space-y-2">
            <p className="text-xs text-amber-200">This draft is close to something you already logged.</p>
            {hits.map((hit) => (
              <div key={hit.id} className="text-xs text-neutral-400">
                <span className="text-amber-100">{Math.round(hit.score * 100)}% · </span>
                {hit.url ? (
                  <a href={hit.url} target="_blank" rel="noreferrer" className="text-sky-300 hover:underline">
                    open on X
                  </a>
                ) : (
                  <span>already stored</span>
                )}
                <p className="mt-1 text-neutral-300 line-clamp-3">{hit.body}</p>
              </div>
            ))}
          </div>
        ) : post ? (
          <p className="text-xs text-neutral-600">No close match in your log.</p>
        ) : null}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 pt-1">
          <input
            value={postedUrl}
            onChange={(e) => setPostedUrl(e.target.value)}
            className={field}
            placeholder="After you post: paste https://x.com/Thievn/status/…"
          />
          <button type="button" onClick={markPosted} disabled={busy} className="px-3 py-2 rounded-lg border border-sky-500/40 text-sky-100 text-xs">
            Mark posted
          </button>
        </div>
        {image ? (
          <div className="space-y-2 pt-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" className={`rounded-xl border border-neutral-800 object-cover ${frame}`} />
            {look ? <p className="text-[11px] text-neutral-500">{look}</p> : null}
            <button type="button" onClick={downloadPic} className="w-full py-2.5 rounded-xl text-sm border border-neutral-700 text-neutral-100">
              Download for X
            </button>
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-neutral-100 font-medium">Your X log</p>
            <p className="text-xs text-neutral-500 mt-1">
              {connected
                ? `Live pull is on for @${handle}. Sync only when you need it — it spends X credits.`
                : "Add X_BEARER_TOKEN on Vercel to pull live posts. Until then, mark posts by hand."}
            </p>
          </div>
          <button type="button" onClick={syncFromX} disabled={syncing || !connected} className="px-3 py-1.5 rounded-lg text-xs border border-sky-500/40 text-sky-200 disabled:opacity-40">
            {syncing ? "Pulling…" : "Sync from X"}
          </button>
        </div>
        {!ledger.length ? (
          <p className="text-xs text-neutral-600">Nothing logged yet. Draft, post on X, then mark posted — or sync if the token is set.</p>
        ) : (
          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {ledger.map((row) => (
              <div key={row.id} className="rounded-xl border border-neutral-800 p-3 space-y-1">
                <div className="flex items-center justify-between gap-2 text-[11px] text-neutral-500">
                  <span>
                    {row.posted_at ? new Date(row.posted_at).toLocaleString() : "draft"} · {row.source}
                  </span>
                  <button type="button" onClick={() => dropRow(row.id)} className="text-neutral-600 hover:text-red-300">
                    Remove
                  </button>
                </div>
                <p className="text-sm text-neutral-200 whitespace-pre-wrap line-clamp-4">{row.body}</p>
                {row.url ? (
                  <a href={row.url} target="_blank" rel="noreferrer" className="text-xs text-sky-300 hover:underline">
                    Open on X
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
}
