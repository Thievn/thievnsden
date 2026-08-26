"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SeedQueuePanel } from "@/app/admin/SeedQueuePanel";
import { DenChips } from "@/components/face-the-den/DenChips";
import { RarityFrame } from "@/components/RarityFrame";
import { getRarity } from "@/lib/rarity";
import {
  AGE_CHIPS,
  BODY_CHIPS,
  CAMERA_CHIPS,
  CAST_PACKS,
  CHEST_CHIPS,
  EMPTY_DRAFT,
  EXPRESSION_CHIPS,
  FACE_SHAPE_CHIPS,
  FILTHY_CHIPS,
  FOCUS_CHIPS,
  GENDER_CHIPS,
  HAIR_COLOR_CHIPS,
  HEAT_CHIPS,
  HEIGHT_CHIPS,
  LOOK_CHIPS,
  MARK_CHIPS,
  PLACE_CHIPS,
  POSE_CHIPS,
  STYLE_CHIPS,
  clothesChipsFor,
  draftToFilters,
  hairChipsFor,
  randomizeCastDraft,
  type CastDraft,
} from "@/lib/demo-cast-options";

type Demo = {
  id: string;
  username: string;
  style: string;
  focus: string;
  filthy_mode?: string | null;
  score: number;
  rarity: string;
  verdict: string;
  image_url?: string | null;
  is_public: boolean;
  likes: number;
  dislikes: number;
  created_at: string;
  heat?: string | null;
  cast_recipe?: Record<string, unknown> | null;
};

