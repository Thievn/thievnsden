"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { DEFAULT_HEAT_SETTINGS, HEAT_LEVELS, HEAT_ROLES, HEAT_VOICES, type HeatSettings } from "@/lib/heat-check";

async function headers(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

export function HeatTab() {
  const [settings, setSettings] = useState<HeatSettings>(DEFAULT_HEAT_SETTINGS);
  const [names, setNames] = useState<{ id: string; name: string }[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [threads, setThreads] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [usage, setUsage] = useState({ threads: 0, messages: 0, names: 0, reports: 0 });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [testLine, setTestLine] = useState("you still up?");
  const [testOut, setTestOut] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactSeed, setContactSeed] = useState("");

  const load = async () => {
    const h = await headers();
    const [s, n, m, t, r, u] = await Promise.all([
      fetch("/api/admin/heat-check?view=settings", { headers: h }).then((x) => x.json()),
      fetch("/api/admin/heat-check?view=names", { headers: h }).then((x) => x.json()),
      fetch("/api/admin/heat-check?view=mod", { headers: h }).then((x) => x.json()),
      fetch("/api/admin/heat-check?view=threads", { headers: h }).then((x) => x.json()),
      fetch("/api/admin/heat-check?view=reports", { headers: h }).then((x) => x.json()),
      fetch("/api/admin/heat-check?view=usage", { headers: h }).then((x) => x.json()),
    ]);
    if (s.settings) setSettings(s.settings);
    setNames(n.names || []);
    setAssets(m.assets || []);
    setThreads(t.threads || []);
    setReports(r.reports || []);
    setUsage({
      threads: u.threads || 0,
      messages: u.messages || 0,
      names: u.names || 0,
      reports: u.reports || 0,
    });
    if (s.error) setMsg(s.error);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/heat-check", {
        method: "PATCH",
        headers: await headers(),
        body: JSON.stringify({ kind: "settings", settings }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSettings(data.settings);
      setMsg("Saved.");
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  const act = async (action: string, extra: Record<string, unknown> = {}) => {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/heat-check", {
        method: "POST",
        headers: await headers(),
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMsg(JSON.stringify(data).slice(0, 220));
      if (data.turn) setTestOut(JSON.stringify(data.turn, null, 2));
      await load();
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  const field = "w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-orange-300/80 mb-1">Playground · Heat Check</p>
        <h2 className="text-2xl font-semibold text-neutral-50">Heat Check</h2>
        <p className="text-sm text-neutral-500 mt-2">Kill switch, peek, faces, names, mod. Apply SQL in docs/heat-check-sql.md first.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ["Threads", usage.threads],
          ["Messages", usage.messages],
          ["Names", usage.names],
          ["Open reports", usage.reports],
        ].map(([l, v]) => (
          <div key={String(l)} className="rounded-xl border border-neutral-800 bg-[#111] p-3">
            <p className="text-[10px] uppercase tracking-wider text-neutral-500">{l}</p>
            <p className="text-xl text-neutral-100 mt-1">{v}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-orange-900/30 bg-[#111] p-5 space-y-3">
        <p className="text-sm font-medium text-neutral-100">Controls</p>
        <label className="flex items-center justify-between text-sm">
          Kill switch <input type="checkbox" checked={settings.kill} onChange={(e) => setSettings({ ...settings, kill: e.target.checked })} />
        </label>
        <label className="flex items-center justify-between text-sm">
          Public (everyone, not just THIEVN/admin) <input type="checkbox" checked={settings.public} onChange={(e) => setSettings({ ...settings, public: e.target.checked })} />
        </label>
        <label className="flex items-center justify-between text-sm">
          Peek default <input type="checkbox" checked={settings.peek_default} onChange={(e) => setSettings({ ...settings, peek_default: e.target.checked })} />
        </label>
        <label className="flex items-center justify-between text-sm">
          Face gen <input type="checkbox" checked={settings.face_gen} onChange={(e) => setSettings({ ...settings, face_gen: e.target.checked })} />
        </label>
        <label className="flex items-center justify-between text-sm">
          iOS skin <input type="checkbox" checked={settings.skins.ios} onChange={(e) => setSettings({ ...settings, skins: { ...settings.skins, ios: e.target.checked } })} />
        </label>
        <label className="flex items-center justify-between text-sm">
          Android skin <input type="checkbox" checked={settings.skins.android} onChange={(e) => setSettings({ ...settings, skins: { ...settings.skins, android: e.target.checked } })} />
        </label>
        <label className="text-sm block">
          Reward threshold
          <input
            type="number"
            min={6}
            max={10}
            value={settings.reward_threshold}
            onChange={(e) => setSettings({ ...settings, reward_threshold: Number(e.target.value) })}
            className={`${field} mt-1`}
          />
        </label>
        <button type="button" disabled={busy} onClick={save} className="px-4 py-2 rounded-xl text-sm border border-orange-800/60 text-orange-100">
          Save controls
        </button>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-3">
        <p className="text-sm font-medium">Roles / heat / voices / prompts</p>
        <textarea
          className={field}
          rows={6}
          value={settings.prompts.system}
          onChange={(e) => setSettings({ ...settings, prompts: { ...settings.prompts, system: e.target.value } })}
        />
        <div className="grid sm:grid-cols-3 gap-2">
          {HEAT_ROLES.map((r) => (
            <input
              key={r.id}
              className={field}
              value={settings.prompts.roles[r.id as keyof typeof settings.prompts.roles]}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  prompts: { ...settings.prompts, roles: { ...settings.prompts.roles, [r.id]: e.target.value } },
                })
              }
            />
          ))}
        </div>
        <div className="grid sm:grid-cols-3 gap-2">
          {HEAT_LEVELS.map((r) => (
            <input
              key={r.id}
              className={field}
              value={settings.prompts.heats[r.id as keyof typeof settings.prompts.heats]}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  prompts: { ...settings.prompts, heats: { ...settings.prompts.heats, [r.id]: e.target.value } },
                })
              }
            />
          ))}
        </div>
        <div className="grid sm:grid-cols-3 gap-2">
          {HEAT_VOICES.map((r) => (
            <input
              key={r.id}
              className={field}
              value={settings.prompts.voices[r.id as keyof typeof settings.prompts.voices]}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  prompts: { ...settings.prompts, voices: { ...settings.prompts.voices, [r.id]: e.target.value } },
                })
              }
            />
          ))}
        </div>
        <button type="button" disabled={busy} onClick={save} className="px-4 py-2 rounded-xl text-sm border border-neutral-700">
          Save prompts
        </button>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-3">
        <p className="text-sm font-medium">Name pool · {names.length}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => act("names")} className="px-3 py-2 rounded-lg text-xs border border-orange-800/50">
            Generate 50 via Grok
          </button>
          <button type="button" disabled={busy} onClick={() => act("seed-names")} className="px-3 py-2 rounded-lg text-xs border border-neutral-700">
            Seed built-in names
          </button>
        </div>
        <p className="text-xs text-neutral-500 max-h-24 overflow-auto">{names.map((n) => n.name).join(" · ")}</p>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-3">
        <p className="text-sm font-medium">Contact generator</p>
        <input className={field} placeholder="Name (blank = Grok)" value={contactName} onChange={(e) => setContactName(e.target.value)} />
        <input className={field} placeholder="Optional face seed" value={contactSeed} onChange={(e) => setContactSeed(e.target.value)} />
        <button
          type="button"
          disabled={busy}
          onClick={() => act("contact", { name: contactName, seed: contactSeed, face: true })}
          className="px-3 py-2 rounded-lg text-xs border border-orange-800/50"
        >
          Name + face
        </button>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-3">
        <p className="text-sm font-medium">Prompt test · does not save as a user</p>
        <textarea className={field} rows={2} value={testLine} onChange={(e) => setTestLine(e.target.value)} />
        <button type="button" disabled={busy} onClick={() => act("test", { userLine: testLine })} className="px-3 py-2 rounded-lg text-xs border border-neutral-700">
          Run Grok
        </button>
        {testOut ? <pre className="text-[11px] text-neutral-400 whitespace-pre-wrap">{testOut}</pre> : null}
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-3">
        <p className="text-sm font-medium">Mod queue</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {assets.map((a) => (
            <div key={a.id} className="rounded-xl overflow-hidden border border-neutral-800">
              {a.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.url} alt="" className="h-28 w-full object-cover" />
              ) : (
                <div className="h-28 grid place-items-center text-[10px] text-neutral-600">{a.kind}</div>
              )}
              <div className="p-2 flex flex-wrap gap-1 text-[10px]">
                <span className="text-neutral-500">{a.kind} · {a.status}</span>
                <button type="button" onClick={async () => {
                  await fetch("/api/admin/heat-check", { method: "PATCH", headers: await headers(), body: JSON.stringify({ kind: "mod", id: a.id, status: "approved" }) });
                  load();
                }}>ok</button>
                <button type="button" onClick={async () => {
                  await fetch("/api/admin/heat-check", { method: "PATCH", headers: await headers(), body: JSON.stringify({ kind: "mod", id: a.id, status: "delete" }) });
                  load();
                }}>del</button>
                <button type="button" onClick={async () => {
                  await fetch("/api/admin/heat-check", { method: "PATCH", headers: await headers(), body: JSON.stringify({ kind: "mod", id: a.id, status: "ban" }) });
                  load();
                }}>ban</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-3">
        <p className="text-sm font-medium">Threads</p>
        {threads.map((t) => (
          <div key={t.id} className="flex items-center justify-between gap-3 text-xs border-b border-neutral-800 py-2">
            <span className="text-neutral-300">{t.contact_name} · {t.role} · {t.heat}</span>
            <button
              type="button"
              className="text-rose-300"
              onClick={async () => {
                if (!confirm("Wipe thread + images?")) return;
                await fetch("/api/admin/heat-check", { method: "DELETE", headers: await headers(), body: JSON.stringify({ threadId: t.id }) });
                load();
              }}
            >
              wipe
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-2">
        <p className="text-sm font-medium">Reports</p>
        {reports.map((r) => (
          <div key={r.id} className="text-xs text-neutral-400 flex justify-between gap-2">
            <span>{r.reason} · {r.status} · {r.notes}</span>
            <button
              type="button"
              onClick={async () => {
                await fetch("/api/admin/heat-check", { method: "PATCH", headers: await headers(), body: JSON.stringify({ kind: "report", id: r.id, status: "closed" }) });
                load();
              }}
            >
              close
            </button>
          </div>
        ))}
      </div>

      {msg ? <p className="text-xs text-neutral-500">{msg}</p> : null}
    </div>
  );
}
