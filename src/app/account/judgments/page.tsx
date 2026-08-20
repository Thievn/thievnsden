"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { getRarity } from "@/lib/gallery";

type Judgment = {
  id: string;
  style: string;
  focus: string;
  score: number;
  rarity: string;
  verdict: string;
  image_url?: string | null;
  is_public: boolean;
  likes?: number;
  dislikes?: number;
  created_at: string;
};

export default function MyJudgmentsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Judgment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async (uid: string) => {
    const res = await fetch(`/api/judgments?userId=${uid}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not load");
    setItems(data.judgments || []);
  };

  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push("/login");
        return;
      }

      setUserId(session.user.id);

      try {
        await load(session.user.id);
      } catch (err: any) {
        setError(err.message || "Could not load judgments");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const setPublic = async (id: string, is_public: boolean) => {
    if (!userId) return;
    setBusyId(id);
    try {
      const res = await fetch("/api/judgments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ judgmentId: id, userId, is_public }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setItems((prev) =>
        prev.map((j) => (j.id === id ? { ...j, is_public } : j))
      );
    } catch (err: any) {
      alert(err.message || "Could not update");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    if (!userId) return;
    if (!confirm("Delete this judgment permanently?")) return;
    setBusyId(id);
    try {
      const res = await fetch("/api/judgments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ judgmentId: id, userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setItems((prev) => prev.filter((j) => j.id !== id));
    } catch (err: any) {
      alert(err.message || "Could not delete");
    } finally {
      setBusyId(null);
    }
  };

  const copyShare = async (id: string) => {
    const url = `${window.location.origin}/g/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      alert("Link copied");
    } catch {
      prompt("Copy link:", url);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="mb-8">
        <Link href="/account" className="text-xs text-neutral-500 hover:text-neutral-300">
          ← Account
        </Link>
        <h1 className="text-2xl font-semibold text-neutral-50 mt-2">My judgments</h1>
        <p className="text-neutral-500 text-sm mt-1">
          Private by default. Post one to the Gallery when you want it public.
        </p>
      </div>

      {loading && <p className="text-neutral-500 text-sm">Loading…</p>}

      {error && (
        <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-300 mb-4">
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-8 text-center">
          <p className="text-neutral-500 text-sm mb-2">No saved judgments yet.</p>
          <p className="text-neutral-600 text-xs mb-4">
            Face The Den while logged in, then hit Save.
          </p>
          <Link
            href="/playground"
            className="text-sm text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400"
          >
            Face The Den →
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {items.map((j) => {
          const rarity = getRarity(Number(j.score));
          return (
            <div
              key={j.id}
              className={`rounded-xl border bg-[#111] p-4 ${rarity.border} ${rarity.glow}`}
            >
              <div className="flex items-center justify-between mb-2 gap-2">
                <span className={`text-xs uppercase tracking-wide ${rarity.text}`}>
                  {j.rarity} · {Number(j.score).toFixed(1)}/10
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border ${
                      j.is_public
                        ? "border-purple-800/50 text-purple-300 bg-purple-950/30"
                        : "border-neutral-800 text-neutral-600"
                    }`}
                  >
                    {j.is_public ? "Gallery" : "Private"}
                  </span>
                  <span className="text-[11px] text-neutral-600">
                    {new Date(j.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <p className="text-sm text-neutral-300 leading-relaxed">{j.verdict}</p>

              <div className="mt-2 flex gap-2 text-[10px] uppercase tracking-wide text-neutral-600">
                <span>{j.style}</span>
                <span>·</span>
                <span>{j.focus}</span>
                {(j.likes != null || j.dislikes != null) && j.is_public && (
                  <>
                    <span>·</span>
                    <span>
                      ↑ {j.likes || 0} · ↓ {j.dislikes || 0}
                    </span>
                  </>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {j.is_public ? (
                  <>
                    <button
                      onClick={() => setPublic(j.id, false)}
                      disabled={busyId === j.id}
                      className="px-3 py-1.5 rounded-lg text-xs border border-neutral-800 text-neutral-400 hover:text-neutral-200 disabled:opacity-40"
                    >
                      Make private
                    </button>
                    <Link
                      href={`/g/${j.id}`}
                      className="px-3 py-1.5 rounded-lg text-xs border border-neutral-800 text-neutral-400 hover:text-neutral-200"
                    >
                      Open card
                    </Link>
                    <button
                      onClick={() => copyShare(j.id)}
                      className="px-3 py-1.5 rounded-lg text-xs border border-purple-800/40 text-purple-300 hover:bg-purple-950/20"
                    >
                      Copy share link
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setPublic(j.id, true)}
                    disabled={busyId === j.id}
                    className="px-3 py-1.5 rounded-lg text-xs border border-purple-800/50 text-purple-300 hover:bg-purple-950/30 disabled:opacity-40"
                  >
                    Post to Gallery
                  </button>
                )}
                <button
                  onClick={() => remove(j.id)}
                  disabled={busyId === j.id}
                  className="px-3 py-1.5 rounded-lg text-xs border border-red-900/40 text-red-400/90 hover:bg-red-950/20 disabled:opacity-40"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
