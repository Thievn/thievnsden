"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { isAdmin } from "@/lib/admin";
import { BarList, ActivityBars, RarityRing, ScoreBars } from "@/components/admin/Charts";
import { AnalyticsTab } from "@/app/admin/AnalyticsTab";
import { GalleryTab } from "@/app/admin/GalleryTab";
import { SeedsTab } from "@/app/admin/SeedsTab";
import type { User } from "@supabase/supabase-js";

type Tab =
  | "overview"
  | "traffic"
  | "gallery"
  | "seeds"
  | "users"
  | "judgments"
  | "controls"
  | "reports"
  | "audit";

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

type SiteSettings = {
  maintenance_mode: boolean;
  maintenance_message: string;
  announcement_enabled: boolean;
  announcement_text: string;
  age_gate_enabled: boolean;
  signup_enabled: boolean;
  roast_enabled: boolean;
  public_judgments_enabled: boolean;
};

type Report = {
  id: string;
  judgment_id: string | null;
  reason: string;
  notes: string;
  status: string;
  created_at: string;
};

type AuditEntry = {
  id: string;
  action: string;
  actor: string | null;
  target: string | null;
  details: string | null;
  created_at: string;
};

const RARITY_COLORS: Record<string, string> = {
  Legendary: "#fbbf24",
  Epic: "#ef4444",
  Rare: "#f43f5e",
  Uncommon: "#a855f7",
  Common: "#a3a3a3",
  Trash: "#525252",
};

