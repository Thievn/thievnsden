"use client";

import { useEffect, useMemo, useState } from "react";
import { XDropPanel } from "@/app/admin/XDropPanel";
import { XPhoneMock } from "@/app/admin/XPhoneMock";
import { supabase } from "@/lib/supabase/client";
import {
  ADDRESSEES,
  FORMS,
  HEATS,
  OUTLOOKS,
  type ThoughtPick,
} from "@/lib/thoughts-packs";
import {
  describeXRecipe,
  emptyXRecipe,
  EMOTE_PACKS,
  SIGNOFFS,
  surpriseXRecipe,
  X_CUTS,
  X_LANES,
  X_LENGTHS,
  X_PREMIUM_CAP,
  type XRecipe,
  type XVoiceCut,
} from "@/lib/x-thoughts";
import {
  DAY_IDS,
  STUDIO_ASPECTS,
  STUDIO_KINDS,
  STUDIO_LOOKS,
  defaultCadence,
  hasRawUrl,
  upcomingSlots,
  type Cadence,
  type StudioAspect,
  type StudioKind,
} from "@/lib/x-studio";
import { readJson } from "@/lib/read-json";

type LedgerRow = {
  id: string;
  post_id: string | null;
  url: string | null;
  body: string;
  source: string;
  posted_at: string | null;
  recipe?: Partial<XRecipe> | null;
  media_urls?: string[] | null;
  status?: string;
  approved?: boolean;
  scheduled_for?: string | null;
  fail_reason?: string | null;
  post_type?: string | null;
  aspect?: string | null;
};

