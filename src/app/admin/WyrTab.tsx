"use client";

import { useEffect, useState } from "react";
import type { WyrHeat, WyrPack, WyrPair } from "@/lib/wyr-data";
import { WYR_PACKS } from "@/lib/wyr-map";
import { WYR_TOPICS } from "@/lib/wyr-topics";

export function WyrTab() {
  const [pairs, setPairs] = useState<WyrPair[]>([]);
  const [count, setCount] = useState(0);
  const [topics, setTopics] = useState<Record<string, number>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [heat, setHeat] = useState<WyrHeat>("nasty");
  const [pack, setPack] = useState<WyrPack>("people");
  const [topic, setTopic] = useState("lust");

  const load = async () => {
    const res = await fetch("/api/admin/wyr");
    const data = await res.json();
    if (data.error && !data.pairs?.length) {
      setFailed(true);
      setMsg(data.hint || data.error);
    }
    setPairs(data.pairs || []);
    setCount(data.count || data.pairs?.length || 0);
    setTopics(data.topics || {});
  };

  useEffect(() => {
    load();
  }, []);

  const rewriteStings = async () => {
    setBusy(true);
    setFailed(false);
    try {
      const res = await fetch("/api/admin/wyr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rewrite-stings" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.hint || data.error || "Rewrite failed");
      setMsg(`Rewrote ${data.updated} host lines (${data.matched} matched).`);
      await load();
    } catch (err: any) {
      setFailed(true);
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  const generate = async () => {
    setBusy(true);
    setFailed(false);
    try {
      const res = await fetch("/api/admin/wyr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", count: 16 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.hint || data.error || "Generate failed");
      setMsg(`Inserted ${data.inserted} new pairs into the pool.`);
      await load();
    } catch (err: any) {
      setFailed(true);
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  const add = async () => {
    if (!a.trim() || !b.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/wyr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ a, b, heat, packs: [pack], topic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Add failed");
      setA("");
      setB("");
      setMsg("Added.");
      await load();
    } catch (err: any) {
      setFailed(true);
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  const kill = async (id: string) => {
    if (!confirm("Delete this pair?")) return;
    await fetch(`/api/admin/wyr/${id}`, { method: "DELETE" });
    await load();
  };

  const hide = async (id: string) => {
    await fetch(`/api/admin/wyr/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: false }),
    });
    await load();
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5 space-y-3">
        <p className="text-sm text-neutral-200 font-medium">The Floor pool</p>
        <p className="text-xs text-neutral-500 leading-relaxed">
          Play deals 10 from this table. Live Grok is not used per round. Refill adds 16
          new pairs in the background if the pool gets thin.
        </p>
        <p className="text-sm text-neutral-300">
          {count} active · {Object.keys(topics).length} topics
        </p>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(topics)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 16)
            .map(([t, n]) => (
              <span
                key={t}
                className="text-[10px] uppercase tracking-wide px-2 py-1 rounded-full border border-neutral-800 text-neutral-400"
              >
                {t} {n}
              </span>
            ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={generate}
            disabled={busy}
            className="px-4 py-2.5 rounded-xl text-sm border border-amber-800/50 text-amber-200 disabled:opacity-40"
          >
            {busy ? "Generating…" : "Refill 16 from Grok"}
          </button>
          <button
            type="button"
            onClick={rewriteStings}
            disabled={busy}
            className="px-4 py-2.5 rounded-xl text-sm border border-neutral-700 text-neutral-200 disabled:opacity-40"
          >
            Rewrite lazy stings
          </button>
        </div>
        {msg && (
          <p className={`text-xs ${failed ? "text-red-300" : "text-neutral-400"}`}>{msg}</p>
        )}
      </div>

      <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5 space-y-3">
        <p className="text-xs uppercase tracking-wide text-neutral-500">Add pair</p>
        <textarea
          value={a}
          onChange={(e) => setA(e.target.value)}
          placeholder="Side A"
          rows={2}
          className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200"
        />
        <textarea
          value={b}
          onChange={(e) => setB(e.target.value)}
          placeholder="Side B"
          rows={2}
          className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200"
        />
        <div className="grid grid-cols-3 gap-2">
          <select
            value={heat}
            onChange={(e) => setHeat(e.target.value as WyrHeat)}
            className="px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200"
          >
            <option value="clean">clean</option>
            <option value="spicy">spicy</option>
            <option value="nasty">nasty</option>
          </select>
          <select
            value={pack}
            onChange={(e) => setPack(e.target.value as WyrPack)}
            className="px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200"
          >
            {WYR_PACKS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200"
          >
            {WYR_TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={add}
          disabled={busy || !a.trim() || !b.trim()}
          className="px-4 py-2.5 rounded-xl text-sm border border-neutral-700 text-neutral-200 disabled:opacity-40"
        >
          Add to database
        </button>
      </div>

      <p className="text-xs text-neutral-500">Latest {pairs.length} pairs</p>
      <div className="space-y-2">
        {pairs.slice(0, 120).map((p) => (
          <div key={p.id} className="rounded-xl border border-neutral-800 bg-[#111] p-3 space-y-1">
            <p className="text-sm text-neutral-200">{p.a}</p>
            <p className="text-sm text-neutral-400">{p.b}</p>
            <p className="text-[10px] uppercase tracking-wide text-neutral-600">
              {p.heat} · {p.topic || "—"} vs {p.topicB || "—"} · {p.packs.join(", ")}
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => hide(p.id)}
                className="text-[11px] text-neutral-500 hover:text-neutral-300"
              >
                Hide
              </button>
              <button
                type="button"
                onClick={() => kill(p.id)}
                className="text-[11px] text-red-400/80 hover:text-red-300"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
