"use client";

import { useEffect, useState } from "react";
import { XDropPanel } from "@/app/admin/XDropPanel";
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
import { readJson } from "@/lib/read-json";

type LedgerRow = {
  id: string;
  post_id: string | null;
  url: string | null;
  body: string;
  source: string;
  posted_at: string | null;
  recipe?: Partial<XRecipe> | null;
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

const SELECTED = "border-sky-300/70 text-white bg-sky-950/55 shadow-[0_0_0_1px_rgba(56,189,248,0.28)]";
const IDLE = "border-white/10 text-neutral-300 bg-black/35 hover:border-sky-400/35 hover:text-white";

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
        <p className="text-[11px] uppercase tracking-[0.22em] text-sky-200/70">{label}</p>
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

export function XThoughtsTab() {
  const [pane, setPane] = useState<"drop" | "thoughts">("thoughts");
  const [recipe, setRecipe] = useState<XRecipe>(emptyXRecipe);
  const [options, setOptions] = useState<{ dry: string; mean: string; unhinged: string; pick: XVoiceCut } | null>(null);
  const [pickedCut, setPickedCut] = useState<XVoiceCut>("mean");
  const [fromSlug, setFromSlug] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [post, setPost] = useState("");
  const [id, setId] = useState("");
  const [image, setImage] = useState("");
  const [look, setLook] = useState("");
  const [scene, setScene] = useState("");
  const [picGuide, setPicGuide] = useState("");
  const [aspect, setAspect] = useState<"16:9" | "9:16">("16:9");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [hits, setHits] = useState<DupHit[]>([]);
  const [filter, setFilter] = useState<"all" | "draft" | "posted">("all");
  const [connected, setConnected] = useState(false);
  const [handle, setHandle] = useState("Thievn");
  const [postedUrl, setPostedUrl] = useState("");

  const setField = (key: keyof XRecipe, value: string) =>
    setRecipe((prev) => ({ ...prev, [key]: value }));

  const loadLedger = async () => {
    const res = await fetch("/api/admin/x-posts");
    const data = await readJson(res);
    setLedger(data.rows || []);
    setConnected(Boolean(data.connected));
    if (data.handle) setHandle(data.handle);
  };

  useEffect(() => {
    fetch("/api/admin/thoughts")
      .then((r) => r.json())
      .then((d) => setRows(d.rows || []))
      .catch(() => {});
    loadLedger().catch(() => {});
  }, []);

  const shown = ledger.filter((row) => {
    if (filter === "draft") return !row.posted_at;
    if (filter === "posted") return Boolean(row.posted_at);
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

  const surprise = () => {
    setRecipe(surpriseXRecipe(recipe));
  };

  const blank = () => {
    setId("");
    setPost("");
    setImage("");
    setLook("");
    setScene("");
    setHits([]);
    setPostedUrl("");
    setFromSlug("");
    setOptions(null);
    setMsg("Fresh page");
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
      setMsg(tweak === "fresh" ? `Three cuts · ${data.mix || ""}` : "Rewritten and saved");
      await loadLedger();
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setBusy("");
    }
  };

  const makeImage = async () => {
    if (!post && !recipe.seed && !picGuide) {
      setMsg("Draft first, or write what the still should show.");
      return;
    }
    setBusy("pic");
    setLook("");
    setScene("");
    setMsg("");
    try {
      const res = await fetch("/api/admin/x-thoughts/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: recipe.topic, post, seed: recipe.seed, guide: picGuide, aspect }),
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Image failed");
      setImage(data.image || "");
      setLook(data.look || data.style || "");
      setScene(data.scene || "");
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setBusy("");
    }
  };

  const copy = async () => {
    if (!post) return;
    const found = await checkDupes(post);
    await navigator.clipboard.writeText(post);
    setMsg(found.length ? "Copied — check the near-dupes first" : "Copied");
  };

  const markPosted = async () => {
    if (!post && !postedUrl) {
      setMsg("Draft or paste the live X link first.");
      return;
    }
    setBusy("posted");
    setMsg("");
    try {
      const res = await fetch("/api/admin/x-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "log", body: post, url: postedUrl, id }),
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Could not save");
      setPostedUrl("");
      setMsg("Saved to your private X log");
      await loadLedger();
      await checkDupes(post);
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setBusy("");
    }
  };

  const syncFromX = async () => {
    setBusy("sync");
    setMsg("");
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
      setMsg(`Pulled ${data.synced || 0} posts from @${data.handle || handle}`);
      if (post) await checkDupes(post);
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setBusy("");
    }
  };

  const dropRow = async (rowId: string) => {
    await fetch("/api/admin/x-posts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rowId }),
    });
    if (id === rowId) blank();
    await loadLedger();
    if (post && id !== rowId) await checkDupes(post);
  };

  const loadRow = (row: LedgerRow) => {
    setId(row.id);
    setPost(row.body || "");
    setPostedUrl(row.url || "");
    setImage("");
    setLook("");
    const stored = row.recipe || {};
    const next: XRecipe = {
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
    };
    setRecipe(next);
    setHits([]);
    setMsg(row.posted_at ? "Loaded posted post" : "Loaded draft");
  };

  const downloadPic = async () => {
    if (!image) return;
    try {
      const res = await fetch(image);
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `x-thought-${aspect.replace(":", "x")}-${recipe.topic || "den"}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
      setMsg("Downloaded");
    } catch {
      window.open(image, "_blank");
    }
  };

  const field = "w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-neutral-800 text-sm";
  const tweak = "px-3 py-2 rounded-lg border border-neutral-700 text-xs disabled:opacity-40";
  const chars = [...post].length;
  const over = chars > X_PREMIUM_CAP;
  const frame = aspect === "9:16" ? "aspect-[9/16] max-w-[200px] mx-auto" : "aspect-[16/9] w-full";
  const mix = describeXRecipe(recipe);
  const locked = !!busy;

  return (
    <div className="space-y-4 pb-28">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setPane("drop")}
          className={`px-3 py-1.5 rounded-lg text-xs border ${
            pane === "drop" ? "border-amber-400/50 text-amber-100" : "border-neutral-800 text-neutral-500"
          }`}
        >
          Drop for X
        </button>
        <button
          type="button"
          onClick={() => setPane("thoughts")}
          className={`px-3 py-1.5 rounded-lg text-xs border ${
            pane === "thoughts" ? "border-sky-500/50 text-sky-100" : "border-neutral-800 text-neutral-500"
          }`}
        >
          Write a thought
        </button>
      </div>

      {pane === "drop" ? <XDropPanel /> : (
      <>
      <div className="rounded-2xl border border-sky-900/30 bg-gradient-to-b from-sky-950/20 to-[#111] p-4 sm:p-5 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-neutral-100 font-medium">X thought studio</p>
            <p className="text-xs text-neutral-500 mt-1">
              Type what you want, or pick a lane Grok can hunt. You get dry, mean, and unhinged — copy and paste straight to X.
            </p>
            <p className="text-[11px] text-sky-200/70 mt-2">{mix}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={blank} className="px-3 py-1.5 rounded-lg text-xs border border-neutral-700 text-neutral-300">
              New
            </button>
            <button type="button" onClick={surprise} className="px-3 py-1.5 rounded-lg text-xs border border-amber-500/40 text-amber-200">
              Surprise me
            </button>
          </div>
        </div>

        <label className="block space-y-1">
          <span className="text-[11px] uppercase tracking-[0.22em] text-sky-200/70">Your box</span>
          <textarea
            value={recipe.seed}
            onChange={(e) => setField("seed", e.target.value)}
            rows={4}
            className={field + " text-[15px] leading-relaxed"}
            placeholder="What do you want to say — a night, a person-type, a current-event feeling, a sentence you cannot stop thinking. Leave empty and pick a lane."
          />
        </label>
        <Chips
          label="Hunt"
          hint="General lanes. Not essay titles. Grok finds the pattern people are actually in."
          options={X_LANES.map((lane) => ({ id: lane.id, label: lane.label, emoji: lane.emoji, desc: lane.desc }))}
          value={recipe.lane}
          onChange={(next) => setField("lane", next)}
          variant="card"
        />
        <Chips label="Vibe" hint="Mixer on top of the three cuts. Optional." options={OUTLOOKS} value={recipe.outlook} onChange={(next) => setField("outlook", next)} variant="card" />
        <Chips label="Heat" options={HEATS} value={recipe.heat} onChange={(next) => setField("heat", next)} variant="heat" />
        <Chips label="Shape" options={FORMS} value={recipe.form} onChange={(next) => setField("form", next)} variant="card" />
        <Chips label="Length" options={X_LENGTHS} value={recipe.length} onChange={(next) => setField("length", next)} />
        <Chips label="Who it's to" options={ADDRESSEES} value={recipe.addressee} onChange={(next) => setField("addressee", next)} />
        <Chips label="Emotes" options={EMOTE_PACKS} value={recipe.pack} onChange={(next) => setField("pack", next)} />
        <Chips label="Sign-off" options={SIGNOFFS} value={recipe.signoff} onChange={(next) => setField("signoff", next)} />

        <label className="text-xs text-neutral-500 space-y-1 block">
          Cut from a site thought
          <select value={fromSlug} onChange={(e) => setFromSlug(e.target.value)} className={field}>
            <option value="">New idea</option>
            {rows.map((r) => (
              <option key={r.id || r.slug} value={r.slug}>{r.title}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => run("fresh")}
          disabled={locked}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-rose-400 text-black font-semibold disabled:opacity-50"
        >
          {busy === "draft" ? "Writing three cuts…" : "Write 3 for X"}
        </button>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-3">
        {options ? (
          <div className="grid grid-cols-1 gap-3">
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
                  className={cx(
                    "text-left rounded-2xl border p-4 space-y-2",
                    on ? "border-sky-400/60 bg-sky-950/30" : "border-neutral-800 bg-black/30",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-sky-200/80">
                      {cut.emoji} {cut.label}
                      {options.pick === cut.id ? " · strongest" : ""}
                    </p>
                    <span
                      role="button"
                      tabIndex={0}
                      className="text-[11px] text-neutral-300 underline-offset-2 hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        void navigator.clipboard.writeText(body);
                        setMsg(`Copied ${cut.label}`);
                      }}
                    >
                      Copy
                    </span>
                  </div>
                  <p className="text-sm text-neutral-100 whitespace-pre-wrap leading-relaxed">{body}</p>
                </button>
              );
            })}
            <p className="text-[12px] text-neutral-500">Tap a cut to edit it below. Copy pastes it ready for X.</p>
          </div>
        ) : null}
        <textarea
          value={post}
          onChange={(e) => setPost(e.target.value)}
          onBlur={() => { if (post) checkDupes(post); }}
          rows={8}
          className={field + " font-medium leading-relaxed"}
          placeholder="Draft lands here"
        />
        <div className="flex items-center justify-between text-xs">
          <span className={over ? "text-red-400" : "text-neutral-500"}>{chars.toLocaleString()} / {X_PREMIUM_CAP.toLocaleString()}</span>
          {msg && <span className="text-amber-200">{msg}</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={tweak} disabled={locked || !post} onClick={() => run("funnier")}>Funnier</button>
          <button type="button" className={tweak} disabled={locked || !post} onClick={() => run("filthier")}>Filthier</button>
          <button type="button" className={tweak} disabled={locked || !post} onClick={() => run("softer")}>Softer</button>
          <button type="button" className={tweak} disabled={locked || !post} onClick={() => run("meaner")}>Meaner</button>
          <button type="button" className={tweak} disabled={locked || !post} onClick={() => run("shorter")}>Shorter</button>
          <button type="button" className={tweak} disabled={locked || !post} onClick={() => run("longer")}>Longer</button>
          <button type="button" className={tweak} disabled={locked || !post} onClick={() => run("emotes")}>Add emotes</button>
        </div>
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.22em] text-sky-200/70">Pic direction</p>
          <textarea
            value={picGuide}
            onChange={(e) => setPicGuide(e.target.value)}
            rows={2}
            className={field}
            placeholder="What the still should show — phones face-down in rain, a blank group chat, no people. Leave empty and it still follows the draft."
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <button type="button" onClick={() => setAspect("16:9")} className={`${tweak} ${aspect === "16:9" ? "border-sky-400 text-sky-100" : ""}`}>16:9</button>
          <button type="button" onClick={() => setAspect("9:16")} className={`${tweak} ${aspect === "9:16" ? "border-sky-400 text-sky-100" : ""}`}>9:16</button>
          <button type="button" onClick={makeImage} disabled={locked || (!post && !recipe.seed && !picGuide)} className="px-3 py-2 rounded-lg bg-sky-400 text-black text-xs font-semibold disabled:opacity-40">
            {busy === "pic" ? "Making…" : image ? "New pic" : "Make pic"}
          </button>
          <button type="button" onClick={copy} disabled={!post} className="ml-auto px-4 py-2 rounded-lg bg-neutral-100 text-black text-xs font-medium">Copy</button>
        </div>
        {hits.length ? (
          <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-3 space-y-2">
            <p className="text-xs text-amber-200">This draft is close to something already stored.</p>
            {hits.map((hit) => (
              <div key={hit.id} className="text-xs text-neutral-400">
                <span className="text-amber-100">{Math.round(hit.score * 100)}% · </span>
                {hit.url ? (
                  <a href={hit.url} target="_blank" rel="noreferrer" className="text-sky-300 hover:underline">
                    open on X
                  </a>
                ) : (
                  <span>{hit.kind === "thought" ? "site thought" : hit.posted_at ? "already posted" : "already stored"}</span>
                )}
                <p className="mt-1 text-neutral-300 line-clamp-3">{hit.body}</p>
              </div>
            ))}
          </div>
        ) : post ? (
          <p className="text-xs text-neutral-600">No close match in your log.</p>
        ) : null}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 pt-1">
          <input
            value={postedUrl}
            onChange={(e) => setPostedUrl(e.target.value)}
            className={field}
            placeholder="After you post: paste https://x.com/Thievn/status/…"
          />
          <button type="button" onClick={markPosted} disabled={locked} className="px-3 py-2 rounded-lg border border-sky-500/40 text-sky-100 text-xs">
            Mark posted
          </button>
        </div>
        {image ? (
          <div className="space-y-2 pt-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" className={`rounded-xl border border-neutral-800 object-cover ${frame}`} />
            {look ? <p className="text-[11px] text-neutral-500">{look}</p> : null}
            {scene ? <p className="text-[11px] text-neutral-600 line-clamp-3">{scene}</p> : null}
            <button type="button" onClick={downloadPic} className="w-full py-2.5 rounded-xl text-sm border border-neutral-700 text-neutral-100">
              Download for X
            </button>
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-neutral-100 font-medium">Your X log · {ledger.length}</p>
            <p className="text-xs text-neutral-500 mt-1">
              {connected
                ? `Live pull is on for @${handle}. Sync only when you need it — it spends X credits.`
                : "Add X_BEARER_TOKEN on Vercel to pull live posts. Until then, mark posts by hand."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["all", "draft", "posted"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={cx("px-2.5 py-1 rounded-lg text-[11px] border", filter === key ? SELECTED : IDLE)}
              >
                {key}
              </button>
            ))}
            <button type="button" onClick={syncFromX} disabled={busy === "sync" || !connected} className="px-3 py-1.5 rounded-lg text-xs border border-sky-500/40 text-sky-200 disabled:opacity-40">
              {busy === "sync" ? "Pulling…" : "Sync from X"}
            </button>
          </div>
        </div>
        {!shown.length ? (
          <p className="text-xs text-neutral-600">Nothing logged yet. Draft one and it stays here even if you never post.</p>
        ) : (
          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {shown.map((row) => (
              <div key={row.id} className="rounded-xl border border-neutral-800 p-3 space-y-1">
                <div className="flex items-center justify-between gap-2 text-[11px] text-neutral-500">
                  <span>
                    {row.posted_at ? new Date(row.posted_at).toLocaleString() : "draft"} · {row.source}
                    {row.recipe?.outlook ? ` · ${row.recipe.outlook}` : ""}
                    {row.recipe?.form ? ` · ${row.recipe.form}` : ""}
                  </span>
                  <div className="flex gap-2 shrink-0">
                    <button type="button" onClick={() => loadRow(row)} className="text-sky-300 hover:text-sky-100">
                      Load
                    </button>
                    <button type="button" onClick={() => dropRow(row.id)} className="text-neutral-600 hover:text-red-300">
                      Remove
                    </button>
                  </div>
                </div>
                <p className="text-sm text-neutral-200 whitespace-pre-wrap line-clamp-4">{row.body}</p>
                {row.url ? (
                  <a href={row.url} target="_blank" rel="noreferrer" className="text-xs text-sky-300 hover:underline">
                    Open on X
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
}
