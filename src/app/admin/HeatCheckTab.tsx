"use client";

import { useEffect, useState } from "react";
import { DEFAULT_HEAT_SETTINGS, type HeatSettings } from "@/lib/heat-check";
import { supabase } from "@/lib/supabase/client";

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

type Name = { id: string; name: string; used_count: number };

export function HeatCheckTab() {
  const [settings, setSettings] = useState<HeatSettings>(DEFAULT_HEAT_SETTINGS);
  const [usage, setUsage] = useState({ threads: 0, turns: 0, gens: 0 });
  const [names, setNames] = useState<Name[]>([]);
  const [reports, setReports] = useState<{ id: string; reason: string; preview: string; created_at: string }[]>([]);
  const [threads, setThreads] = useState<{ id: string; contact_name: string; status: string; heat: string; created_at: string; user_id?: string }[]>([]);
  const [pics, setPics] = useState<{ id: string; image_url: string; thread_id: string; kind?: string }[]>([]);
  const [bans, setBans] = useState<{ user_id: string; reason: string }[]>([]);
  const [msg, setMsg] = useState("");
  const [test, setTest] = useState({ lastUser: "hey", history: "", out: "" });
  const [newName, setNewName] = useState("");
  const [contact, setContact] = useState<{ name?: string; face?: string | null }>({});
  const [openThread, setOpenThread] = useState<{ contact_name?: string; messages?: { role: string; body: string }[] } | null>(null);
  const [catalogJson, setCatalogJson] = useState({
    roles: JSON.stringify(DEFAULT_HEAT_SETTINGS.roles),
    heats: JSON.stringify(DEFAULT_HEAT_SETTINGS.heats),
    voices: JSON.stringify(DEFAULT_HEAT_SETTINGS.voices),
  });

  const load = async () => {
    const res = await fetch("/api/admin/heat-check", { headers: await authHeaders() });
    const data = await res.json();
    if (data.settings) {
      const next = { ...DEFAULT_HEAT_SETTINGS, ...data.settings };
      setSettings(next);
      setCatalogJson({
        roles: JSON.stringify(next.roles || DEFAULT_HEAT_SETTINGS.roles),
        heats: JSON.stringify(next.heats || DEFAULT_HEAT_SETTINGS.heats),
        voices: JSON.stringify(next.voices || DEFAULT_HEAT_SETTINGS.voices),
      });
    }
    if (data.usage) setUsage(data.usage);
    setNames(data.names || []);
    setReports(data.reports || []);
    setThreads(data.threads || []);
    setPics(data.pics || []);
    setBans(data.bans || []);
  };

  useEffect(() => {
    load();
  }, []);

  const act = async (action: string, extra: Record<string, unknown> = {}) => {
    setMsg("");
    const res = await fetch("/api/admin/heat-check", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({ action, ...extra }),
    });
    const data = await res.json();
    if (!res.ok) return setMsg(data.error || "Failed");
    if (data.settings) setSettings(data.settings);
    if (data.names) setNames(data.names);
    if (data.turn) setTest((t) => ({ ...t, out: JSON.stringify(data.turn, null, 2) }));
    if (data.name) setContact({ name: data.name, face: data.face });
    if (data.thread) setOpenThread({ contact_name: data.thread.contact_name, messages: data.messages });
    if (data.inserted != null) setMsg(`Added ${data.inserted} names.`);
    await load();
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-rose-300/80 mb-1">Heat Check</p>
        <h2 className="text-2xl font-semibold text-neutral-50">Threads, names, mod</h2>
        <p className="text-sm text-neutral-500 mt-2">
          {usage.threads} threads · {usage.turns} turns · {usage.gens} stills. Credits later — 1 free short round / day. Failed gens don’t bill.
        </p>
      </div>
      {msg ? <p className="text-sm text-rose-300">{msg}</p> : null}

      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-3">
        <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Switches</p>
        <label className="flex items-center gap-2 text-sm text-neutral-300">
          <input type="checkbox" checked={settings.kill} onChange={(e) => setSettings({ ...settings, kill: e.target.checked })} />
          Kill switch
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-300">
          <input type="checkbox" checked={settings.live} onChange={(e) => setSettings({ ...settings, live: e.target.checked })} />
          Live for everyone
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-300">
          <input type="checkbox" checked={settings.peek_default} onChange={(e) => setSettings({ ...settings, peek_default: e.target.checked })} />
          Peek default on
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-300">
          <input type="checkbox" checked={settings.face_gen} onChange={(e) => setSettings({ ...settings, face_gen: e.target.checked })} />
          Face gen
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-300">
          <input type="checkbox" checked={settings.skins_ios} onChange={(e) => setSettings({ ...settings, skins_ios: e.target.checked })} />
          iOS skin
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-300">
          <input type="checkbox" checked={settings.skins_android} onChange={(e) => setSettings({ ...settings, skins_android: e.target.checked })} />
          Android skin
        </label>
        <label className="text-sm text-neutral-400">
          Reward threshold
          <input
            type="number"
            className="ml-2 w-16 bg-[#0a0a0a] border border-neutral-800 rounded px-2 py-1 text-neutral-200"
            value={settings.reward_threshold}
            onChange={(e) => setSettings({ ...settings, reward_threshold: Number(e.target.value) || 8 })}
          />
        </label>
        <textarea
          className="w-full h-24 bg-[#0a0a0a] border border-neutral-800 rounded-xl p-3 text-sm text-neutral-200"
          value={settings.system_prompt}
          onChange={(e) => setSettings({ ...settings, system_prompt: e.target.value })}
          placeholder="Extra system prompt"
        />
        <textarea
          className="w-full h-20 bg-[#0a0a0a] border border-neutral-800 rounded-xl p-3 text-sm text-neutral-200"
          value={settings.tip_prompt}
          onChange={(e) => setSettings({ ...settings, tip_prompt: e.target.value })}
          placeholder="Extra tip prompt"
        />
        <textarea
          className="w-full h-20 bg-[#0a0a0a] border border-neutral-800 rounded-xl p-3 text-sm text-neutral-200"
          value={catalogJson.roles}
          onChange={(e) => setCatalogJson({ ...catalogJson, roles: e.target.value })}
          placeholder="Roles JSON"
        />
        <textarea
          className="w-full h-16 bg-[#0a0a0a] border border-neutral-800 rounded-xl p-3 text-sm text-neutral-200"
          value={catalogJson.heats}
          onChange={(e) => setCatalogJson({ ...catalogJson, heats: e.target.value })}
          placeholder="Heat JSON"
        />
        <textarea
          className="w-full h-16 bg-[#0a0a0a] border border-neutral-800 rounded-xl p-3 text-sm text-neutral-200"
          value={catalogJson.voices}
          onChange={(e) => setCatalogJson({ ...catalogJson, voices: e.target.value })}
          placeholder="Voices JSON"
        />
        <button type="button" className="px-4 py-2 rounded-xl border border-rose-800/60 text-rose-100 text-sm" onClick={() => {
          try {
            act("save-settings", {
              settings: {
                ...settings,
                roles: JSON.parse(catalogJson.roles),
                heats: JSON.parse(catalogJson.heats),
                voices: JSON.parse(catalogJson.voices),
              },
            });
          } catch {
            setMsg("Catalog JSON is off.");
          }
        }}>
          Save switches
        </button>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-3">
        <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Name pool</p>
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 bg-[#0a0a0a] border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
            placeholder="Add a first name"
          />
          <button type="button" className="px-3 py-2 rounded-xl border border-neutral-700 text-sm text-neutral-200" onClick={() => act("name-add", { name: newName })}>
            Add
          </button>
          <button type="button" className="px-3 py-2 rounded-xl border border-rose-800/50 text-sm text-rose-100" onClick={() => act("names-50", { avoid: names.map((n) => n.name) })}>
            Generate 50 names
          </button>
        </div>
        <div className="flex flex-wrap gap-2 max-h-40 overflow-auto">
          {names.map((n) => (
            <button key={n.id} type="button" className="text-xs px-2 py-1 rounded-full border border-neutral-800 text-neutral-400" onClick={() => act("name-del", { id: n.id })}>
              {n.name} ×
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-3">
        <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Contact generator</p>
        <button type="button" className="px-3 py-2 rounded-xl border border-neutral-700 text-sm text-neutral-200" onClick={() => act("contact")}>
          Make a contact
        </button>
        <button type="button" className="px-3 py-2 rounded-xl border border-rose-800/50 text-sm text-rose-100" onClick={() => act("contact", { seed: true })}>
          Contact + seed thread
        </button>
        {contact.name ? <p className="text-sm text-neutral-200">{contact.name}</p> : null}
        {contact.face ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={contact.face} alt="" className="w-24 h-32 object-cover rounded-xl" />
        ) : null}
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-3">
        <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Prompt test</p>
        <textarea
          className="w-full h-16 bg-[#0a0a0a] border border-neutral-800 rounded-xl p-3 text-sm"
          value={test.lastUser}
          onChange={(e) => setTest({ ...test, lastUser: e.target.value })}
        />
        <button type="button" className="px-3 py-2 rounded-xl border border-neutral-700 text-sm" onClick={() => act("test-turn", { lastUser: test.lastUser, history: test.history })}>
          Fake one turn
        </button>
        {test.out ? <pre className="text-[11px] text-neutral-400 whitespace-pre-wrap">{test.out}</pre> : null}
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-3">
        <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Mod stills · tap to delete</p>
        <button type="button" className="text-xs text-neutral-400" onClick={() => pics[0] && act("approve-pic", { id: pics[0].id })}>
          Approve first in queue
        </button>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {pics.map((p) => (
            <button key={p.id} type="button" className="relative" onClick={() => act("delete-pic", { id: p.id })}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image_url} alt="" className="w-full h-24 object-cover rounded-lg" />
              <span className="absolute bottom-1 left-1 text-[9px] uppercase text-rose-100 bg-black/60 px-1 rounded">{p.kind || "still"}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-2">
        <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Threads</p>
        {threads.map((t) => (
          <div key={t.id} className="flex items-center justify-between text-sm text-neutral-300 border-b border-neutral-900 py-2">
            <button type="button" className="text-left" onClick={() => act("thread", { id: t.id })}>
              {t.contact_name} · {t.heat} · {t.status}
            </button>
            <button type="button" className="text-rose-400 text-xs" onClick={() => act("wipe-thread", { id: t.id })}>
              Wipe
            </button>
            {t.user_id ? (
              <button type="button" className="text-neutral-500 text-xs ml-2" onClick={() => act("ban", { user_id: t.user_id })}>
                Ban
              </button>
            ) : null}
          </div>
        ))}
        {openThread ? (
          <div className="text-xs text-neutral-400 space-y-1 max-h-48 overflow-auto">
            <p className="text-neutral-200">{openThread.contact_name}</p>
            {(openThread.messages || []).map((m, i) => (
              <p key={i}>
                <span className="text-rose-300">{m.role}</span> {m.body}
              </p>
            ))}
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-2">
        <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Reports</p>
        {reports.map((r) => (
          <p key={r.id} className="text-sm text-neutral-400">
            {r.reason}: {r.preview}
          </p>
        ))}
      </div>
      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-2">
        <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Bans</p>
        {bans.map((b) => (
          <p key={b.user_id} className="text-sm text-neutral-400">
            {b.user_id.slice(0, 8)} · {b.reason}{" "}
            <button type="button" className="text-rose-300" onClick={() => act("unban", { user_id: b.user_id })}>
              lift
            </button>
          </p>
        ))}
      </div>
    </div>
  );
}
