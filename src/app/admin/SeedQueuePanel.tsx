"use client";

import { useCallback, useEffect, useState } from "react";

type SeedJob = {
  id: string;
  status: string;
  total: number;
  completed: number;
  failed: number;
  make_public: boolean;
  mode: string;
  preset?: string | null;
  filters?: Record<string, unknown>;
  log?: { at: string; msg: string }[];
  created_at: string;
  updated_at: string;
};

type Props = {
  makePublic: boolean;
  filters: Record<string, unknown>;
  onDemosMaybeChanged: () => void;
};

export function SeedQueuePanel({ makePublic, filters, onDemosMaybeChanged }: Props) {
  const [jobs, setJobs] = useState<SeedJob[]>([]);
  const [count, setCount] = useState(5);
  const [useFilters, setUseFilters] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/seeds/queue");
      const data = await res.json();
      setJobs(data.jobs || []);
      if (data.error && !(data.jobs || []).length) {
        setFailed(true);
        setMsg(data.hint || data.error);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadJobs();
    const t = setInterval(loadJobs, 4000);
    return () => clearInterval(t);
  }, [loadJobs]);

  useEffect(() => {
    const active = jobs.some((j) => j.status === "pending" || j.status === "running");
    if (active) onDemosMaybeChanged();
  }, [jobs, onDemosMaybeChanged]);

  const startQueue = async (opts: { preset?: string; count?: number; mode?: string }) => {
    setBusy(true);
    setFailed(false);
    setMsg("Starting queue…");
    try {
      const body: Record<string, unknown> = {
        makePublic,
        count: opts.count ?? count,
        mode: opts.mode || (useFilters ? "filter" : "random"),
      };
      if (opts.preset) body.preset = opts.preset;
      if (useFilters || opts.mode === "filter") body.filters = filters;

      const res = await fetch("/api/admin/seeds/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setFailed(true);
        setMsg(data.hint || data.error || "Queue failed");
        return;
      }
      setMsg(
        `Queued ${data.job?.total || "?"} demos. Safe to close this tab — they run one at a time.`
      );
      await loadJobs();
    } catch (err: any) {
      setFailed(true);
      setMsg(err.message || "Queue failed");
    } finally {
      setBusy(false);
    }
  };

  const cancelJob = async (id: string) => {
    await fetch(`/api/admin/seeds/queue/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    });
    await loadJobs();
  };

  const resumeJob = async (id: string) => {
    await fetch(`/api/admin/seeds/queue/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resume" }),
    });
    setMsg("Resumed — worker kicked.");
    await loadJobs();
  };

  const nudge = async (id?: string) => {
    await fetch("/api/admin/seeds/queue/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(id ? { jobId: id } : {}),
    });
    await loadJobs();
    onDemosMaybeChanged();
  };

  return (
    <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5 space-y-4">
      <div>
        <p className="text-sm text-neutral-200 font-medium mb-1">Bulk queue</p>
        <p className="text-xs text-neutral-500 leading-relaxed">
          Runs <strong className="text-neutral-400">one at a time</strong> with auto-retry.
          Stored in the database — you can close the tab.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs text-neutral-500 space-y-1">
          <span>How many</span>
          <select
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="block px-3 py-2 rounded-lg bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200"
          >
            {[1, 3, 5, 8, 10, 15, 20].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs text-neutral-400 pb-2">
          <input
            type="checkbox"
            checked={useFilters}
            onChange={(e) => setUseFilters(e.target.checked)}
            className="accent-purple-600"
          />
          Use filters below (gender/age/camera…)
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => startQueue({ mode: useFilters ? "filter" : "random" })}
          className="px-4 py-2.5 rounded-xl text-sm border border-purple-800/50 text-purple-300 hover:bg-purple-950/30 disabled:opacity-40"
        >
          Queue {count} random
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => startQueue({ preset: "varied_women" })}
          className="px-3 py-2.5 rounded-xl text-xs border border-neutral-800 text-neutral-300 disabled:opacity-40"
        >
          Pack: 5 women
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => startQueue({ preset: "men_casual" })}
          className="px-3 py-2.5 rounded-xl text-xs border border-neutral-800 text-neutral-300 disabled:opacity-40"
        >
          Pack: 5 men
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => startQueue({ preset: "mirror_mix" })}
          className="px-3 py-2.5 rounded-xl text-xs border border-neutral-800 text-neutral-300 disabled:opacity-40"
        >
          Pack: 5 mirrors
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => startQueue({ preset: "mixed_10" })}
          className="px-3 py-2.5 rounded-xl text-xs border border-neutral-800 text-neutral-300 disabled:opacity-40"
        >
          Pack: mixed 10
        </button>
      </div>

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

      {jobs.length > 0 && (
        <div className="space-y-2 pt-1">
          <p className="text-[10px] uppercase tracking-wide text-neutral-600">Recent jobs</p>
          {jobs.slice(0, 8).map((j) => {
            const done = (j.completed || 0) + (j.failed || 0);
            const pct = Math.min(100, Math.round((done / Math.max(j.total, 1)) * 100));
            return (
              <div
                key={j.id}
                className="rounded-xl border border-neutral-800/80 bg-[#0a0a0a] p-3 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-neutral-300">
                    <span className="uppercase tracking-wide text-neutral-500">{j.status}</span>
                    <span className="text-neutral-600"> · </span>
                    {j.completed}/{j.total} ok
                    {j.failed ? (
                      <span className="text-red-400/80"> · {j.failed} fail</span>
                    ) : null}
                    {j.preset ? (
                      <span className="text-neutral-600"> · {j.preset}</span>
                    ) : null}
                  </div>
                  <div className="flex gap-1.5">
                    {(j.status === "pending" || j.status === "running") && (
                      <>
                        <button
                          type="button"
                          onClick={() => nudge(j.id)}
                          className="px-2 py-1 rounded text-[10px] border border-neutral-700 text-neutral-400"
                        >
                          Nudge
                        </button>
                        <button
                          type="button"
                          onClick={() => cancelJob(j.id)}
                          className="px-2 py-1 rounded text-[10px] border border-red-900/40 text-red-400/90"
                        >
                          Stop
                        </button>
                      </>
                    )}
                    {j.status === "cancelled" && done < j.total && (
                      <button
                        type="button"
                        onClick={() => resumeJob(j.id)}
                        className="px-2 py-1 rounded text-[10px] border border-neutral-700 text-neutral-300"
                      >
                        Resume
                      </button>
                    )}
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-neutral-900 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-700 to-purple-700 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {Array.isArray(j.log) && j.log.length > 0 && (
                  <p className="text-[10px] text-neutral-600 line-clamp-2">
                    {j.log[j.log.length - 1]?.msg}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