export function SeedsTab() {
  const [demos, setDemos] = useState<Demo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [makePublic, setMakePublic] = useState(true);
  const [advanced, setAdvanced] = useState(false);
  const [draft, setDraft] = useState<CastDraft>(EMPTY_DRAFT);

  const set = <K extends keyof CastDraft>(key: K, value: CastDraft[K]) => {
    setDraft((d) => {
      const next = { ...d, [key]: value };
      if (key === "gender" || key === "heat") next.outfit = "random";
      if (key === "style" && value !== "filthy") next.filthyMode = "mixed";
      return next;
    });
  };

  const clothes = useMemo(
    () => clothesChipsFor(draft.gender, draft.heat),
    [draft.gender, draft.heat]
  );
  const hair = useMemo(() => hairChipsFor(draft.gender), [draft.gender]);
  const filters = useMemo(() => draftToFilters(draft), [draft]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/seeds");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setDemos(data.demos || []);
    } catch (err: any) {
      setMsg(err.message || "Could not load cast");
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createOne = async (mode: "draft" | "random") => {
    setBusy(true);
    setFailed(false);
    setMsg(mode === "random" ? "Rolling a random portrait…" : "Creating portrait…");
    try {
      const res = await fetch("/api/admin/seeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: 1,
          makePublic,
          custom: mode === "draft" ? filters : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFailed(true);
        setMsg(`FAILED: ${data.error || data.errors?.[0] || "Create failed"}`);
        return;
      }
      const name = data.results?.[0]?.username || "someone";
      setMsg(`${name} is in${makePublic ? " · posted to the stack" : " · hidden"}`);
      await load();
    } catch (err: any) {
      setFailed(true);
      setMsg(`FAILED: ${err.message || "timeout"}`);
    } finally {
      setBusy(false);
    }
  };

  const act = async (id: string, action: string, extra?: Record<string, unknown>) => {
    setRowBusy(`${id}:${action}`);
    setFailed(false);
    try {
      const res = await fetch(`/api/admin/seeds/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMsg("Updated.");
      await load();
    } catch (err: any) {
      setFailed(true);
      setMsg(`FAILED: ${err.message}`);
    } finally {
      setRowBusy(null);
    }
  };

  const deleteOne = async (id: string, username: string) => {
    if (!confirm(`Remove ${username}'s card? The handle stays reserved.`)) return;
    setRowBusy(id + ":del");
    try {
      const res = await fetch(`/api/admin/seeds/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setMsg(`Removed ${username}'s card`);
      await load();
    } catch (err: any) {
      setFailed(true);
      setMsg(`FAILED: ${err.message}`);
    } finally {
      setRowBusy(null);
    }
  };

  const anyBusy = busy || !!rowBusy;

  return (
    <div className="space-y-5 min-w-0">
      <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-neutral-100 font-medium">Cast</p>
            <p className="text-xs text-neutral-500 leading-relaxed mt-1 max-w-xl">
              Fill Face The Den with people. Visitors never see that these are house accounts.
              Lock only what you care about — everything else randomizes into a unique face.
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs text-neutral-400">
            <input
              type="checkbox"
              checked={makePublic}
              onChange={(e) => setMakePublic(e.target.checked)}
              className="accent-rose-600"
            />
            Post to the stack
          </label>
        </div>

        <DenChips
          label="Heat"
          hint="Clothes and how far the photo goes."
          options={HEAT_CHIPS}
          value={draft.heat}
          onChange={(id) => set("heat", id as CastDraft["heat"])}
          variant="card"
        />
        <DenChips
          label="Who"
          options={GENDER_CHIPS}
          value={draft.gender}
          onChange={(id) => set("gender", id as CastDraft["gender"])}
          variant="heat"
        />
        <DenChips
          label="Age"
          hint="Faces are age-locked so 45 doesn't come out looking 22."
          options={AGE_CHIPS}
          value={draft.ageBand}
          onChange={(id) => set("ageBand", id)}
        />
        <DenChips
          label="Look"
          options={LOOK_CHIPS}
          value={draft.ethnicity}
          onChange={(id) => set("ethnicity", id)}
        />
        <DenChips
          label="Body"
          options={BODY_CHIPS}
          value={draft.bodyType}
          onChange={(id) => set("bodyType", id)}
        />
        <DenChips
          label="Hair"
          options={hair}
          value={draft.hair}
          onChange={(id) => set("hair", id)}
        />
        <DenChips
          label="Face"
          options={EXPRESSION_CHIPS}
          value={draft.expression}
          onChange={(id) => set("expression", id)}
        />
        <DenChips
          label="Camera"
          options={CAMERA_CHIPS}
          value={draft.camera}
          onChange={(id) => set("camera", id)}
          variant="heat"
        />
        <DenChips
          label="Pose"
          options={POSE_CHIPS}
          value={draft.pose}
          onChange={(id) => set("pose", id)}
        />
        <DenChips
          label="Place"
          options={PLACE_CHIPS}
          value={draft.setting}
          onChange={(id) => set("setting", id)}
        />
        <DenChips
          label="Clothes"
          options={clothes}
          value={draft.outfit}
          onChange={(id) => set("outfit", id)}
        />
        <DenChips
          label="Roast"
          options={STYLE_CHIPS}
          value={draft.style}
          onChange={(id) => set("style", id)}
        />
        <DenChips
          label="Look at"
          options={FOCUS_CHIPS}
          value={draft.focus}
          onChange={(id) => set("focus", id)}
        />
        {draft.style === "filthy" && (
          <DenChips
            label="Filth"
            options={FILTHY_CHIPS}
            value={draft.filthyMode}
            onChange={(id) => set("filthyMode", id)}
            variant="heat"
          />
        )}

        <button
          type="button"
          onClick={() => setAdvanced((v) => !v)}
          className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 hover:text-neutral-300"
        >
          {advanced ? "Hide extras" : "More control"}
        </button>

        {advanced && (
          <div className="space-y-5 pt-1">
            <DenChips
              label="Height"
              options={HEIGHT_CHIPS}
              value={draft.height}
              onChange={(id) => set("height", id)}
            />
            <DenChips
              label="Hair color"
              options={HAIR_COLOR_CHIPS}
              value={draft.hairColor}
              onChange={(id) => set("hairColor", id)}
            />
            <DenChips
              label="Face shape"
              options={FACE_SHAPE_CHIPS}
              value={draft.faceShape}
              onChange={(id) => set("faceShape", id)}
            />
            <DenChips
              label="Mark"
              hint="Keeps faces from cloning each other."
              options={MARK_CHIPS}
              value={draft.mark}
              onChange={(id) => set("mark", id)}
            />
            <DenChips
              label="Chest"
              options={CHEST_CHIPS}
              value={draft.chest}
              onChange={(id) => set("chest", id)}
              variant="heat"
            />
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => createOne("draft")}
            disabled={anyBusy}
            className="px-4 py-2.5 rounded-xl text-sm bg-gradient-to-b from-red-700 via-red-800 to-purple-900 text-white disabled:opacity-40"
          >
            {busy ? "Creating…" : "Create one"}
          </button>
          <button
            type="button"
            onClick={() => setDraft(randomizeCastDraft())}
            disabled={anyBusy}
            className="px-4 py-2.5 rounded-xl text-sm border border-neutral-800 text-neutral-300 disabled:opacity-40"
          >
            Randomize look
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(EMPTY_DRAFT);
            }}
            disabled={anyBusy}
            className="px-4 py-2.5 rounded-xl text-sm border border-neutral-800 text-neutral-500 disabled:opacity-40"
          >
            Reset
          </button>
          <Link
            href="/playground/face-the-den"
            className="px-4 py-2.5 rounded-xl text-sm border border-neutral-800 text-neutral-400"
          >
            Face The Den
          </Link>
        </div>

        {msg && (
          <p
            className={`text-xs rounded-lg px-3 py-2 break-words border ${
              failed
                ? "border-red-900/50 bg-red-950/20 text-red-300"
                : "border-neutral-800 text-neutral-300"
            }`}
          >
            {msg}
          </p>
        )}
      </div>

      <SeedQueuePanel
        makePublic={makePublic}
        filters={filters}
        onDemosMaybeChanged={load}
        packs={CAST_PACKS}
      />

      <div>
        <p className="text-xs uppercase tracking-wide text-neutral-500 mb-3">
          House library ({demos.length})
        </p>
        {loading ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : demos.length === 0 ? (
          <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-8 text-center">
            <p className="text-sm text-neutral-500">Nothing in the cast yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {demos.map((d) => {
              const rarity = getRarity(Number(d.score));
              return (
                <div
                  key={d.id}
                  className="rounded-2xl border border-neutral-800/80 bg-[#111] p-4 space-y-3 min-w-0"
                >
                  <div className="flex gap-3 min-w-0">
                    <RarityFrame
                      slug={rarity.slug}
                      compact
                      className="w-16 h-[86px] rounded-xl shrink-0"
                    >
                      {d.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={d.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[9px] text-red-400/80">
                          no img
                        </div>
                      )}
                    </RarityFrame>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-neutral-500 mb-1">
                        <span className="text-neutral-200">{d.username}</span>
                        <span className={rarity.text}>{d.rarity}</span>
                        <span>{Number(d.score).toFixed(1)}/10</span>
                        <span>
                          {d.likes} mark · {d.dislikes} cut
                        </span>
                        <span className={d.is_public ? "text-purple-300/80" : "text-neutral-600"}>
                          {d.is_public ? "on stack" : "hidden"}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-300 line-clamp-2">{d.verdict}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => act(d.id, "image")}
                      disabled={anyBusy}
                      className="px-3 py-1.5 rounded-lg text-[11px] border border-purple-900/40 text-purple-300/90 disabled:opacity-40"
                    >
                      Regen pic
                    </button>
                    <button
                      onClick={() => act(d.id, "image", { keepLook: false })}
                      disabled={anyBusy}
                      className="px-3 py-1.5 rounded-lg text-[11px] border border-neutral-800 text-neutral-400 disabled:opacity-40"
                    >
                      New face
                    </button>
                    <button
                      onClick={() => act(d.id, "verdict")}
                      disabled={anyBusy || !d.image_url}
                      className="px-3 py-1.5 rounded-lg text-[11px] border border-neutral-800 text-neutral-400 disabled:opacity-40"
                    >
                      Regen roast
                    </button>
                    <button
                      onClick={() => act(d.id, "votes")}
                      disabled={anyBusy}
                      className="px-3 py-1.5 rounded-lg text-[11px] border border-neutral-800 text-neutral-400 disabled:opacity-40"
                    >
                      Reroll votes
                    </button>
                    <button
                      onClick={() => act(d.id, "visibility", { is_public: !d.is_public })}
                      disabled={anyBusy}
                      className="px-3 py-1.5 rounded-lg text-[11px] border border-neutral-800 text-neutral-400 disabled:opacity-40"
                    >
                      {d.is_public ? "Hide" : "Post"}
                    </button>
                    <button
                      onClick={() => deleteOne(d.id, d.username)}
                      disabled={anyBusy}
                      className="px-3 py-1.5 rounded-lg text-[11px] border border-red-900/40 text-red-400/90 disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
