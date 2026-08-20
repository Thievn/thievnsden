"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { isAdmin } from "@/lib/admin";
import type { User } from "@supabase/supabase-js";

type Tab = "overview" | "users" | "judgments";

type AdminUser = {
  id: string;
  username: string;
  email: string;
  created_at: string;
  judgment_count: number;
};

type AdminJudgment = {
  id: string;
  user_id: string | null;
  username: string;
  style: string;
  focus: string;
  score: number;
  rarity: string;
  verdict: string;
  is_public: boolean;
  created_at: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");

  const [stats, setStats] = useState({
    users: 0,
    judgments: 0,
    avgScore: 0,
    styleCounts: {} as Record<string, number>,
    focusCounts: {} as Record<string, number>,
    rarityCounts: {} as Record<string, number>,
  });

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [judgments, setJudgments] = useState<AdminJudgment[]>([]);
  const [search, setSearch] = useState("");
  const [filterStyle, setFilterStyle] = useState("");
  const [filterRarity, setFilterRarity] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user || !isAdmin(session.user)) {
        router.push("/");
        return;
      }
      setUser(session.user);
      setLoading(false);
      loadStats();
    })();
  }, [router]);

  const loadStats = async () => {
    const res = await fetch("/api/admin/stats");
    if (res.ok) {
      const data = await res.json();
      setStats(data);
    }
  };

  const loadUsers = async () => {
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users || []);
    }
  };

  const loadJudgments = async () => {
    const params = new URLSearchParams();
    if (filterStyle) params.set("style", filterStyle);
    if (filterRarity) params.set("rarity", filterRarity);
    const res = await fetch(`/api/admin/judgments?${params}`);
    if (res.ok) {
      const data = await res.json();
      setJudgments(data.judgments || []);
    }
  };

  useEffect(() => {
    if (tab === "users") loadUsers();
    if (tab === "judgments") loadJudgments();
  }, [tab, filterStyle, filterRarity]);

  const deleteUser = async (userId: string, username: string) => {
    if (!confirm(`Delete user "${username}" and all their judgments? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("Failed");
      await loadUsers();
      await loadStats();
    } catch {
      alert("Could not delete user.");
    } finally {
      setBusy(false);
    }
  };

  const nukeUserJudgments = async (userId: string, username: string) => {
    if (!confirm(`Delete ALL judgments from "${username}"?`)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/judgments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("Failed");
      await loadJudgments();
      await loadUsers();
      await loadStats();
    } catch {
      alert("Could not delete judgments.");
    } finally {
      setBusy(false);
    }
  };

  const deleteJudgment = async (id: string) => {
    if (!confirm("Delete this judgment?")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/judgments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ judgmentId: id }),
      });
      if (!res.ok) throw new Error("Failed");
      setJudgments((prev) => prev.filter((j) => j.id !== id));
      await loadStats();
    } catch {
      alert("Could not delete.");
    } finally {
      setBusy(false);
    }
  };

  const togglePublic = async (id: string, current: boolean) => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/judgments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ judgmentId: id, is_public: !current }),
      });
      if (!res.ok) throw new Error("Failed");
      setJudgments((prev) =>
        prev.map((j) => (j.id === id ? { ...j, is_public: !current } : j))
      );
    } catch {
      alert("Could not update.");
    } finally {
      setBusy(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

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
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">☠</span>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-purple-400">
            Admin
          </h1>
        </div>
        <p className="text-neutral-500 text-sm">Full control of the Den.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl bg-[#111] border border-neutral-800/80 w-fit">
        {(
          [
            { id: "overview", label: "Overview" },
            { id: "users", label: "Users" },
            { id: "judgments", label: "Judgments" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? "bg-gradient-to-r from-red-900/40 to-purple-900/40 text-neutral-100"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Users", value: stats.users },
              { label: "Judgments", value: stats.judgments },
              { label: "Avg score", value: stats.avgScore || "—" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5"
              >
                <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">{s.label}</p>
                <p className="text-2xl font-semibold text-neutral-100">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5">
              <p className="text-xs uppercase tracking-wide text-neutral-500 mb-3">Styles</p>
              {Object.keys(stats.styleCounts).length === 0 ? (
                <p className="text-sm text-neutral-600">No data yet</p>
              ) : (
                <div className="space-y-1.5">
                  {Object.entries(stats.styleCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([k, v]) => (
                      <div key={k} className="flex justify-between text-sm">
                        <span className="text-neutral-400 capitalize">{k}</span>
                        <span className="text-neutral-200">{v}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5">
              <p className="text-xs uppercase tracking-wide text-neutral-500 mb-3">Focus</p>
              {Object.keys(stats.focusCounts).length === 0 ? (
                <p className="text-sm text-neutral-600">No data yet</p>
              ) : (
                <div className="space-y-1.5">
                  {Object.entries(stats.focusCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([k, v]) => (
                      <div key={k} className="flex justify-between text-sm">
                        <span className="text-neutral-400 capitalize">{k}</span>
                        <span className="text-neutral-200">{v}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5">
              <p className="text-xs uppercase tracking-wide text-neutral-500 mb-3">Rarity</p>
              {Object.keys(stats.rarityCounts).length === 0 ? (
                <p className="text-sm text-neutral-600">No data yet</p>
              ) : (
                <div className="space-y-1.5">
                  {Object.entries(stats.rarityCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([k, v]) => (
                      <div key={k} className="flex justify-between text-sm">
                        <span className="text-neutral-400">{k}</span>
                        <span className="text-neutral-200">{v}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* USERS */}
      {tab === "users" && (
        <div className="space-y-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search username or email"
            className="w-full sm:w-72 px-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600"
          />

          <div className="rounded-2xl border border-neutral-800/80 bg-[#111] overflow-hidden">
            {filteredUsers.length === 0 ? (
              <p className="p-6 text-sm text-neutral-500">No users found.</p>
            ) : (
              <div className="divide-y divide-neutral-800/60">
                {filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-200 truncate">{u.username}</p>
                      <p className="text-xs text-neutral-500 truncate">{u.email || "—"}</p>
                      <p className="text-[11px] text-neutral-600 mt-0.5">
                        {u.judgment_count} judgments · joined{" "}
                        {new Date(u.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => nukeUserJudgments(u.id, u.username)}
                        disabled={busy || u.judgment_count === 0}
                        className="px-3 py-1.5 rounded-lg text-xs border border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 disabled:opacity-40"
                      >
                        Nuke content
                      </button>
                      <button
                        onClick={() => deleteUser(u.id, u.username)}
                        disabled={busy}
                        className="px-3 py-1.5 rounded-lg text-xs border border-red-900/50 text-red-400/90 hover:bg-red-950/30 disabled:opacity-40"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* JUDGMENTS */}
      {tab === "judgments" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <select
              value={filterStyle}
              onChange={(e) => setFilterStyle(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-300 focus:outline-none"
            >
              <option value="">All styles</option>
              {"honest unhinged filthy petty deadpan".split(" ").map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={filterRarity}
              onChange={(e) => setFilterRarity(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-300 focus:outline-none"
            >
              <option value="">All rarities</option>
              {"Trash Common Uncommon Rare Epic Legendary".split(" ").map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {judgments.length === 0 ? (
              <p className="text-sm text-neutral-500 p-4">No judgments found.</p>
            ) : (
              judgments.map((j) => (
                <div
                  key={j.id}
                  className="rounded-2xl border border-neutral-800/80 bg-[#111] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-neutral-500">
                      <span className="text-neutral-300">{j.username}</span>
                      <span>·</span>
                      <span>{j.rarity}</span>
                      <span>·</span>
                      <span>{Number(j.score).toFixed(1)}/10</span>
                      <span>·</span>
                      <span>{j.style}</span>
                      <span>·</span>
                      <span>{j.focus}</span>
                    </div>
                    <span className="text-[11px] text-neutral-600">
                      {new Date(j.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-300 leading-relaxed mb-3">{j.verdict}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => togglePublic(j.id, j.is_public)}
                      disabled={busy}
                      className="px-3 py-1.5 rounded-lg text-xs border border-neutral-800 text-neutral-400 hover:text-neutral-200 disabled:opacity-40"
                    >
                      {j.is_public ? "Hide" : "Make public"}
                    </button>
                    <button
                      onClick={() => deleteJudgment(j.id)}
                      disabled={busy}
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
      )}
    </div>
  );
}