type DupHit = {
  id: string;
  score: number;
  body: string;
  url: string | null;
  posted_at: string | null;
  kind?: string;
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const SELECTED = "border-amber-300/70 text-white bg-amber-950/40 shadow-[0_0_0_1px_rgba(251,191,36,0.22)]";
const IDLE = "border-white/10 text-neutral-300 bg-black/35 hover:border-amber-400/30 hover:text-white";

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

function Chips({
  label,
  hint,
  options,
  value,
  onChange,
  variant = "chip",
}: {
  label: string;
  hint?: string;
  options: ThoughtPick[];
  value: string;
  onChange: (id: string) => void;
  variant?: "chip" | "card" | "heat";
}) {
  return (
    <div>
      <div className="mb-2">
        <p className="text-[11px] uppercase tracking-[0.22em] text-amber-200/70">{label}</p>
        {hint ? <p className="text-[12px] text-neutral-500 mt-0.5">{hint}</p> : null}
      </div>
      <div
        className={cx(
          variant === "chip" && "flex flex-wrap gap-2",
          variant === "card" && "grid grid-cols-2 sm:grid-cols-3 gap-2",
          variant === "heat" && "grid grid-cols-3 sm:grid-cols-6 gap-2",
        )}
      >
        {options.map((opt) => {
          const on = value === opt.id;
          if (variant === "card") {
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={on}
                onClick={() => onChange(opt.id)}
                className={cx(
                  "relative overflow-hidden rounded-2xl border px-3 py-3 text-left bg-gradient-to-br min-w-0",
                  opt.wash || "from-white/5 to-black/40",
                  on ? SELECTED : IDLE,
                )}
              >
                <span className="text-lg leading-none">{opt.emoji || "•"}</span>
                <span className="mt-1.5 block text-[13px] font-medium tracking-tight">{opt.label}</span>
                {opt.desc ? <span className="mt-0.5 block text-[11px] text-white/55 leading-snug">{opt.desc}</span> : null}
              </button>
            );
          }
          return (
            <button
              key={opt.id}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(opt.id)}
              className={cx("px-3 py-2 rounded-full border text-[13px]", on ? SELECTED : IDLE)}
            >
              {opt.emoji ? `${opt.emoji} ` : ""}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function pill(status?: string) {
  const s = status || "draft";
  const color =
    s === "sent"
      ? "border-emerald-700/60 text-emerald-200"
      : s === "queued"
        ? "border-amber-700/60 text-amber-200"
        : s === "failed"
          ? "border-red-800/60 text-red-200"
          : s === "skipped"
            ? "border-neutral-700 text-neutral-500"
            : "border-neutral-700 text-neutral-300";
  return <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border ${color}`}>{s}</span>;
}

export function XThoughtsTab() {
  const [pane, setPane] = useState<"studio" | "drop">("studio");
  const [recipe, setRecipe] = useState<XRecipe>(emptyXRecipe);
  const [options, setOptions] = useState<{ dry: string; mean: string; unhinged: string; pick: XVoiceCut } | null>(null);
  const [pickedCut, setPickedCut] = useState<XVoiceCut>("mean");
  const [fromSlug, setFromSlug] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [post, setPost] = useState("");
  const [id, setId] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [pickedImg, setPickedImg] = useState(0);
  const [look, setLook] = useState("still");
  const [aspect, setAspect] = useState<StudioAspect>("16:9");
  const [picGuide, setPicGuide] = useState("");
  const [picN, setPicN] = useState<1 | 3>(1);
  const [kind, setKind] = useState<StudioKind>("thought");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [hits, setHits] = useState<DupHit[]>([]);
  const [filter, setFilter] = useState<"all" | "draft" | "queued" | "sent">("all");
  const [connected, setConnected] = useState(false);
  const [handle, setHandle] = useState("Thievn");
  const [queueAt, setQueueAt] = useState("");
  const [cadence, setCadence] = useState<Cadence>(defaultCadence());
  const [zernio, setZernio] = useState<{ ready: string; handle: string; has_key: boolean; key_hint: string; account_id: string } | null>(null);
  const [spendCap, setSpendCap] = useState<number | "">("");
  const [keyDraft, setKeyDraft] = useState("");
  const [accountDraft, setAccountDraft] = useState("");
  const [showRecipe, setShowRecipe] = useState(false);

  const image = images[pickedImg] || "";
  const setField = (key: keyof XRecipe, value: string) => setRecipe((prev) => ({ ...prev, [key]: value }));

  const loadLedger = async () => {
    const res = await fetch("/api/admin/x-posts");
    const data = await readJson(res);
    setLedger(data.rows || []);
    setConnected(Boolean(data.connected));
    if (data.handle) setHandle(data.handle);
  };

  const loadStudio = async () => {
    const res = await fetch("/api/admin/x-studio", { headers: await authHeaders() });
    const data = await readJson(res);
    if (data.cadence) setCadence(data.cadence);
    if (data.zernio) {
      setZernio(data.zernio);
      setAccountDraft(data.zernio.account_id || "");
    }
    if (typeof data.spend_cap === "number") setSpendCap(data.spend_cap);
  };

  useEffect(() => {
    fetch("/api/admin/thoughts")
      .then((r) => r.json())
      .then((d) => setRows(d.rows || []))
      .catch(() => {});
    loadLedger().catch(() => {});
    loadStudio().catch(() => {});
  }, []);

  const shown = ledger.filter((row) => {
    if (filter === "draft") return (row.status || "draft") === "draft";
    if (filter === "queued") return row.status === "queued";
    if (filter === "sent") return row.status === "sent" || Boolean(row.posted_at);
    return true;
  });

  const checkDupes = async (draft: string, skipId = id) => {
    if (!draft.trim()) {
      setHits([]);
      return [] as DupHit[];
    }
    const res = await fetch("/api/admin/x-posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "check", body: draft, skip_id: skipId }),
    });
    const data = await readJson(res);
    const next = (data.hits || []) as DupHit[];
    setHits(next);
    return next;
  };

  const blank = () => {
    setId("");
    setPost("");
    setImages([]);
    setPickedImg(0);
    setHits([]);
    setFromSlug("");
    setOptions(null);
    setMsg("Fresh page");
  };

  const persistMedia = async (draftId: string, urls: string[]) => {
    if (!draftId) return;
    await fetch("/api/admin/x-posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save", id: draftId, media_urls: urls, aspect, post_type: kind }),
    });
  };

  const run = async (tweak = "fresh") => {
    setBusy(tweak === "fresh" ? "draft" : tweak);
    setMsg("");
    try {
      const picked = rows.find((r) => r.slug === fromSlug);
      const source = picked ? `${picked.title}\n${picked.excerpt || ""}\n${picked.body || ""}` : "";
      const res = await fetch("/api/admin/x-thoughts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...recipe,
          source,
          tweak,
          existing: post,
          id: tweak === "fresh" ? "" : id,
          post_type: kind,
        }),
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Draft failed");
      const next = data.post || "";
      setPost(next);
      if (data.options?.dry) {
        setOptions(data.options);
        setPickedCut(data.options.pick || "mean");
        setPost(data.options[data.options.pick || "mean"] || next);
      } else if (tweak === "fresh") {
        setOptions(null);
      }
      setId(data.draft_id || data.id || "");
      setHits(data.hits || []);
      setMsg(tweak === "fresh" ? "Three cuts" : "Rewritten");
      await saveCadence({ ...cadence, recipe });
      await loadLedger();
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Draft failed");
    } finally {
      setBusy("");
    }
  };

  const makeImage = async (slot?: number) => {
    if (!post && !recipe.seed && !picGuide) {
      setMsg("Draft first.");
      return;
    }
    setBusy("pic");
    setMsg("");
    try {
      const count = slot !== undefined ? 1 : picN;
      const made: string[] = [];
      for (let i = 0; i < count; i++) {
        const res = await fetch("/api/admin/x-thoughts/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: recipe.topic, post, seed: recipe.seed, guide: picGuide, aspect, look }),
        });
        const data = await readJson(res);
        if (!res.ok) throw new Error(data.error || "Image failed");
        if (data.image) made.push(data.image);
      }
      setImages((prev) => {
        if (slot !== undefined) {
          const next = [...prev];
          next[slot] = made[0] || "";
          return next.filter(Boolean);
        }
        return made;
      });
      setPickedImg(0);
      const urls = slot !== undefined ? [...images.slice(0, slot), made[0] || "", ...images.slice(slot + 1)].filter(Boolean) : made;
      if (id) await persistMedia(id, urls);
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Image failed");
    } finally {
      setBusy("");
    }
  };

  const uploadFile = async (file: File) => {
    setBusy("pic");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/x-thoughts/upload", { method: "POST", body: fd });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Upload failed");
      const next = [data.image, ...images].filter(Boolean);
      setImages(next);
      setPickedImg(0);
      if (id) await persistMedia(id, next);
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy("");
    }
  };

  const copy = async () => {
    if (!post) return;
    await checkDupes(post);
    await navigator.clipboard.writeText(post);
    setMsg("Copied");
  };

  const downloadPic = async () => {
    if (!image) return;
    try {
      const res = await fetch(image);
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `x-thought-${aspect.replace(":", "x")}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } catch {
      window.open(image, "_blank");
    }
  };

  const sendNow = async () => {
    if (!post) return;
    const found = await checkDupes(post);
    if (found.some((h) => h.score >= 0.58)) {
      setMsg("Too close. New angle first.");
      return;
    }
    setBusy("send");
    setMsg("");
    try {
      const res = await fetch("/api/admin/x-thoughts/publish", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ action: "now", id, body: post, media_urls: image ? [image] : [] }),
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Send failed");
      setMsg("Sent");
      await loadLedger();
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Send failed");
    } finally {
      setBusy("");
    }
  };

  const queueDraft = async (when = queueAt) => {
    if (!post) return;
    if (!when) {
      setMsg("Pick a time.");
      return;
    }
    setBusy("queue");
    try {
      const iso = new Date(when).toISOString();
      const res = await fetch("/api/admin/x-thoughts/publish", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({
          action: "queue",
          id,
          body: post,
          media_urls: image ? [image] : [],
          scheduled_for: iso,
          approved: cadence.mode === "auto",
        }),
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Queue failed");
      setMsg(data.scheduled ? "Queued and scheduled" : "In queue");
      await loadLedger();
      await loadStudio();
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Queue failed");
    } finally {
      setBusy("");
    }
  };

  const saveCadence = async (next: Cadence, extra: Record<string, unknown> = {}) => {
    setCadence(next);
    const res = await fetch("/api/admin/x-studio", {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ cadence: { ...next, recipe }, ...extra }),
    });
    const data = await readJson(res);
    if (data.cadence) setCadence(data.cadence);
    if (data.zernio) setZernio(data.zernio);
  };

  const approveRow = async (row: LedgerRow) => {
    await fetch("/api/admin/x-posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save", id: row.id, approved: true, status: "queued" }),
    });
    if (row.scheduled_for) {
      await fetch("/api/admin/x-thoughts/publish", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({
          action: "queue",
          id: row.id,
          body: row.body,
          media_urls: row.media_urls || [],
          scheduled_for: row.scheduled_for,
          approved: true,
        }),
      });
    }
    await loadLedger();
  };

  const loadRow = (row: LedgerRow) => {
    setId(row.id);
    setPost(row.body || "");
    setImages(row.media_urls || []);
    setPickedImg(0);
    if (row.aspect && STUDIO_ASPECTS.includes(row.aspect as StudioAspect)) setAspect(row.aspect as StudioAspect);
    const stored = row.recipe || {};
    setRecipe({
      topic: stored.topic || "",
      lane: stored.lane || "",
      outlook: stored.outlook || "cynical",
      heat: stored.heat || "sharp",
      form: stored.form || "punchline",
      length: stored.length || "x",
      addressee: stored.addressee || "nobody",
      pack: stored.pack || "quiet",
      signoff: stored.signoff || "none",
      seed: stored.seed || "",
    });
    setHits([]);
    setMsg(row.status || "Loaded");
  };

  const dropRow = async (rowId: string) => {
    await fetch("/api/admin/x-posts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rowId }),
    });
    if (id === rowId) blank();
    await loadLedger();
  };

  const syncFromX = async () => {
    setBusy("sync");
    try {
      const res = await fetch("/api/admin/x-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Sync failed");
      setLedger(data.rows || []);
      setConnected(true);
      setMsg(`Pulled ${data.synced || 0}`);
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setBusy("");
    }
  };

  const chars = [...post].length;
  const over = chars > X_PREMIUM_CAP;
  const urlWarn = hasRawUrl(post);
  const locked = !!busy;
  const field = "w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-neutral-800 text-sm";
  const tweak = "px-3 py-2 rounded-lg border border-neutral-700 text-xs disabled:opacity-40";
  const zLabel = zernio?.handle ? `@${zernio.handle}` : handle;
  const zState = zernio?.ready || "missing key";

  const upcoming = useMemo(() => upcomingSlots(cadence), [cadence]);

  return (
    <div className="space-y-4 pb-28">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-amber-200/80">X Thoughts</p>
          <h1 className="text-2xl font-semibold text-neutral-50">Studio</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setPane("studio")} className={`px-3 py-1.5 rounded-lg text-xs border ${pane === "studio" ? "border-amber-400/50 text-amber-100" : "border-neutral-800 text-neutral-500"}`}>
            Compose
          </button>
          <button type="button" onClick={() => setPane("drop")} className={`px-3 py-1.5 rounded-lg text-xs border ${pane === "drop" ? "border-amber-400/50 text-amber-100" : "border-neutral-800 text-neutral-500"}`}>
            Drop
          </button>
        </div>
      </div>

      {pane === "drop" ? (
        <XDropPanel />
      ) : (
        <>
          <div className="rounded-2xl border border-neutral-800 bg-[#111] p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-neutral-100">
                {zLabel} · {zState}
              </p>
              <button
                type="button"
                onClick={() => saveCadence({ ...cadence, paused: !cadence.paused })}
                className="px-3 py-1.5 rounded-lg text-xs border border-amber-800/50 text-amber-100"
              >
                {cadence.paused ? "Resume" : "Pause"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {STUDIO_KINDS.map((k) => {
                const on = cadence.types.includes(k.id);
                return (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => {
                      const types = on ? cadence.types.filter((t) => t !== k.id) : [...cadence.types, k.id];
                      void saveCadence({ ...cadence, types: types.length ? types : ["thought"] });
                    }}
                    className={cx("px-3 py-2 rounded-full border text-[12px]", on ? SELECTED : IDLE)}
                  >
                    {k.label}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <label className="text-[11px] text-neutral-500">
                Per day
                <select
                  value={cadence.per_day}
                  onChange={(e) => void saveCadence({ ...cadence, per_day: Number(e.target.value) })}
                  className={field + " mt-1"}
                >
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
              <label className="text-[11px] text-neutral-500">
                Mode
                <select
                  value={cadence.mode}
                  onChange={(e) => void saveCadence({ ...cadence, mode: e.target.value as Cadence["mode"] })}
                  className={field + " mt-1"}
                >
                  <option value="review">Review first</option>
                  <option value="auto">Auto-send</option>
                </select>
              </label>
              <label className="text-[11px] text-neutral-500 col-span-2">
                Timezone
                <input
                  value={cadence.timezone}
                  onChange={(e) => void saveCadence({ ...cadence, timezone: e.target.value })}
                  className={field + " mt-1"}
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-1">
              {DAY_IDS.map((d) => {
                const on = cadence.days.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      const days = on ? cadence.days.filter((x) => x !== d.id) : [...cadence.days, d.id].sort();
                      void saveCadence({ ...cadence, days: days.length ? days : [1] });
                    }}
                    className={cx("px-2 py-1 rounded-lg text-[11px] border", on ? SELECTED : IDLE)}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2 items-end">
              {cadence.times.map((t, i) => (
                <input
                  key={i}
                  type="time"
                  value={t}
                  onChange={(e) => {
                    const times = [...cadence.times];
                    times[i] = e.target.value;
                    void saveCadence({ ...cadence, times });
                  }}
                  className={field + " w-32"}
                />
              ))}
              {cadence.times.length < 3 ? (
                <button
                  type="button"
                  className="text-xs text-amber-200"
                  onClick={() => void saveCadence({ ...cadence, times: [...cadence.times, "15:00"] })}
                >
                  Add clock
                </button>
              ) : null}
            </div>
            {upcoming.length ? (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {upcoming.slice(0, 8).map((s) => {
                  const attached = ledger.find((r) => r.scheduled_for && Math.abs(new Date(r.scheduled_for).getTime() - new Date(s.at).getTime()) < 180000);
                  return (
                    <div key={s.at} className="flex items-center justify-between gap-2 text-xs text-neutral-400">
                      <span>{new Date(s.at).toLocaleString()} {attached ? pill(attached.status) : <span className="text-neutral-600">open</span>}</span>
                      <div className="flex gap-2">
                        {attached ? (
                          <>
                            <button type="button" className="text-amber-200" onClick={() => loadRow(attached)}>Swap</button>
                            <button
                              type="button"
                              className="text-neutral-500"
                              onClick={() => void fetch("/api/admin/x-posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "skip", id: attached.id }) }).then(loadLedger)}
                            >
                              Skip
                            </button>
                          </>
                        ) : id ? (
                          <button type="button" className="text-amber-200" onClick={() => void queueDraft(s.at)}>Park here</button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-5 lg:items-start space-y-4 lg:space-y-0">
            <div className="order-2 lg:order-1 space-y-4">
              <div className="rounded-2xl border border-amber-900/30 bg-gradient-to-b from-amber-950/15 to-[#111] p-4 space-y-4">
                <div className="flex justify-between gap-2">
                  <button type="button" onClick={() => setShowRecipe((v) => !v)} className="text-xs text-amber-200">
                    {showRecipe ? "Hide mix" : "Mix"}
                  </button>
                  <div className="flex gap-2">
                    <button type="button" onClick={blank} className="px-3 py-1.5 rounded-lg text-xs border border-neutral-700">New</button>
                    <button type="button" onClick={() => setRecipe(surpriseXRecipe(recipe))} className="px-3 py-1.5 rounded-lg text-xs border border-amber-500/40 text-amber-200">Surprise</button>
                  </div>
                </div>
                <textarea
                  value={recipe.seed}
                  onChange={(e) => setField("seed", e.target.value)}
                  rows={3}
                  className={field + " text-[15px] leading-relaxed"}
                  placeholder="What you want to say. Or pick a hunt."
                />
                <div className="flex flex-wrap gap-2">
                  {STUDIO_KINDS.map((k) => (
                    <button key={k.id} type="button" onClick={() => setKind(k.id)} className={cx("px-3 py-2 rounded-full border text-[12px]", kind === k.id ? SELECTED : IDLE)}>
                      {k.label}
                    </button>
                  ))}
                </div>
                {showRecipe ? (
                  <div className="space-y-4">
                    <Chips label="Hunt" options={X_LANES.map((lane) => ({ id: lane.id, label: lane.label, emoji: lane.emoji, desc: lane.desc }))} value={recipe.lane} onChange={(n) => setField("lane", n)} variant="card" />
                    <Chips label="Vibe" options={OUTLOOKS} value={recipe.outlook} onChange={(n) => setField("outlook", n)} variant="card" />
                    <Chips label="Heat" options={HEATS} value={recipe.heat} onChange={(n) => setField("heat", n)} variant="heat" />
                    <Chips label="Shape" options={FORMS} value={recipe.form} onChange={(n) => setField("form", n)} variant="card" />
                    <Chips label="Length" options={X_LENGTHS} value={recipe.length} onChange={(n) => setField("length", n)} />
                    <Chips label="Who it's to" options={ADDRESSEES} value={recipe.addressee} onChange={(n) => setField("addressee", n)} />
                    <Chips label="Emotes" options={EMOTE_PACKS} value={recipe.pack} onChange={(n) => setField("pack", n)} />
                    <Chips label="Sign-off" options={SIGNOFFS} value={recipe.signoff} onChange={(n) => setField("signoff", n)} />
                    <label className="text-xs text-neutral-500 space-y-1 block">
                      Cut from a site thought
                      <select value={fromSlug} onChange={(e) => setFromSlug(e.target.value)} className={field}>
                        <option value="">New idea</option>
                        {rows.map((r) => (
                          <option key={r.id || r.slug} value={r.slug}>{r.title}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                ) : (
                  <p className="text-[11px] text-neutral-600">{describeXRecipe(recipe)}</p>
                )}
                <button type="button" onClick={() => run("fresh")} disabled={locked} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-rose-500 text-black font-semibold disabled:opacity-50">
                  {busy === "draft" ? "Writing…" : "Generate"}
                </button>
              </div>

              {options ? (
                <div className="space-y-2">
                  {X_CUTS.map((cut) => {
                    const body = options[cut.id];
                    const on = pickedCut === cut.id;
                    return (
                      <button
                        key={cut.id}
                        type="button"
                        onClick={() => {
                          setPickedCut(cut.id);
                          setPost(body);
                          void checkDupes(body);
                        }}
                        className={cx("w-full text-left rounded-2xl border p-4", on ? "border-amber-400/60 bg-amber-950/20" : "border-neutral-800 bg-black/30")}
                      >
                        <p className="text-[11px] uppercase tracking-[0.18em] text-amber-200/80">
                          {cut.emoji} {cut.label}{options.pick === cut.id ? " · strongest" : ""}
                        </p>
                        <p className="mt-2 text-sm text-neutral-100 whitespace-pre-wrap">{body}</p>
                      </button>
                    );
                  })}
                </div>
              ) : null}

              <div className="rounded-2xl border border-neutral-800 bg-[#111] p-4 space-y-3">
                <textarea
                  value={post}
                  onChange={(e) => setPost(e.target.value)}
                  onBlur={() => { if (post) checkDupes(post); }}
                  rows={7}
                  className={field + " font-medium leading-relaxed"}
                  placeholder="Draft lands here"
                />
                <div className="flex items-center justify-between text-xs">
                  <span className={over ? "text-red-400" : "text-neutral-500"}>{chars.toLocaleString()} / {X_PREMIUM_CAP.toLocaleString()}</span>
                  {msg ? <span className="text-amber-200">{msg}</span> : null}
                </div>
                {urlWarn ? <p className="text-xs text-amber-300">Raw link in the body. Looks spammy. Site stays in the bio.</p> : null}
                <div className="flex flex-wrap gap-2">
                  {(["funnier", "filthier", "softer", "meaner", "shorter", "longer", "emotes"] as const).map((t) => (
                    <button key={t} type="button" className={tweak} disabled={locked || !post} onClick={() => run(t)}>
                      {t[0].toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
                {hits.length ? (
                  <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-3 space-y-2">
                    <p className="text-xs text-amber-200">Too close. New angle.</p>
                    {hits.map((hit) => (
                      <p key={hit.id} className="text-xs text-neutral-400 line-clamp-3">
                        {Math.round(hit.score * 100)}% · {hit.body}
                      </p>
                    ))}
                    <button type="button" className={tweak} disabled={locked || !post} onClick={() => run("fresh")}>
                      New angle
                    </button>
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  {STUDIO_ASPECTS.map((a) => (
                    <button key={a} type="button" onClick={() => setAspect(a)} className={cx(tweak, aspect === a && "border-amber-400 text-amber-100")}>{a}</button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {STUDIO_LOOKS.map((l) => (
                    <button key={l.id} type="button" onClick={() => setLook(l.id)} className={cx("px-3 py-1.5 rounded-full border text-[12px]", look === l.id ? SELECTED : IDLE)}>{l.label}</button>
                  ))}
                </div>
                <textarea value={picGuide} onChange={(e) => setPicGuide(e.target.value)} rows={2} className={field} placeholder="Still direction. No text in the image." />
                <div className="flex flex-wrap gap-2 items-center">
                  <button type="button" onClick={() => setPicN(1)} className={cx(tweak, picN === 1 && "border-amber-400")}>1 still</button>
                  <button type="button" onClick={() => setPicN(3)} className={cx(tweak, picN === 3 && "border-amber-400")}>3 stills</button>
                  <button type="button" onClick={() => makeImage()} disabled={locked} className="px-3 py-2 rounded-lg bg-amber-400 text-black text-xs font-semibold disabled:opacity-40">
                    {busy === "pic" ? "Making…" : "Make still"}
                  </button>
                  <label className="text-xs text-neutral-400 border border-neutral-800 rounded-lg px-3 py-2">
                    Upload
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadFile(f); }} />
                  </label>
                </div>
                {images.length ? (
                  <div className="grid grid-cols-3 gap-2">
                    {images.map((src, i) => (
                      <button key={src} type="button" onClick={() => setPickedImg(i)} className={cx("rounded-xl overflow-hidden border", i === pickedImg ? "border-amber-300" : "border-neutral-800")}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="h-20 w-full object-cover" />
                      </button>
                    ))}
                    <button type="button" className="text-[11px] text-neutral-500" onClick={() => { const next = images.filter((_, i) => i !== pickedImg); setImages(next); setPickedImg(0); if (id) void persistMedia(id, next); }}>
                      Remove
                    </button>
                    <button type="button" className="text-[11px] text-neutral-500" onClick={() => makeImage(pickedImg)}>Regen</button>
                    <button type="button" className="text-[11px] text-neutral-500" onClick={downloadPic}>Download</button>
                  </div>
                ) : null}
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2">
                  <input type="datetime-local" value={queueAt} onChange={(e) => setQueueAt(e.target.value)} className={field} />
                  <button type="button" onClick={() => queueDraft()} disabled={locked || !post} className="px-4 py-2.5 rounded-xl border border-amber-700/50 text-amber-100 text-sm font-medium disabled:opacity-40">
                    Queue
                  </button>
                  <button type="button" onClick={copy} disabled={!post} className="px-4 py-2.5 rounded-xl border border-neutral-700 text-sm disabled:opacity-40">
                    Copy text
                  </button>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2 lg:sticky lg:top-4 space-y-3">
              <XPhoneMock body={post} image={image} aspect={aspect} handle={handle} />
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-[#111] p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-neutral-100">Queue & history</p>
              <div className="flex flex-wrap gap-2">
                {(["all", "draft", "queued", "sent"] as const).map((key) => (
                  <button key={key} type="button" onClick={() => setFilter(key)} className={cx("px-2.5 py-1 rounded-lg text-[11px] border", filter === key ? SELECTED : IDLE)}>{key}</button>
                ))}
                <button type="button" onClick={syncFromX} disabled={busy === "sync" || !connected} className="px-3 py-1.5 rounded-lg text-xs border border-neutral-700 disabled:opacity-40">
                  Sync
                </button>
              </div>
            </div>
            <div className="space-y-2 max-h-[420px] overflow-y-auto">
              {shown.map((row) => (
                <div key={row.id} className="rounded-xl border border-neutral-800 p-3 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    {pill(row.status || (row.posted_at ? "sent" : "draft"))}
                    <div className="flex gap-2 text-[11px]">
                      <button type="button" className="text-amber-200" onClick={() => loadRow(row)}>Load</button>
                      {row.status === "queued" && !row.approved ? (
                        <button type="button" className="text-emerald-200" onClick={() => void approveRow(row)}>Approve</button>
                      ) : null}
                      <button type="button" className="text-neutral-600" onClick={() => void dropRow(row.id)}>Remove</button>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-200 whitespace-pre-wrap line-clamp-3">{row.body}</p>
                  {row.fail_reason ? <p className="text-[11px] text-red-300">{row.fail_reason}</p> : null}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-[#111] p-4 space-y-3">
            <p className="text-sm text-neutral-100">Send layer</p>
            <input
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.target.value)}
              className={field}
              placeholder={zernio?.key_hint ? `Key ${zernio.key_hint}` : "API key"}
              type="password"
              autoComplete="off"
            />
            <input
              value={accountDraft}
              onChange={(e) => setAccountDraft(e.target.value)}
              className={field}
              placeholder="X account id"
            />
            <input
              value={spendCap}
              onChange={(e) => setSpendCap(e.target.value === "" ? "" : Number(e.target.value))}
              className={field}
              placeholder="Monthly spend cap reminder"
              type="number"
            />
            <button
              type="button"
              className="px-4 py-2 rounded-xl border border-amber-800/50 text-amber-100 text-sm"
              onClick={() =>
                void saveCadence(cadence, {
                  zernio_key: keyDraft,
                  zernio_account_id: accountDraft,
                  spend_cap: spendCap === "" ? null : spendCap,
                })
              }
            >
              Save
            </button>
          </div>
        </>
      )}

      {pane === "studio" ? (
        <div className="fixed bottom-0 inset-x-0 z-20 border-t border-neutral-800 bg-black/90 backdrop-blur px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
          <div className="flex gap-2">
            <button type="button" onClick={() => run("fresh")} disabled={locked} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-rose-500 text-black font-semibold disabled:opacity-40">
              Generate
            </button>
            <button type="button" onClick={sendNow} disabled={locked || !post} className="flex-1 py-3 rounded-xl border border-amber-400/50 text-amber-100 font-semibold disabled:opacity-40">
              Send now
            </button>
          </div>
        </div>
      ) : null}

      {pane === "studio" ? (
        <div className="hidden lg:flex gap-2">
          <button type="button" onClick={sendNow} disabled={locked || !post} className="px-5 py-3 rounded-xl border border-amber-400/50 text-amber-100 font-semibold disabled:opacity-40">
            Send now
          </button>
          <button type="button" onClick={copy} disabled={!post} className="px-5 py-3 rounded-xl border border-neutral-700 text-sm">
            Copy text
          </button>
        </div>
      ) : null}
    </div>
  );
}
