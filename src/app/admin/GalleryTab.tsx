"use client";

import { useEffect, useState } from "react";
import { BarList } from "@/components/admin/Charts";

type Card = {
  id: string;
  username: string;
  style: string;
  focus: string;
  score: number;
  rarity: string;
  verdict: string;
  likes: number;
  dislikes: number;
  is_demo: boolean;
  is_public: boolean;
  ratio: number | null;
  created_at: string;
};

type Stats = {
  publicCount: number;
  totalLikes: number;
  totalDislikes: number;
  demoCount: number;
  realCount: number;
};

export function GalleryTab() {
  const [cards, setCards] = useState<Card[]>([]);
  const [topLiked, setTopLiked] = useState<Card[]>([]);
  const [topDisliked, setTopDisliked] = useState<Card[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/gallery");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setCards(data.cards || []);
      setTopLiked(data.topLiked || []);
      setTopDisliked(data.topDisliked || []);
      setStats(data.stats || null);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Could not load gallery stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const unpublish = async (id: string) => {
    setBusy(id);
    try {
      const res = await fetch("/api/admin/gallery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ judgmentId: id, is_public: false }),
      });
      if (!res.ok) throw new Error("Failed");
      await load();
    } catch {
      alert("Could not unpublish");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this gallery card permanently?")) return;
    setBusy(id);
    try {
      const res = await fetch("/api/admin/gallery", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ judgmentId: id }),
      });
      if (!res.ok) throw new Error("Failed");
      await load();
    } catch {
      alert("Could not delete");
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return <p className="text-sm text-neutral-500">Loading gallery stats…</p>;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-900/40 bg-red-950/20 p-5 text-sm text-red-300">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Public cards", value: stats?.publicCount ?? 0 },
          { label: "Total likes", value: stats?.totalLikes ?? 0 },
          { label: "Total dislikes", value: stats?.totalDislikes ?? 0 },
          {
            label: "House / real",
            value: `${stats?.demoCount ?? 0} / ${stats?.realCount ?? 0}`,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-neutral-800/80 bg-[#111] p-4"
          >
            <p className="text-[10px] uppercase tracking-wide text-neutral-500 mb-1">{s.label}</p>
            <p className="text-xl font-semibold text-neutral-100 tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5">
          <p className="text-xs uppercase tracking-wide text-neutral-500 mb-4">Top liked</p>
          <BarList
            data={topLiked.map((c) => ({
              label: `${c.username} (${Number(c.score).toFixed(1)})`,
              value: c.likes || 0,
            }))}
            color="from-purple-600 to-purple-400"
          />
        </div>
        <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5">
          <p className="text-xs uppercase tracking-wide text-neutral-500 mb-4">Top disliked</p>
          <BarList
            data={topDisliked.map((c) => ({
              label: `${c.username} (${Number(c.score).toFixed(1)})`,
              value: c.dislikes || 0,
            }))}
            color="from-red-600 to-red-400"
          />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-wide text-neutral-500">All public cards</p>
        {cards.length === 0 ? (
          <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-8 text-center">
            <p className="text-sm text-neutral-500">No public gallery cards yet.</p>
          </div>
        ) : (
          cards.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border border-neutral-800/80 bg-[#111] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-neutral-500">
                  <span className="text-neutral-300">{c.username}</span>
                  <span>·</span>
                  <span>{c.rarity}</span>
                  <span>·</span>
                  <span>{Number(c.score).toFixed(1)}/10</span>
                  {c.is_demo && (
                    <span className="text-amber-500/80 border border-amber-900/40 px-1 rounded">
                      house
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-neutral-500">
                  ↑ {c.likes || 0} · ↓ {c.dislikes || 0}
                  {c.ratio != null && (
                    <span className="text-neutral-600"> · {(c.ratio * 100).toFixed(0)}% like</span>
                  )}
                </span>
              </div>
              <p className="text-sm text-neutral-300 leading-relaxed mb-3 line-clamp-2">
                {c.verdict}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => unpublish(c.id)}
                  disabled={busy === c.id}
                  className="px-3 py-1.5 rounded-lg text-xs border border-neutral-800 text-neutral-400 hover:text-neutral-200 disabled:opacity-40"
                >
                  Unpublish
                </button>
                <button
                  onClick={() => remove(c.id)}
                  disabled={busy === c.id}
                  className="px-3 py-1.5 rounded-lg text-xs border border-red-900/50 text-red-400/90 hover:bg-red-950/30 disabled:opacity-40"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
