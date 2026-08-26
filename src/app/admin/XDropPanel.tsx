"use client";

import { useEffect, useMemo, useState } from "react";
import { DROP_FEATURES } from "@/lib/x-drop";
import { SIGNOFFS, X_HEATS } from "@/lib/x-thoughts";
import { readJson } from "@/lib/read-json";

type HouseCard = {
  id: string;
  username: string;
  score: number;
  verdict: string;
  image_url: string | null;
  rarity: string | null;
};

type FloorPair = {
  id: string;
  a: string;
  b: string;
  topic?: string;
  topicB?: string;
};

type PrintCard = {
  id: string;
  image_url: string | null;
  want: string | null;
  username: string | null;
};

export function XDropPanel() {
  const [feature, setFeature] = useState("ftd");
  const [aspect, setAspect] = useState("4:5");
  const [heat, setHeat] = useState("sharp");
  const [signoff, setSignoff] = useState("bio");
  const [cards, setCards] = useState<HouseCard[]>([]);
  const [pairs, setPairs] = useState<FloorPair[]>([]);
  const [prints, setPrints] = useState<PrintCard[]>([]);
  const [picked, setPicked] = useState("");
  const [post, setPost] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [clipping, setClipping] = useState(false);
  const [video, setVideo] = useState("");
  const [still, setStill] = useState("");

  const load = async (feat: string) => {
    const res = await fetch(`/api/admin/x-drop/picks?feature=${feat}`);
    const data = await readJson(res);
    setCards(data.cards || []);
    setPairs(data.pairs || []);
    setPrints(data.prints || []);
    setPicked((data.cards?.[0]?.id || data.pairs?.[0]?.id || data.prints?.[0]?.id || "") as string);
    setVideo("");
    setStill("");
  };

  useEffect(() => {
    load(feature).catch(() => {});
  }, [feature]);

  const cardUrl = useMemo(() => {
    const params = new URLSearchParams({ kind: feature, aspect });
    if (picked) params.set("id", picked);
    return `/api/og/drop?${params.toString()}`;
  }, [feature, aspect, picked]);

  const draft = async () => {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/x-drop/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature, id: picked, heat, signoff }),
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

  const logDrop = async () => {
    if (!post) return;
    const res = await fetch("/api/admin/x-posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "log", body: post }),
    });
    const data = await readJson(res);
    if (!res.ok) {
      setMsg(data.error || "Could not save");
      return;
    }
    setMsg("Saved to your private X log");
  };

  const downloadStill = async () => {
    try {
      const res = await fetch(cardUrl);
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `den-drop-${feature}-${aspect.replace(":", "x")}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
      setMsg("Downloaded still");
    } catch {
      setMsg("Download failed");
    }
  };

  const makeClip = async () => {
    setClipping(true);
    setMsg("");
    setVideo("");
    try {
      const res = await fetch("/api/admin/x-drop/clip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature, aspect, id: picked }),
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Clip failed");
      setVideo(data.video || "");
      setStill(data.still || "");
      setMsg("Clip ready");
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setClipping(false);
    }
  };

  const field = "w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-neutral-800 text-sm";
  const btn = "px-3 py-2 rounded-lg border border-neutral-700 text-xs";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-900/35 bg-gradient-to-b from-amber-950/20 to-[#111] p-4 sm:p-5 space-y-3">
        <p className="text-sm text-neutral-100 font-medium">Drop for X</p>
        <p className="text-xs text-neutral-500 leading-relaxed">
          Pick a room. We render an original card from live Den content — house portraits, Floor
          pairs, Afterimage locks. Download the still, copy the caption, post it yourself. The
          optional 5s clip spends Grok video credits.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {DROP_FEATURES.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFeature(f.id)}
              className={`px-3 py-1.5 rounded-full text-[11px] uppercase tracking-wide border ${
                feature === f.id
                  ? "border-amber-400/60 text-amber-100"
                  : "border-neutral-800 text-neutral-500"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <select value={aspect} onChange={(e) => setAspect(e.target.value)} className={field}>
            <option value="16:9">16:9</option>
            <option value="4:5">4:5</option>
            <option value="9:16">9:16</option>
          </select>
          <select value={heat} onChange={(e) => setHeat(e.target.value)} className={field}>
            {X_HEATS.map((h) => (
              <option key={h.id} value={h.id}>
                {h.label}
              </option>
            ))}
          </select>
          <select value={signoff} onChange={(e) => setSignoff(e.target.value)} className={field}>
            {SIGNOFFS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <button type="button" onClick={draft} disabled={busy} className="px-3 py-2 rounded-lg bg-amber-400 text-black text-xs font-semibold disabled:opacity-40">
            {busy ? "Writing…" : "Draft caption"}
          </button>
        </div>
      </div>

      {feature === "ftd" && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-[280px] overflow-y-auto">
          {cards.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setPicked(c.id)}
              className={`rounded-xl overflow-hidden border text-left ${
                picked === c.id ? "border-amber-400/70" : "border-neutral-800"
              }`}
            >
              {c.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.image_url} alt="" className="w-full aspect-[3/4] object-cover" />
              ) : (
                <div className="aspect-[3/4] bg-neutral-900" />
              )}
              <p className="px-2 py-1 text-[10px] text-neutral-400 truncate">@{c.username}</p>
            </button>
          ))}
        </div>
      )}

      {feature === "afterimage" && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-[280px] overflow-y-auto">
          {prints.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPicked(p.id)}
              className={`rounded-xl overflow-hidden border text-left ${
                picked === p.id ? "border-amber-400/70" : "border-neutral-800"
              }`}
            >
              {p.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image_url} alt="" className="w-full aspect-[9/16] object-cover" />
              ) : (
                <div className="aspect-[9/16] bg-neutral-900" />
              )}
              <p className="px-2 py-1 text-[10px] text-neutral-400 truncate">@{p.username || "den"}</p>
            </button>
          ))}
        </div>
      )}

      {feature === "floor" && (
        <div className="space-y-2">
          {pairs.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPicked(p.id)}
              className={`w-full text-left rounded-xl border p-3 text-sm ${
                picked === p.id ? "border-amber-400/70" : "border-neutral-800"
              }`}
            >
              <p className="text-neutral-200">{p.a}</p>
              <p className="text-neutral-500 mt-1">{p.b}</p>
            </button>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-4 space-y-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cardUrl}
          alt="Drop card"
          className={`w-full rounded-xl border border-neutral-800 object-cover ${
            aspect === "9:16"
              ? "max-w-[240px] mx-auto aspect-[9/16]"
              : aspect === "4:5"
                ? "max-w-[360px] mx-auto aspect-[4/5]"
                : "aspect-[16/9]"
          }`}
        />
        <textarea
          value={post}
          onChange={(e) => setPost(e.target.value)}
          rows={5}
          className={field + " font-medium leading-relaxed"}
          placeholder="Caption lands here"
        />
        {msg && <p className="text-xs text-amber-200">{msg}</p>}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={downloadStill} className={btn}>
            Download still
          </button>
          <button type="button" onClick={copy} disabled={!post} className={btn}>
            Copy caption
          </button>
          <button type="button" onClick={logDrop} disabled={!post} className={btn}>
            Save to X log
          </button>
          <button
            type="button"
            onClick={makeClip}
            disabled={clipping}
            className="px-3 py-2 rounded-lg border border-violet-700/50 text-violet-100 text-xs disabled:opacity-40"
          >
            {clipping ? "Rendering clip…" : "Make 5s clip"}
          </button>
        </div>
        {video ? (
          <video src={video} controls className="w-full rounded-xl border border-neutral-800" />
        ) : null}
        {still && !video ? (
          <p className="text-[11px] text-neutral-600 break-all">Still stored: {still}</p>
        ) : null}
      </div>
    </div>
  );
}
