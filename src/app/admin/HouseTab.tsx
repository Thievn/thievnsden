"use client";

import { useCallback, useEffect, useState } from "react";
import { RarityFrame } from "@/components/RarityFrame";
import { getRarity } from "@/lib/rarity";

type HouseUser = {
  id: string;
  username: string;
  email: string;
  created_at: string;
  judgment_count: number;
  public_count: number;
  avatar_url: string | null;
  score: number | null;
  is_demo: boolean;
};

export function HouseTab() {
  const [users, setUsers] = useState<HouseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState("");
  const [danger, setDanger] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users?kind=house");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setUsers(data.users || []);
    } catch (err: any) {
      setFailed(true);
      setMsg(err.message || "Could not load house accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const hide = async (id: string, username: string) => {
    setBusy(id);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id, action: "hide_cards" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Hide failed");
      setMsg(`Hid ${username} from the stack`);
      await load();
    } catch (err: any) {
      setFailed(true);
      setMsg(err.message);
    } finally {
      setBusy(null);
    }
  };

  const remove = async (id: string, username: string) => {
    if (!confirm(`Remove house account ${username}? Handle stays reserved.`)) return;
    setBusy(id);
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setMsg(`Removed ${username}`);
      await load();
    } catch (err: any) {
      setFailed(true);
      setMsg(err.message);
    } finally {
      setBusy(null);
    }
  };

  const clearHouse = async () => {
    if (!confirm("Remove every house account and their portraits? Handles stay reserved so they don't recycle.")) {
      return;
    }
    setBusy("all");
    try {
      const res = await fetch("/api/admin/seeds", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Clear failed");
      setMsg(`Cleared ${data.purgedJudgments} cards · ${data.purgedUsers} accounts`);
      await load();
    } catch (err: any) {
      setFailed(true);
      setMsg(err.message);
    } finally {
      setBusy(null);
    }
  };

  const filtered = users.filter((u) => u.username.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4 min-w-0">
      <div>
        <p className="text-sm text-neutral-100 font-medium">House</p>
        <p className="text-xs text-neutral-500 mt-1 max-w-xl leading-relaxed">
          Cast accounts only. Real signups live in Users. Visitors never see this split.
        </p>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search house handles"
        className="w-full sm:w-72 px-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600"
      />

      {msg && (
        <p
          className={`text-xs rounded-lg px-3 py-2 border ${
            failed
              ? "border-red-900/50 bg-red-950/20 text-red-300"
              : "border-neutral-800 text-neutral-300"
          }`}
        >
          {msg}
        </p>
      )}

      <div className="rounded-2xl border border-neutral-800/80 bg-[#111] overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-neutral-500">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-sm text-neutral-500">No house accounts.</p>
        ) : (
          <div className="divide-y divide-neutral-800/60">
            {filtered.map((u) => (
              <div
                key={u.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <RarityFrame
                    slug={getRarity(u.score ?? 0).slug}
                    compact
                    className="w-11 h-14 rounded-lg shrink-0"
                  >
                    {u.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-neutral-900" />
                    )}
                  </RarityFrame>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-200 truncate">{u.username}</p>
                    <p className="text-[11px] text-neutral-600 mt-0.5">
                      {u.judgment_count} cards · {u.public_count} on stack ·{" "}
                      {new Date(u.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    onClick={() => hide(u.id, u.username)}
                    disabled={!!busy || u.public_count === 0}
                    className="px-3 py-1.5 rounded-lg text-xs border border-neutral-800 text-neutral-400 hover:text-neutral-200 disabled:opacity-40"
                  >
                    Hide from stack
                  </button>
                  <button
                    onClick={() => remove(u.id, u.username)}
                    disabled={!!busy}
                    className="px-3 py-1.5 rounded-lg text-xs border border-red-900/50 text-red-400/90 hover:bg-red-950/30 disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={() => setDanger((v) => !v)}
          className="text-[11px] uppercase tracking-[0.18em] text-neutral-600 hover:text-neutral-400"
        >
          {danger ? "Hide danger" : "Danger"}
        </button>
        {danger && (
          <div className="mt-3 rounded-2xl border border-red-950/50 bg-red-950/10 p-4 space-y-2">
            <p className="text-xs text-neutral-500 leading-relaxed">
              Clears every house portrait and account. Handles stay reserved so the room doesn't
              recycle the same names.
            </p>
            <button
              type="button"
              onClick={clearHouse}
              disabled={!!busy || users.length === 0}
              className="px-3 py-2 rounded-xl text-xs border border-red-900/50 text-red-400 disabled:opacity-40"
            >
              Clear house
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
