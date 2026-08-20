"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Demo = {
  id: string;
  username: string;
  style: string;
  focus: string;
  filthy_mode?: string | null;
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
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [makePublic, setMakePublic] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/seeds");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setDemos(data.demos || []);
    } catch (err: any) {
      setMsg(err.message || "Could not load demos");
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const seed = async (count: number) => {
    setBusy(true);
    setFailed(false);
    setMsg("Generating selfie + vision roast — wait 30–90s. Nothing posts without a real image.");
    try {
      const res = await fetch("/api/admin/seeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count, makePublic }),
      });
      const data = await res.json();

      if (!res.ok || !data.success || data.created === 0) {
        setFailed(true);
        const detail =
          data.error ||
          (data.errors && data.errors.join(" | ")) ||
          "Seed failed — no incomplete cards were saved.";
        setMsg(`FAILED: ${detail}`);
        return;
      }

      let line = `OK — created ${data.created} full demo${data.created === 1 ? "" : "s"} with images`;
      if (data.errors?.length) {
        line += ` · ${data.errors.length} failed: ${data.errors.join(" | ")}`;
        setFailed(true);
      }
      if (makePublic) line += " · posted to Gallery";
      setMsg(line);
      await load();
    } catch (err: any) {
      setFailed(true);
      setMsg(
        `FAILED: ${err.message || "network/timeout"}. Check Vercel logs. Nothing half-saved.`
      );
    } finally {
      setBusy(false);
    }
  };

  const purge = async () => {
    if (!confirm("Delete ALL demo users, images, and judgments?")) return;
    setBusy(true);
    setMsg(null);
    setFailed(false);
    try {
      const res = await fetch("/api/admin/seeds", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Purge failed");
      setMsg(`Purged ${data.purgedJudgments} judgments · ${data.purgedUsers} users`);
      await load();
    } catch (err: any) {
      setFailed(true);
      setMsg(`FAILED: ${err.message || "Purge failed"}`);
    } finally {
      setBusy(false);
    }
  };

  const regen = async (id: string, action: "image" | "verdict") => {
    setRowBusy(id + ":" + action);
    setFailed(false);
    setMsg(
      action === "image"
        ? "Regenerating image + matching judgment…"
        : "Regenerating judgment for existing pic…"
    );
    try {
      const res = await fetch(`/api/admin/seeds/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Regen failed");
      setMsg(action === "image" ? "Image + judgment updated." : "Judgment updated.");
      await load();
    } catch (err: any) {
      setFailed(true);
      setMsg(`FAILED: ${err.message || "Regen failed"}`);
    } finally {
      setRowBusy(null);
    }
  };

  const deleteOne = async (id: string, username: string) => {
    if (!confirm(`Delete demo “${username}” permanently?`)) return;
    setRowBusy(id + ":del");
    setFailed(false);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/seeds/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setMsg(`Deleted ${username}.`);
      await load();
    } catch (err: any) {
      setFailed(true);
      setMsg(`FAILED: ${err.message || "Delete failed"}`);
    } finally {
      setRowBusy(null);
    }
  };

  const anyBusy = busy || !!rowBusy;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5 space-y-4">
        <div>
          <p className="text-sm text-neutral-200 font-medium mb-1">Seeds lab</p>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Full pipeline only: Imagine selfie → Storage → vision roast → Gallery.
            Per-demo: regen pic, regen judgment, or delete one.
          </p>
        </div>

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
            disabled={anyBusy}
            className="px-4 py-2.5 rounded-xl text-sm border border-purple-800/50 text-purple-300 hover:bg-purple-950/30 disabled:opacity-40"
          >
            {busy ? "Generating…" : "Random demo"}
          </button>
          <button
            onClick={() => seed(3)}
            disabled={anyBusy}
            className="px-4 py-2.5 rounded-xl text-sm border border-neutral-800 text-neutral-300 hover:border-neutral-600 disabled:opacity-40"
          >
            Random ×3
          </button>
          <button
            onClick={purge}
            disabled={anyBusy || demos.length === 0}
            className="px-4 py-2.5 rounded-xl text-sm border border-red-900/50 text-red-400/90 hover:bg-red-950/20 disabled:opacity-40"
          >
            Purge all demos
          </button>
          <Link
            href="/gallery"
            className="px-4 py-2.5 rounded-xl text-sm border border-neutral-800 text-neutral-400 hover:text-neutral-200"
          >
            Open Gallery
          </Link>
        </div>

        {msg && (
          <p
            className={`text-xs rounded-lg px-3 py-2 break-words border ${
              failed
                ? "border-red-900/50 bg-red-950/20 text-red-300"
                : "border-neutral-800 text-neutral-300"
            }`}
          >
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
            <p className="text-sm text-neutral-500">No demos yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {demos.map((d) => {
              const working = rowBusy?.startsWith(d.id);
              return (
                <div
                  key={d.id}
                  className="rounded-2xl border border-neutral-800/80 bg-[#111] p-4 space-y-3"
                >
                  <div className="flex gap-3">
                    <div className="w-14 h-[74px] rounded-lg overflow-hidden border border-neutral-800 bg-black shrink-0">
                      {d.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={d.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[9px] text-red-400/80">
                          no img
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
                      <p className="text-[10px] uppercase tracking-wide text-neutral-600 mb-1">
                        {d.style}
                        {d.filthy_mode ? ` · ${d.filthy_mode}` : ""} · {d.focus}
                      </p>
                      <p className="text-sm text-neutral-300 leading-relaxed line-clamp-2">
                        {d.verdict}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => regen(d.id, "image")}
                      disabled={anyBusy}
                      className="px-3 py-1.5 rounded-lg text-[11px] border border-purple-900/40 text-purple-300/90 hover:bg-purple-950/25 disabled:opacity-40"
                    >
                      {rowBusy === d.id + ":image" ? "Regen pic…" : "Regen pic"}
                    </button>
                    <button
                      onClick={() => regen(d.id, "verdict")}
                      disabled={anyBusy || !d.image_url}
                      className="px-3 py-1.5 rounded-lg text-[11px] border border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-neutral-200 disabled:opacity-40"
                    >
                      {rowBusy === d.id + ":verdict" ? "Regen text…" : "Regen judgment"}
                    </button>
                    <button
                      onClick={() => deleteOne(d.id, d.username)}
                      disabled={anyBusy}
                      className="px-3 py-1.5 rounded-lg text-[11px] border border-red-900/40 text-red-400/90 hover:bg-red-950/20 disabled:opacity-40"
                    >
                      {rowBusy === d.id + ":del" ? "Deleting…" : "Delete"}
                    </button>
                    {working && (
                      <span className="text-[11px] text-neutral-600 self-center">Working…</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
