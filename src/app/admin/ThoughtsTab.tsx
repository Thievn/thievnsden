"use client";

import { useEffect, useState } from "react";
import {
  ADDRESSEES,
  CLASSICS,
  FORMS,
  HEATS,
  LENGTHS,
  OUTLOOKS,
  type ThoughtPick,
} from "@/lib/thoughts-packs";
import { describeRecipe, emptyRecipe, surpriseRecipe, thoughtFingerprint, type ThoughtRecipe } from "@/lib/thought-studio";
import { readJson } from "@/lib/read-json";

type Hit = { id: string; score: number; title: string; excerpt: string; published: boolean };

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const SELECTED = "border-rose-300/70 text-white bg-rose-950/55 shadow-[0_0_0_1px_rgba(251,113,133,0.28)]";
const IDLE = "border-white/10 text-neutral-300 bg-black/35 hover:border-rose-400/35 hover:text-white";

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
        <p className="text-[11px] uppercase tracking-[0.22em] text-rose-200/70">{label}</p>
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

export function ThoughtsTab() {
  const [recipe, setRecipe] = useState<ThoughtRecipe>(emptyRecipe);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [slug, setSlug] = useState("");
  const [cover, setCover] = useState("");
  const [look, setLook] = useState("");
  const [id, setId] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [hits, setHits] = useState<Hit[]>([]);
  const [filter, setFilter] = useState<"all" | "draft" | "live">("all");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");

  const setField = (key: keyof ThoughtRecipe, value: string) =>
    setRecipe((prev) => ({ ...prev, [key]: value }));

  const load = async () => {
    const res = await fetch("/api/admin/thoughts");
    const data = await readJson(res);
    setRows(data.rows || []);
    if (data.error) setMsg(data.error);
  };

  useEffect(() => {
    load();
  }, []);

  const shown = rows.filter((row) => {
    if (filter === "draft") return !row.published;
    if (filter === "live") return row.published;
    return true;
  });

  const surprise = () => {
    setRecipe(surpriseRecipe(recipe));
  };

  const blank = () => {
    setId("");
    setTitle("");
    setExcerpt("");
    setBody("");
    setSlug("");
    setCover("");
    setLook("");
    setHits([]);
    setMsg("Fresh page");
  };

  const draft = async (tweak = "fresh") => {
    setBusy(tweak === "fresh" ? "draft" : tweak);
    setMsg("");
    try {
      const res = await fetch("/api/admin/thoughts/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...recipe,
          tweak,
          id: tweak === "fresh" ? "" : id,
          title,
          excerpt,
          body,
        }),
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Draft failed");
      setId(data.id || "");
      setTitle(data.title || "");
      setExcerpt(data.excerpt || "");
      setBody(data.body || "");
      setSlug(data.slug || "");
      setHits(data.hits || []);
      setMsg(tweak === "fresh" ? `Saved to your vault · ${data.mix || ""}` : "Rewritten and saved");
      await load();
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setBusy("");
    }
  };

  const makeCover = async () => {
    if (!title) return setMsg("Draft a title first");
    setBusy("cover");
    setMsg("");
    try {
      const res = await fetch("/api/admin/thoughts/cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, excerpt: excerpt || body.slice(0, 280) }),
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Cover failed");
      if (!data.cover_url) throw new Error("Cover did not return a picture");
      setCover(String(data.cover_url));
      setLook(data.look || "");
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setBusy("");
    }
  };

  const headerClassic = async (c: (typeof CLASSICS)[number]) => {
    setBusy(c.slug);
    setMsg("");
    try {
      const res = await fetch("/api/admin/thoughts/cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: c.title, excerpt: c.excerpt }),
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Cover failed");
      const save = await fetch("/api/admin/thoughts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: c.slug,
          title: c.title,
          excerpt: c.excerpt,
          body: "Classic essay.",
          cover_url: data.cover_url,
          topic: c.pack,
          published: true,
        }),
      });
      const saved = await readJson(save);
      if (!save.ok) throw new Error(saved.error || "Save failed");
      setMsg(`Header on ${c.slug}`);
      await load();
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setBusy("");
    }
  };

  const save = async (published: boolean) => {
    setBusy("save");
    setMsg("");
    try {
      const res = await fetch("/api/admin/thoughts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          title,
          excerpt,
          body,
          cover_url: cover || null,
          outlook: recipe.outlook,
          heat: recipe.heat,
          form: recipe.form,
          topic: recipe.topic || null,
          recipe,
          fingerprint: thoughtFingerprint(title, excerpt, body),
          published,
        }),
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Save failed");
      if (data.row?.id) setId(data.row.id);
      setMsg(published ? "Live on Thoughts" : "Saved as draft");
      await load();
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setBusy("");
    }
  };

  const loadRow = (row: any) => {
    setId(row.id || "");
    setTitle(row.title || "");
    setExcerpt(row.excerpt || "");
    setBody(row.body || "");
    setSlug(row.slug || "");
    setCover(row.cover_url || "");
    setLook("");
    const stored = row.recipe || {};
    setRecipe({
      topic: stored.topic || "",
      outlook: stored.outlook || row.outlook || "honest",
      heat: stored.heat || row.heat || "sharp",
      form: stored.form || row.form || "essay",
      length: stored.length || "medium",
      addressee: stored.addressee || "nobody",
      seed: stored.seed || "",
    });
    setHits([]);
    setMsg(`Loaded ${row.slug}`);
  };

  const field = "w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-neutral-800 text-sm";
  const tweak = "px-3 py-2 rounded-lg border border-neutral-700 text-xs disabled:opacity-40";
  const mix = describeRecipe(recipe);

  return (
    <div className="space-y-6 pb-16">
      <div className="rounded-2xl border border-rose-900/30 bg-gradient-to-b from-rose-950/25 to-[#111] p-5 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-neutral-100 font-medium">Thought studio</p>
            <p className="text-xs text-neutral-500 mt-1">
              Pick a vibe or surprise yourself. Every draft lands in Supabase so the next one cannot copy it.
            </p>
            <p className="text-[11px] text-rose-200/70 mt-2">{mix}</p>
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

        <Chips label="Vibe" hint="Nice through unhinged. All of it is allowed." options={OUTLOOKS} value={recipe.outlook} onChange={(id) => setField("outlook", id)} variant="card" />
        <Chips label="Heat" options={HEATS} value={recipe.heat} onChange={(id) => setField("heat", id)} variant="heat" />
        <Chips label="Shape" options={FORMS} value={recipe.form} onChange={(id) => setField("form", id)} variant="card" />
        <Chips label="Length" options={LENGTHS} value={recipe.length} onChange={(id) => setField("length", id)} />
        <Chips label="Who it's to" options={ADDRESSEES} value={recipe.addressee} onChange={(id) => setField("addressee", id)} />

        <textarea
          value={recipe.seed}
          onChange={(e) => setField("seed", e.target.value)}
          rows={2}
          className={field}
          placeholder="Optional extra direction — a name, a night, a sentence you cannot stop thinking"
        />
        <button
          type="button"
          onClick={() => draft("fresh")}
          disabled={!!busy}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-400 text-black font-semibold disabled:opacity-50"
        >
          {busy === "draft" ? "Writing…" : "Draft thought"}
        </button>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={field} placeholder="Title" />
        <input value={slug} onChange={(e) => setSlug(e.target.value)} className={field} placeholder="slug" />
        <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} className={field} placeholder="Excerpt" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={14} className={field + " leading-relaxed"} placeholder="Body" />
        <div className="flex flex-wrap gap-2">
          <button type="button" className={tweak} disabled={!!busy || !body} onClick={() => draft("funnier")}>Funnier</button>
          <button type="button" className={tweak} disabled={!!busy || !body} onClick={() => draft("filthier")}>Filthier</button>
          <button type="button" className={tweak} disabled={!!busy || !body} onClick={() => draft("softer")}>Softer</button>
          <button type="button" className={tweak} disabled={!!busy || !body} onClick={() => draft("meaner")}>Meaner</button>
          <button type="button" className={tweak} disabled={!!busy || !body} onClick={() => draft("shorter")}>Shorter</button>
          <button type="button" className={tweak} disabled={!!busy || !body} onClick={() => draft("longer")}>Longer</button>
        </div>
        {hits.length ? (
          <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-3 space-y-1">
            <p className="text-xs text-amber-200">Close to something already in the vault.</p>
            {hits.map((hit) => (
              <p key={hit.id} className="text-xs text-neutral-400">
                <span className="text-amber-100">{Math.round(hit.score * 100)}%</span>
                {" · "}
                {hit.published ? "live" : "draft"}
                {" · "}
                {hit.title}
              </p>
            ))}
          </div>
        ) : body ? (
          <p className="text-xs text-neutral-600">No close match in the vault.</p>
        ) : null}
        <div className="flex flex-wrap gap-2 items-center">
          <button type="button" onClick={makeCover} disabled={!!busy} className="px-4 py-2 rounded-lg border border-neutral-700 text-sm">
            {busy === "cover" ? "Making header…" : cover ? "New header" : "Make header"}
          </button>
          {look ? <span className="text-[11px] text-neutral-500">{look}</span> : null}
        </div>
        {cover && (
          <div className="relative w-full aspect-[16/9] overflow-hidden rounded-xl border border-neutral-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover" />
          </div>
        )}
        <div className="flex gap-2">
          <button type="button" onClick={() => save(false)} disabled={!!busy || !title || !slug} className="flex-1 py-2.5 rounded-xl border border-neutral-700 text-sm">
            Save draft
          </button>
          <button type="button" onClick={() => save(true)} disabled={!!busy || !title || !slug} className="flex-1 py-2.5 rounded-xl bg-neutral-100 text-black text-sm font-medium">
            Publish
          </button>
        </div>
        {msg && <p className="text-xs text-amber-200">{msg}</p>}
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Vault · {rows.length}</p>
          <div className="flex gap-1">
            {(["all", "draft", "live"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={cx("px-2.5 py-1 rounded-lg text-[11px] border", filter === key ? SELECTED : IDLE)}
              >
                {key}
              </button>
            ))}
          </div>
        </div>
        {!shown.length ? (
          <p className="text-xs text-neutral-600">Nothing stored yet. Draft one and it stays here even if you never publish.</p>
        ) : (
          shown.map((r) => (
            <div key={r.id} className="rounded-xl border border-neutral-800 bg-[#0c0c0c] p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-neutral-200 truncate">{r.title}</p>
                <p className="text-[11px] text-neutral-500">
                  {r.slug} · {r.published ? "live" : "draft"}
                  {r.outlook ? ` · ${r.outlook}` : ""}
                  {r.form ? ` · ${r.form}` : ""}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button type="button" onClick={() => loadRow(r)} className="text-[11px] text-fuchsia-300">
                  Load
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await fetch("/api/admin/thoughts", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: r.id, published: !r.published }),
                    });
                    load();
                  }}
                  className="text-[11px] text-neutral-400"
                >
                  {r.published ? "Hide" : "Live"}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm("Delete from the vault?")) return;
                    await fetch("/api/admin/thoughts", {
                      method: "DELETE",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: r.id }),
                    });
                    if (id === r.id) blank();
                    load();
                  }}
                  className="text-[11px] text-red-400"
                >
                  Del
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-3">
        <p className="text-xs uppercase tracking-wide text-neutral-500">Headers for the original six</p>
        {CLASSICS.map((c) => {
          const existing = rows.find((r) => r.slug === c.slug);
          return (
            <div key={c.slug} className="flex items-center justify-between gap-3">
              <p className="text-sm text-neutral-300 truncate">{c.title}</p>
              <button type="button" disabled={!!busy} onClick={() => headerClassic(c)} className="text-[11px] text-fuchsia-300 shrink-0">
                {busy === c.slug ? "Making…" : existing?.cover_url ? "Remake header" : "Make header"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
