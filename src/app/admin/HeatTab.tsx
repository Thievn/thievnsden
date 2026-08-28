"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  DEFAULT_HEAT_SETTINGS,
  HEAT_LEVELS,
  HEAT_LOOKS,
  HEAT_ROLES,
  HEAT_VOICES,
  type HeatSettings,
} from "@/lib/heat-check";

async function headers(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

export function HeatTab() {
  const [settings, setSettings] = useState<HeatSettings>(DEFAULT_HEAT_SETTINGS);
  const [nameCount, setNameCount] = useState(0);
  const [assets, setAssets] = useState<any[]>([]);
  const [threads, setThreads] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [usage, setUsage] = useState({ threads: 0, messages: 0, names: 0, reports: 0 });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [testLine, setTestLine] = useState("you still up?");
  const [testRole, setTestRole] = useState("hookup");
  const [testHeat, setTestHeat] = useState("filthy");
  const [testVoice, setTestVoice] = useState("mean");
  const [testLook, setTestLook] = useState("woman");
  const [testOut, setTestOut] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactSeed, setContactSeed] = useState("");
  const [promptPack, setPromptPack] = useState("system");

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
    setNameCount((n.names || []).length);
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
      setMsg(typeof data.error === "string" ? data.error : data.ok ? "Done." : data.turn ? "Grok answered." : JSON.stringify(data).slice(0, 180));
      if (data.turn) setTestOut(JSON.stringify(data.turn, null, 2));
      if (data.inserted != null || data.ok) await load();
      else await load();
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  const field = "w-full px-3 py-2.5 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200";
  const btn = "px-4 py-2 rounded-xl text-sm border border-orange-800/50 text-orange-100 disabled:opacity-40";
  const ghost = "px-4 py-2 rounded-xl text-sm border border-neutral-700 text-neutral-300 disabled:opacity-40";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-orange-300/80 mb-1">Playground</p>
          <h2 className="text-2xl font-semibold text-neutral-50">Heat Check</h2>
          <p className="text-sm text-neutral-500 mt-1">Controls, secret-base prompt, faces, threads. Name list stays off this page.</p>
        </div>
        {msg ? <p className="text-xs text-orange-200/80 max-w-sm text-right">{msg}</p> : null}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ["Open threads", usage.threads],
          ["Messages", usage.messages],
          ["Name pool", usage.names || nameCount],
          ["Reports", usage.reports],
        ].map(([l, v]) => (
          <div key={String(l)} className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#161010] to-[#0e0e0e] p-4">
            <p className="text-[10px] uppercase tracking-wider text-neutral-500">{l}</p>
            <p className="text-2xl text-neutral-50 mt-1">{v}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-orange-900/35 bg-[#111] p-5 space-y-4">
        <p className="text-sm font-medium text-neutral-100">House controls</p>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          {(
            [
              ["kill", "Kill switch", settings.kill],
              ["public", "Public for everyone", settings.public],
              ["peek_default", "Tip peek on by default", settings.peek_default],
              ["face_gen", "Show generate-their-face", settings.face_gen],
              ["ios", "iOS mock", settings.skins.ios],
              ["android", "Android mock", settings.skins.android],
            ] as const
          ).map(([key, label, on]) => (
            <label key={key} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/30 px-3 py-2.5">
              <span>{label}</span>
              <input
                type="checkbox"
                checked={on}
                onChange={(e) => {
                  const v = e.target.checked;
                  if (key === "ios" || key === "android") {
                    setSettings({ ...settings, skins: { ...settings.skins, [key]: v } });
                  } else {
                    setSettings({ ...settings, [key]: v });
                  }
                }}
              />
            </label>
          ))}
        </div>
        <p className="text-[12px] text-neutral-500">
          Uncheck generate-their-face to hide it on start. Upload a photo still works. Credits for faces can land later.
        </p>
        <label className="text-sm block">
          Reward photo threshold
          <input
            type="number"
            min={6}
            max={10}
            value={settings.reward_threshold}
            onChange={(e) => setSettings({ ...settings, reward_threshold: Number(e.target.value) })}
            className={`${field} mt-1 max-w-[8rem]`}
          />
        </label>
        <button type="button" disabled={busy} onClick={save} className={btn}>
          Save controls
        </button>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">Secret base · prompts</p>
          <select className={`${field} max-w-[12rem]`} value={promptPack} onChange={(e) => setPromptPack(e.target.value)}>
            <option value="system">System / secret base</option>
            <option value="roles">Roles</option>
            <option value="heats">Heat</option>
            <option value="voices">Voice</option>
          </select>
        </div>
        {promptPack === "system" ? (
          <textarea
            className={`${field} font-mono text-[12px] leading-relaxed`}
            rows={10}
            value={settings.prompts.system}
            onChange={(e) => setSettings({ ...settings, prompts: { ...settings.prompts, system: e.target.value } })}
          />
        ) : null}
        {promptPack === "roles" ? (
          <div className="grid sm:grid-cols-2 gap-2">
            {HEAT_ROLES.map((r) => (
              <label key={r.id} className="text-[11px] text-neutral-500">
                {r.label}
                <textarea
                  className={`${field} mt-1`}
                  rows={2}
                  value={settings.prompts.roles[r.id as keyof typeof settings.prompts.roles]}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      prompts: { ...settings.prompts, roles: { ...settings.prompts.roles, [r.id]: e.target.value } },
                    })
                  }
                />
              </label>
            ))}
          </div>
        ) : null}
        {promptPack === "heats" ? (
          <div className="grid sm:grid-cols-3 gap-2">
            {HEAT_LEVELS.map((r) => (
              <label key={r.id} className="text-[11px] text-neutral-500">
                {r.label}
                <textarea
                  className={`${field} mt-1`}
                  rows={3}
                  value={settings.prompts.heats[r.id as keyof typeof settings.prompts.heats]}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      prompts: { ...settings.prompts, heats: { ...settings.prompts.heats, [r.id]: e.target.value } },
                    })
                  }
                />
              </label>
            ))}
          </div>
        ) : null}
        {promptPack === "voices" ? (
          <div className="grid sm:grid-cols-2 gap-2">
            {HEAT_VOICES.map((r) => (
              <label key={r.id} className="text-[11px] text-neutral-500">
                {r.label}
                <textarea
                  className={`${field} mt-1`}
                  rows={2}
                  value={settings.prompts.voices[r.id as keyof typeof settings.prompts.voices]}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      prompts: { ...settings.prompts, voices: { ...settings.prompts.voices, [r.id]: e.target.value } },
                    })
                  }
                />
              </label>
            ))}
          </div>
        ) : null}
        <button type="button" disabled={busy} onClick={save} className={btn}>
          Save prompts
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-3">
          <p className="text-sm font-medium">Name pool · {usage.names || nameCount} names</p>
          <p className="text-xs text-neutral-500">Hidden from this screen. Grok can mint more. Seed fills the built-in list with vibe tags so faces match who they picked.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => act("names")} className={btn}>
              Mint 50 names
            </button>
            <button type="button" disabled={busy} onClick={() => act("seed-names")} className={ghost}>
              Seed built-in pool
            </button>
          </div>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-3">
          <p className="text-sm font-medium">Contact still</p>
          <input className={field} placeholder="Name (blank = Grok)" value={contactName} onChange={(e) => setContactName(e.target.value)} />
          <input className={field} placeholder="Face seed — hair, room, vibe" value={contactSeed} onChange={(e) => setContactSeed(e.target.value)} />
          <button
            type="button"
            disabled={busy}
            onClick={() => act("contact", { name: contactName, seed: contactSeed, face: true, look: testLook })}
            className={btn}
          >
            Name + face
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-3">
        <p className="text-sm font-medium">Prompt lab · does not save as a user</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <select className={field} value={testLook} onChange={(e) => setTestLook(e.target.value)}>
            {HEAT_LOOKS.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
          <select className={field} value={testRole} onChange={(e) => setTestRole(e.target.value)}>
            {HEAT_ROLES.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
          <select className={field} value={testHeat} onChange={(e) => setTestHeat(e.target.value)}>
            {HEAT_LEVELS.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
          <select className={field} value={testVoice} onChange={(e) => setTestVoice(e.target.value)}>
            {HEAT_VOICES.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>
        <textarea className={field} rows={2} value={testLine} onChange={(e) => setTestLine(e.target.value)} />
        <button
          type="button"
          disabled={busy}
          onClick={() => act("test", { userLine: testLine, role: testRole, heat: testHeat, voice: testVoice, look: testLook })}
          className={ghost}
        >
          Run Grok
        </button>
        {testOut ? <pre className="text-[11px] text-neutral-400 whitespace-pre-wrap max-h-64 overflow-auto">{testOut}</pre> : null}
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-3">
        <p className="text-sm font-medium">Face queue</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {assets.length ? assets.map((a) => (
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
          )) : <p className="text-xs text-neutral-600 col-span-full">Nothing in the queue.</p>}
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-3">
        <p className="text-sm font-medium">Threads</p>
        {threads.length ? threads.map((t) => (
          <div key={t.id} className="flex items-center justify-between gap-3 text-xs border-b border-neutral-800 py-2">
            <span className="text-neutral-300">
              {t.contact_name} · {t.they_look || "—"} · {t.role} · {t.heat} {t.ended ? "· faded" : ""}
            </span>
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
        )) : <p className="text-xs text-neutral-600">No threads yet.</p>}
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-2">
        <p className="text-sm font-medium">Reports</p>
        {reports.length ? reports.map((r) => (
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
        )) : <p className="text-xs text-neutral-600">Quiet.</p>}
      </div>
    </div>
  );
}
