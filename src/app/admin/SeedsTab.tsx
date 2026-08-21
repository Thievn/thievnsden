"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
};

const GENDERS = [
  { id: "woman", label: "Woman" },
  { id: "man", label: "Man" },
  { id: "random", label: "Random" },
];

const SETTINGS = [
  "bedroom mirror selfie, soft warm lamp light",
  "casual bathroom mirror selfie, overhead light",
  "beach daylight selfie, natural sun",
  "car selfie at night, dashboard glow",
  "bedroom lying down phone selfie, dim light",
  "going-out outfit full-length mirror shot",
  "casual indoor selfie near a window",
  "balcony evening selfie, city lights soft",
  "gym locker mirror selfie",
  "coffee shop selfie, soft daylight",
  "hotel room mirror selfie, warm ambient light",
  "rooftop golden hour selfie",
];

const OUTFITS_WOMAN = [
  "casual fitted t-shirt",
  "simple tank top",
  "bikini",
  "lingerie set",
  "oversized hoodie",
  "crop top and jeans",
  "sundress",
  "workout leggings and sports bra",
  "satin camisole",
  "off-shoulder top",
];

const OUTFITS_MAN = [
  "casual fitted t-shirt",
  "hoodie",
  "button-up shirt",
  "tank top",
  "gym shirt",
  "open jacket over plain tee",
  "swim trunks (beach selfie)",
  "henley shirt",
  "simple black tee",
];

const STYLES = ["honest", "unhinged", "filthy", "petty", "deadpan"];
const FOCUSES = ["overall", "face", "body", "tits", "ass", "vibe"];
const FILTHY = ["degrade", "worship", "mixed"];
const AGES = ["early 20s", "mid 20s", "late 20s", "early 30s", "mid 30s", "early 40s"];