const DEFAULT_SETTINGS: SiteSettings = {
  maintenance_mode: false,
  maintenance_message: "The Den is closed for a bit. Come back soon.",
  announcement_enabled: false,
  announcement_text: "",
  age_gate_enabled: true,
  signup_enabled: true,
  roast_enabled: true,
  public_judgments_enabled: false,
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
    judgmentsToday: 0,
    usersToday: 0,
    judgmentsWeek: 0,
    usersWeek: 0,
    styleCounts: {} as Record<string, number>,
    focusCounts: {} as Record<string, number>,
    rarityCounts: {} as Record<string, number>,
    scoreBuckets: {} as Record<string, number>,
    activity: [] as { label: string; judgments: number; users: number }[],
  });

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [judgments, setJudgments] = useState<AdminJudgment[]>([]);
  const [search, setSearch] = useState("");
  const [filterStyle, setFilterStyle] = useState("");
  const [filterRarity, setFilterRarity] = useState("");
  const [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

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
    if (res.ok) setStats(await res.json());
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
      setSelected(new Set());
    }
  };

  const loadSettings = async () => {
    const res = await fetch("/api/admin/settings");
    if (res.ok) {
      const data = await res.json();
      setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
    }
  };

  const loadReports = async () => {
    const res = await fetch("/api/admin/reports");
    if (res.ok) {
      const data = await res.json();
      setReports(data.reports || []);
    }
  };

  const loadAudit = async () => {
    const res = await fetch("/api/admin/audit");
    if (res.ok) {
      const data = await res.json();
      setAudit(data.entries || []);
    }
  };

  useEffect(() => {
    if (tab === "users") loadUsers();
    if (tab === "judgments") loadJudgments();
    if (tab === "controls") loadSettings();
    if (tab === "reports") loadReports();
    if (tab === "audit") loadAudit();
  }, [tab, filterStyle, filterRarity]);

  const saveSettings = async () => {
    setBusy(true);
    setSettingsMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSettingsMsg("Settings saved.");
    } catch (err: any) {
      setSettingsMsg(err.message || "Could not save.");
    } finally {
      setBusy(false);
    }
  };

  const deleteUser = async (userId: string, username: string) => {
    if (!confirm(`Delete user "${username}" and all their judgments?`)) return;
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

  const resetPassword = async (userId: string, username: string) => {
    if (!confirm(`Send password reset for "${username}"?`)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "reset_password" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      if (data.link) prompt("Recovery link (copy it):", data.link);
      else alert(data.message || "Reset sent.");
    } catch (err: any) {
      alert(err.message || "Could not reset password.");
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

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} selected judgments?`)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/judgments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ judgmentIds: [...selected] }),
      });
      if (!res.ok) throw new Error("Failed");
      await loadJudgments();
      await loadStats();
    } catch {
      alert("Bulk delete failed.");
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

  const flagJudgment = async (id: string) => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judgment_id: id,
          reason: "admin_flag",
          notes: "Flagged from admin panel",
        }),
      });
      if (!res.ok) throw new Error("Failed");
      alert("Flagged.");
    } catch {
      alert("Could not flag.");
    } finally {
      setBusy(false);
    }
  };

  const resolveReport = async (id: string) => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "resolved" }),
      });
      if (!res.ok) throw new Error("Failed");
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "resolved" } : r))
      );
    } catch {
      alert("Could not resolve.");
    } finally {
      setBusy(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === judgments.length) setSelected(new Set());
    else setSelected(new Set(judgments.map((j) => j.id)));
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const rarityRingData = ["Legendary", "Epic", "Rare", "Uncommon", "Common", "Trash"].map(
    (label) => ({
      label,
      value: stats.rarityCounts[label] || 0,
      color: RARITY_COLORS[label] || "#525252",
    })
  );

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center text-neutral-500 text-sm">
        Checking access…
      </div>
    );
  }

  if (!user) return null;

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "traffic" as const, label: "Traffic" },
    { id: "gallery" as const, label: "Gallery" },
    { id: "seeds" as const, label: "Seeds" },
    { id: "users" as const, label: "Users" },
    { id: "judgments" as const, label: "Judgments" },
    { id: "controls" as const, label: "Controls" },
    { id: "reports" as const, label: "Reports" },
    { id: "audit" as const, label: "Audit" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">☠</span>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-purple-400">
              Admin
            </h1>
          </div>
          <p className="text-neutral-500 text-sm">Full control of the Den.</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/admin/export?type=users" className="px-3 py-1.5 rounded-lg text-xs border border-neutral-800 text-neutral-400 hover:text-neutral-200">
            Export users CSV
          </a>
          <a href="/api/admin/export?type=judgments" className="px-3 py-1.5 rounded-lg text-xs border border-neutral-800 text-neutral-400 hover:text-neutral-200">
            Export judgments CSV
          </a>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-6 p-1 rounded-xl bg-[#111] border border-neutral-800/80 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? "bg-gradient-to-r from-red-900/40 to-purple-900/40 text-neutral-100"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Users", value: stats.users, sub: `+${stats.usersToday} today` },
              { label: "Judgments", value: stats.judgments, sub: `+${stats.judgmentsToday} today` },
              { label: "Avg score", value: stats.avgScore || "—", sub: "all time" },
              { label: "This week", value: stats.judgmentsWeek, sub: `${stats.usersWeek} new users` },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-neutral-800/80 bg-[#111] p-4 sm:p-5">
                <p className="text-[10px] sm:text-xs uppercase tracking-wide text-neutral-500 mb-1">{s.label}</p>
                <p className="text-xl sm:text-2xl font-semibold text-neutral-100 tabular-nums">{s.value}</p>
                <p className="text-[10px] text-neutral-600 mt-1">{s.sub}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5">
            <p className="text-xs uppercase tracking-wide text-neutral-500 mb-4">Activity · last 14 days</p>
            {stats.activity.length > 0 ? <ActivityBars data={stats.activity} /> : <p className="text-sm text-neutral-600">No activity yet</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5">
              <p className="text-xs uppercase tracking-wide text-neutral-500 mb-4">Styles</p>
              <BarList data={Object.entries(stats.styleCounts).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)} color="from-red-600 to-red-400" />
            </div>
            <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5">
              <p className="text-xs uppercase tracking-wide text-neutral-500 mb-4">Focus</p>
              <BarList data={Object.entries(stats.focusCounts).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)} color="from-purple-600 to-purple-400" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5">
              <p className="text-xs uppercase tracking-wide text-neutral-500 mb-4">Rarity</p>
              <RarityRing data={rarityRingData} />
            </div>
            <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5">
              <p className="text-xs uppercase tracking-wide text-neutral-500 mb-4">Score distribution</p>
              <ScoreBars data={stats.scoreBuckets} />
            </div>
          </div>
        </div>
      )}

      {tab === "traffic" && <AnalyticsTab />}
      {tab === "gallery" && <GalleryTab />}
      {tab === "seeds" && <SeedsTab />}

      {tab === "users" && (
        <div className="space-y-4">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search username or email" className="w-full sm:w-72 px-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600" />
          <div className="rounded-2xl border border-neutral-800/80 bg-[#111] overflow-hidden">
            {filteredUsers.length === 0 ? (
              <p className="p-6 text-sm text-neutral-500">No users found.</p>
            ) : (
              <div className="divide-y divide-neutral-800/60">
                {filteredUsers.map((u) => (
                  <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-200 truncate">{u.username}</p>
                      <p className="text-xs text-neutral-500 truncate">{u.email || "—"}</p>
                      <p className="text-[11px] text-neutral-600 mt-0.5">{u.judgment_count} judgments · joined {new Date(u.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <button onClick={() => resetPassword(u.id, u.username)} disabled={busy} className="px-3 py-1.5 rounded-lg text-xs border border-neutral-800 text-neutral-400 hover:text-neutral-200 disabled:opacity-40">Reset password</button>
                      <button onClick={() => nukeUserJudgments(u.id, u.username)} disabled={busy || u.judgment_count === 0} className="px-3 py-1.5 rounded-lg text-xs border border-neutral-800 text-neutral-400 hover:text-neutral-200 disabled:opacity-40">Nuke content</button>
                      <button onClick={() => deleteUser(u.id, u.username)} disabled={busy} className="px-3 py-1.5 rounded-lg text-xs border border-red-900/50 text-red-400/90 hover:bg-red-950/30 disabled:opacity-40">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "judgments" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <select value={filterStyle} onChange={(e) => setFilterStyle(e.target.value)} className="px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-300 focus:outline-none">
              <option value="">All styles</option>
              {"honest unhinged filthy petty deadpan".split(" ").map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select value={filterRarity} onChange={(e) => setFilterRarity(e.target.value)} className="px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-300 focus:outline-none">
              <option value="">All rarities</option>
              {"Trash Common Uncommon Rare Epic Legendary".split(" ").map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            {judgments.length > 0 && (
              <>
                <button onClick={toggleSelectAll} className="px-3 py-2 rounded-xl text-xs border border-neutral-800 text-neutral-400 hover:text-neutral-200">
                  {selected.size === judgments.length ? "Deselect all" : "Select all"}
                </button>
                {selected.size > 0 && (
                  <button onClick={bulkDelete} disabled={busy} className="px-3 py-2 rounded-xl text-xs border border-red-900/50 text-red-400 hover:bg-red-950/30 disabled:opacity-40">
                    Delete selected ({selected.size})
                  </button>
                )}
              </>
            )}
          </div>
          <div className="space-y-3">
            {judgments.length === 0 ? (
              <p className="text-sm text-neutral-500 p-4">No judgments found.</p>
            ) : (
              judgments.map((j) => (
                <div key={j.id} className={`rounded-2xl border bg-[#111] p-4 ${selected.has(j.id) ? "border-purple-800/60" : "border-neutral-800/80"}`}>
                  <div className="flex gap-3">
                    <input type="checkbox" checked={selected.has(j.id)} onChange={() => toggleSelect(j.id)} className="mt-1 accent-purple-600" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-neutral-500">
                          <span className="text-neutral-300">{j.username}</span>
                          <span>·</span><span>{j.rarity}</span>
                          <span>·</span><span>{Number(j.score).toFixed(1)}/10</span>
                          <span>·</span><span>{j.style}</span>
                          <span>·</span><span>{j.focus}</span>
                        </div>
                        <span className="text-[11px] text-neutral-600">{new Date(j.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-neutral-300 leading-relaxed mb-3">{j.verdict}</p>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => togglePublic(j.id, j.is_public)} disabled={busy} className="px-3 py-1.5 rounded-lg text-xs border border-neutral-800 text-neutral-400 hover:text-neutral-200 disabled:opacity-40">{j.is_public ? "Hide" : "Make public"}</button>
                        <button onClick={() => flagJudgment(j.id)} disabled={busy} className="px-3 py-1.5 rounded-lg text-xs border border-amber-900/40 text-amber-400/90 hover:bg-amber-950/20 disabled:opacity-40">Flag</button>
                        <button onClick={() => deleteJudgment(j.id)} disabled={busy} className="px-3 py-1.5 rounded-lg text-xs border border-red-900/50 text-red-400/90 hover:bg-red-950/30 disabled:opacity-40">Delete</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === "controls" && (
        <div className="space-y-5 max-w-xl">
          {settingsMsg && (
            <div className={`px-3 py-2.5 rounded-lg text-sm border ${settingsMsg.includes("saved") ? "bg-green-950/30 border-green-900/40 text-green-400" : "bg-red-950/40 border-red-900/50 text-red-300"}`}>
              {settingsMsg}
            </div>
          )}
          <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5 space-y-4">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Maintenance</p>
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm text-neutral-300">Maintenance mode</span>
              <input type="checkbox" checked={settings.maintenance_mode} onChange={(e) => setSettings((s) => ({ ...s, maintenance_mode: e.target.checked }))} className="w-4 h-4 accent-red-600" />
            </label>
            <textarea value={settings.maintenance_message} onChange={(e) => setSettings((s) => ({ ...s, maintenance_message: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200 focus:outline-none focus:border-neutral-600" />
          </div>
          <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5 space-y-4">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Announcement banner</p>
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm text-neutral-300">Show banner</span>
              <input type="checkbox" checked={settings.announcement_enabled} onChange={(e) => setSettings((s) => ({ ...s, announcement_enabled: e.target.checked }))} className="w-4 h-4 accent-purple-600" />
            </label>
            <input type="text" value={settings.announcement_text} onChange={(e) => setSettings((s) => ({ ...s, announcement_text: e.target.value }))} placeholder="Banner message" className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200 focus:outline-none focus:border-neutral-600" />
          </div>
          <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5 space-y-3">
            <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Feature toggles</p>
            {(
              [
                { key: "age_gate_enabled" as const, label: "Age gate" },
                { key: "signup_enabled" as const, label: "Allow signups" },
                { key: "roast_enabled" as const, label: "Face The Den (roast)" },
                { key: "public_judgments_enabled" as const, label: "Public judgments" },
              ] as const
            ).map((t) => (
              <label key={t.key} className="flex items-center justify-between gap-3">
                <span className="text-sm text-neutral-300">{t.label}</span>
                <input type="checkbox" checked={!!settings[t.key]} onChange={(e) => setSettings((s) => ({ ...s, [t.key]: e.target.checked }))} className="w-4 h-4 accent-red-600" />
              </label>
            ))}
          </div>
          <button onClick={saveSettings} disabled={busy} className="w-full py-3 rounded-xl bg-gradient-to-b from-red-700 via-red-800 to-purple-900 text-white text-sm font-medium disabled:opacity-50">
            {busy ? "Saving…" : "Save settings"}
          </button>
        </div>
      )}

      {tab === "reports" && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-500">Flagged items from the Judgments tab appear here.</p>
          {reports.length === 0 ? (
            <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-8 text-center">
              <p className="text-sm text-neutral-500">No reports yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <div key={r.id} className="rounded-2xl border border-neutral-800/80 bg-[#111] p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded ${r.status === "open" ? "bg-amber-950/40 text-amber-400 border border-amber-900/40" : "bg-neutral-900 text-neutral-500 border border-neutral-800"}`}>{r.status}</span>
                    <span className="text-[11px] text-neutral-600">{new Date(r.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-neutral-300 mb-1">{r.reason}</p>
                  {r.notes && <p className="text-xs text-neutral-500 mb-3">{r.notes}</p>}
                  {r.status === "open" && (
                    <button onClick={() => resolveReport(r.id)} disabled={busy} className="px-3 py-1.5 rounded-lg text-xs border border-neutral-800 text-neutral-400 hover:text-neutral-200 disabled:opacity-40">Mark resolved</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "audit" && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-500">Recent admin actions.</p>
          {audit.length === 0 ? (
            <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-8 text-center">
              <p className="text-sm text-neutral-500">No audit entries yet.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-neutral-800/80 bg-[#111] overflow-hidden divide-y divide-neutral-800/60">
              {audit.map((e) => (
                <div key={e.id} className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <span className="text-sm text-neutral-200 font-medium">{e.action}</span>
                    <span className="text-[11px] text-neutral-600">{new Date(e.created_at).toLocaleString()}</span>
                  </div>
                  {e.target && <p className="text-xs text-neutral-500 font-mono truncate">target: {e.target}</p>}
                  {e.details && <p className="text-xs text-neutral-500 mt-0.5">{e.details}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
