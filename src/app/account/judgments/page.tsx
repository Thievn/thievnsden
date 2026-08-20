"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type Judgment = {
  id: string;
  style: string;
  focus: string;
  score: number;
  rarity: string;
  verdict: string;
  is_public?: boolean;
  created_at: string;
};

export default function MyJudgmentsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Judgment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch(`/api/judgments?userId=${session.user.id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not load");
        setItems(data.judgments || []);
      } catch (err: any) {
        setError(err.message || "Could not load judgments");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="mb-8">
        <Link href="/account" className="text-xs text-neutral-500 hover:text-neutral-300">
          ← Account
        </Link>
        <h1 className="text-2xl font-semibold text-neutral-50 mt-2">My judgments</h1>
        <p className="text-neutral-500 text-sm mt-1">Results you’ve saved to the Den.</p>
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
        {items.map((j) => (
          <div key={j.id} className="rounded-xl border border-neutral-800/80 bg-[#111] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wide text-neutral-500">
                {j.rarity} · {Number(j.score).toFixed(1)}/10
              </span>
              <span className="text-[11px] text-neutral-600">
                {new Date(j.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-neutral-300 leading-relaxed">{j.verdict}</p>
            <div className="mt-2 flex gap-2 text-[10px] uppercase tracking-wide text-neutral-600">
              <span>{j.style}</span>
              <span>·</span>
              <span>{j.focus}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