export function SeedsTab() {
  const [demos, setDemos] = useState<Demo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [makePublic, setMakePublic] = useState(true);

  // Custom builder
  const [gender, setGender] = useState("woman");
  const [setting, setSetting] = useState(SETTINGS[0]);
  const [outfit, setOutfit] = useState(OUTFITS_WOMAN[0]);
  const [style, setStyle] = useState("unhinged");
  const [focus, setFocus] = useState("overall");
  const [filthyMode, setFilthyMode] = useState("mixed");
  const [ageBand, setAgeBand] = useState("mid 20s");

  const outfits =
    gender === "man"
      ? OUTFITS_MAN
      : gender === "woman"
        ? OUTFITS_WOMAN
        : [...OUTFITS_WOMAN, ...OUTFITS_MAN];

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/seeds");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setDemos(data.demos || []);
    } catch (err: any) {
      setMsg(err.message || "Could not load demos");
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    // Reset outfit when gender changes so clothing stays coherent
    if (gender === "man") setOutfit(OUTFITS_MAN[0]);
    else if (gender === "woman") setOutfit(OUTFITS_WOMAN[0]);
  }, [gender]);

  const createCustom = async () => {
    setBusy(true);
    setFailed(false);
    setMsg("Creating custom demo (30–90s)…");
    try {
      const res = await fetch("/api/admin/seeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: 1,
          makePublic,
          custom: {
            gender: gender === "random" ? undefined : gender,
            setting,
            outfit,
            style,
            focus,
            filthyMode: style === "filthy" ? filthyMode : null,
            ageBand,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFailed(true);
        setMsg(`FAILED: ${data.error || data.errors?.[0] || "Create failed"}`);
        return;
      }
      setMsg("OK — custom demo created" + (makePublic ? " · Gallery" : ""));
      await load();
    } catch (err: any) {
      setFailed(true);
      setMsg(`FAILED: ${err.message || "timeout"}`);
    } finally {
      setBusy(false);
    }
  };

  const seedRandom = async () => {
    setBusy(true);
    setFailed(false);
    setMsg("Random demo (one at a time is more reliable)…");
    try {
      const res = await fetch("/api/admin/seeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 1, makePublic }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFailed(true);
        setMsg(`FAILED: ${data.error || data.errors?.[0] || "Seed failed"}`);
        return;
      }
      setMsg("OK — random demo created");
      await load();
    } catch (err: any) {
      setFailed(true);
      setMsg(`FAILED: ${err.message || "timeout"}`);
    } finally {
      setBusy(false);
    }
  };

  const purge = async () => {
    if (!confirm("Delete ALL demos?")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/seeds", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Purge failed");
      setMsg(`Purged ${data.purgedJudgments}`);
      await load();
    } catch (err: any) {
      setFailed(true);
      setMsg(`FAILED: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const regen = async (id: string, action: "image" | "verdict") => {
    setRowBusy(id + ":" + action);
    setFailed(false);
    setMsg(action === "image" ? "Regen pic…" : "Regen judgment…");
    try {
      const res = await fetch(`/api/admin/seeds/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Regen failed");
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
    if (!confirm(`Delete ${username}?`)) return;
    setRowBusy(id + ":del");
    try {
      const res = await fetch(`/api/admin/seeds/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setMsg(`Deleted ${username}`);
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
    <div className="space-y-5">
      <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5 space-y-4">
        <div>
          <p className="text-sm text-neutral-200 font-medium mb-1">Custom demo builder</p>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Full control: gender, scene, outfit, judgment style. One at a time is reliable.
            Clothing lists auto-switch with gender so you never get nonsense fits.
          </p>
        </div>

        <label className="flex items-center justify-between gap-3">
          <span className="text-sm text-neutral-300">Auto-post to Gallery</span>
          <input
            type="checkbox"
            checked={makePublic}
            onChange={(e) => setMakePublic(e.target.checked)}
            className="w-4 h-4 accent-purple-600"
          />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-xs text-neutral-500 space-y-1">
            <span>Gender</span>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200"
            >
              {GENDERS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-neutral-500 space-y-1">
            <span>Age look</span>
            <select
              value={ageBand}
              onChange={(e) => setAgeBand(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200"
            >
              {AGES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-neutral-500 space-y-1 sm:col-span-2">
            <span>Scene</span>
            <select
              value={setting}
              onChange={(e) => setSetting(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200"
            >
              {SETTINGS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-neutral-500 space-y-1 sm:col-span-2">
            <span>Outfit</span>
            <select
              value={outfit}
              onChange={(e) => setOutfit(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200"
            >
              {outfits.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-neutral-500 space-y-1">
            <span>Style</span>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200"
            >
              {STYLES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-neutral-500 space-y-1">
            <span>Focus</span>
            <select
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200"
            >
              {FOCUSES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>
          {style === "filthy" && (
            <label className="text-xs text-neutral-500 space-y-1 sm:col-span-2">
              <span>Filthy mode</span>
              <select
                value={filthyMode}
                onChange={(e) => setFilthyMode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200"
              >
                {FILTHY.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={createCustom}
            disabled={anyBusy}
            className="px-4 py-2.5 rounded-xl text-sm border border-purple-800/50 text-purple-300 hover:bg-purple-950/30 disabled:opacity-40"
          >
            {busy ? "Creating…" : "Create custom demo"}
          </button>
          <button
            onClick={seedRandom}
            disabled={anyBusy}
            className="px-4 py-2.5 rounded-xl text-sm border border-neutral-800 text-neutral-300 disabled:opacity-40"
          >
            Random one
          </button>
          <button
            onClick={purge}
            disabled={anyBusy || demos.length === 0}
            className="px-4 py-2.5 rounded-xl text-sm border border-red-900/50 text-red-400/90 disabled:opacity-40"
          >
            Purge all
          </button>
          <Link
            href="/playground"
            className="px-4 py-2.5 rounded-xl text-sm border border-neutral-800 text-neutral-400"
          >
            Playground
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

      <div>
        <p className="text-xs uppercase tracking-wide text-neutral-500 mb-3">
          Demo library ({demos.length})
        </p>
        {loading ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : demos.length === 0 ? (
          <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-8 text-center">
            <p className="text-sm text-neutral-500">No demos yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {demos.map((d) => (
              <div
                key={d.id}
                className="rounded-2xl border border-neutral-800/80 bg-[#111] p-4 space-y-3"
              >
                <div className="flex gap-3">
                  <div className="w-14 h-[74px] rounded-lg overflow-hidden border border-neutral-800 bg-black shrink-0">
                    {d.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={d.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[9px] text-red-400/80">
                        no img
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-neutral-500 mb-1">
                      <span className="text-neutral-300">{d.username}</span>
                      <span>·</span>
                      <span>{d.rarity}</span>
                      <span>·</span>
                      <span>{Number(d.score).toFixed(1)}/10</span>
                    </div>
                    <p className="text-sm text-neutral-300 line-clamp-2">{d.verdict}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => regen(d.id, "image")}
                    disabled={anyBusy}
                    className="px-3 py-1.5 rounded-lg text-[11px] border border-purple-900/40 text-purple-300/90 disabled:opacity-40"
                  >
                    Regen pic
                  </button>
                  <button
                    onClick={() => regen(d.id, "verdict")}
                    disabled={anyBusy || !d.image_url}
                    className="px-3 py-1.5 rounded-lg text-[11px] border border-neutral-800 text-neutral-400 disabled:opacity-40"
                  >
                    Regen judgment
                  </button>
                  <button
                    onClick={() => deleteOne(d.id, d.username)}
                    disabled={anyBusy}
                    className="px-3 py-1.5 rounded-lg text-[11px] border border-red-900/40 text-red-400/90 disabled:opacity-40"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
