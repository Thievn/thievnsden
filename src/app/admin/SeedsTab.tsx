"use client";

import { useEffect, useState } from "react";

type Demo = {
  id: string;
  username: string;
  style: string;
  focus: string;
  score: number;
  rarity: string;
  verdict: string;
  image_url?: string | null;
  is_public: boolean;
  likes: number;
  dislikes: number;
  created_at: string;
};

export function SeedsTab() {
  const [demos, setDemos] = useState<Demo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [makePublic, setMakePublic] = useState(true);
  const [withImage, setWithImage] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/seeds");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setDemos(data.demos || []);
    } catch (err: any) {
      setMsg(err.message || "Could not load demos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const seed = async (count: number) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/seeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count, makePublic, withImage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Seed failed");
      setMsg(
        `Created ${data.created} demo${data.created === 1 ? "" : "s"}` +
          (data.errors?.length ? ` · ${data.errors.length} error(s): ${data.errors[0]}` : "")
      );
      await load();
    } catch (err: any) {
      setMsg(err.message || "Seed failed");
    } finally {
      setBusy(false);
    }
  };

  const purge = async () => {
    if (!confirm("Delete ALL demo users, images, and judgments?")) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/seeds", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Purge failed");
      setMsg(`Purged ${data.purgedJudgments} judgments · ${data.purgedUsers} users`);
      await load();
    } catch (err: any) {
      setMsg(err.message || "Purge failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5 space-y-4">
        <div>
          <p className="text-sm text-neutral-200 font-medium mb-1">Seeds lab</p>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Generates a selfie (Imagine 1K · 3:4), uploads to Storage, then vision-roasts the real
            image so the judgment matches. Uses your XAI key — ~$0.02+/image plus roast tokens.
          </p>
        </div>

        <label className="flex items-center justify-between gap-3">
          <span className="text-sm text-neutral-300">Generate image + vision roast</span>
          <input
            type="checkbox"
            checked={withImage}
            onChange={(e) => setWithImage(e.target.checked)}
            className="w-4 h-4 accent-purple-600"
          />
        </label>

        <label className="flex items-center justify-between gap-3">
          <span className="text-sm text-neutral-300">Auto-post to Gallery</span>
          <input
            type="checkbox"
            checked={makePublic}
            onChange={(e) => setMakePublic(e.target.checked)}
            className="w-4 h-4 accent-purple-600"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => seed(1)}
            disabled={busy}
            className="px-4 py-2.5 rounded-xl text-sm border border-purple-800/50 text-purple-300 hover:bg-purple-950/30 disabled:opacity-40"
          >
            {busy ? "Generating…" : "Random demo"}
          </button>
          <button
            onClick={() => seed(3)}
            disabled={busy}
            className="px-4 py-2.5 rounded-xl text-sm border border-neutral-800 text-neutral-300 hover:border-neutral-600 disabled:opacity-40"
          >
            Random ×3
          </button>
          <button
            onClick={purge}
            disabled={busy || demos.length === 0}
            className="px-4 py-2.5 rounded-xl text-sm border border-red-900/50 text-red-400/90 hover:bg-red-950/20 disabled:opacity-40"
          >
            Purge all demos
          </button>
        </div>

        {msg && (
          <p className="text-xs text-neutral-400 border border-neutral-800 rounded-lg px-3 py-2 break-words">
            {msg}
          </p>
        )}
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-neutral-500 mb-3">
          Demo library ({demos.length})
        </p>
        {loading ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : demos.length === 0 ? (
          <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-8 text-center">
            <p className="text-sm text-neutral-500">No demos yet. Hit Random demo.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {demos.map((d) => (
              <div
                key={d.id}
                className="rounded-2xl border border-neutral-800/80 bg-[#111] p-4 flex gap-3"
              >
                <div className="w-14 h-[74px] rounded-lg overflow-hidden border border-neutral-800 bg-black shrink-0">
                  {d.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-br from-red-500 to-purple-500 opacity-50" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-neutral-500">
                      <span className="text-neutral-300">{d.username}</span>
                      <span>·</span>
                      <span>{d.rarity}</span>
                      <span>·</span>
                      <span>{Number(d.score).toFixed(1)}/10</span>
                      {d.is_public && <span className="text-purple-400/80">gallery</span>}
                    </div>
                    <span className="text-[11px] text-neutral-600">
                      ↑ {d.likes || 0} · ↓ {d.dislikes || 0}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-300 leading-relaxed line-clamp-2">{d.verdict}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
