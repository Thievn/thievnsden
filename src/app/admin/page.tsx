"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { isAdmin } from "@/lib/admin";
import type { User } from "@supabase/supabase-js";

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: 0,
    judgments: 0,
    avgScore: 0,
  });

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user || !isAdmin(session.user)) {
        router.push("/");
        return;
      }
      setUser(session.user);

      // Basic counts via service would be better — for now client-safe public counts where possible
      // Full stats come in Phase 3 via admin API routes
      setLoading(false);
    })();
  }, [router]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center text-neutral-500 text-sm">
        Checking access…
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">☠</span>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-purple-400">
            Admin
          </h1>
        </div>
        <p className="text-neutral-500 text-sm">
          Full control of the Den. Only you see this.
        </p>
      </div>

      {/* Quick stats placeholders */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        {[
          { label: "Users", value: "—", sub: "Phase 2" },
          { label: "Judgments", value: "—", sub: "Phase 2" },
          { label: "Avg score", value: "—", sub: "Phase 3" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5"
          >
            <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">{s.label}</p>
            <p className="text-2xl font-semibold text-neutral-100">{s.value}</p>
            <p className="text-[11px] text-neutral-600 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Nav cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5 opacity-60">
          <p className="text-sm font-medium text-neutral-300 mb-1">Users</p>
          <p className="text-xs text-neutral-500">View, ban, edit usernames — Phase 2</p>
        </div>
        <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5 opacity-60">
          <p className="text-sm font-medium text-neutral-300 mb-1">Judgments</p>
          <p className="text-xs text-neutral-500">Moderate, delete, filter — Phase 2</p>
        </div>
        <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5 opacity-60">
          <p className="text-sm font-medium text-neutral-300 mb-1">Analytics</p>
          <p className="text-xs text-neutral-500">Graphs, rarity, activity — Phase 3</p>
        </div>
        <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5 opacity-60">
          <p className="text-sm font-medium text-neutral-300 mb-1">Site controls</p>
          <p className="text-xs text-neutral-500">Toggles, banners, maintenance — Phase 4</p>
        </div>
      </div>

      <p className="mt-10 text-center text-xs text-neutral-600">
        Phase 1 complete · Admin gate active for Thievn only
      </p>
    </div>
  );
}
