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

const AGES = [
  "18-20",
  "21-24",
  "25-29",
  "30-34",
  "35-39",
  "40-44",
  "45-50",
];

const ETHNICITIES = [
  "random",
  "white / european",
  "black / african descent",
  "latina / hispanic",
  "east asian",
  "south asian",
  "middle eastern",
  "mixed",
];

const BODY_TYPES = [
  "slim",
  "athletic",
  "curvy",
  "soft / average",
  "stocky",
  "tall and lean",
  "short and compact",
];

const HEIGHTS = ["short", "average height", "tall"];

const EXPRESSIONS = [
  "neutral face",
  "soft smile",
  "big smile / laughing",
  "pouty lips",
  "smirk",
  "bored / deadpan",
  "flirty look",
  "confident stare",
  "shy glance away",
  "mid-laugh",
  "biting lip slightly",
  "raised eyebrow",
];

const HAIR = [
  "short hair",
  "shoulder-length hair",
  "long hair",
  "loose waves",
  "straight hair",
  "curly hair",
  "bun / updo",
  "ponytail",
  "messy bed hair",
  "under cut / fade (men)",
];

const CAMERAS = [
  { id: "mirror_selfie", label: "Mirror selfie (self)" },
  { id: "self_held", label: "Self-held phone selfie" },
  { id: "other_person", label: "Someone else took the photo" },
];

const POSES = [
  { id: "front", label: "Front facing" },
  { id: "three_quarter", label: "Three-quarter angle" },
  { id: "side", label: "Side profile" },
  { id: "over_shoulder", label: "Looking over shoulder" },
  { id: "back_ass", label: "Back / ass focus" },
  { id: "full_body", label: "Full body mirror" },
  { id: "close_face", label: "Close-up face" },
  { id: "overhead", label: "Overhead / looking down" },
  { id: "lying_down", label: "Lying down" },
  { id: "sitting", label: "Sitting" },
  { id: "leaning", label: "Leaning on something" },
];

const SETTINGS = [
  "bedroom, soft warm lamp light",
  "bedroom, dim evening light",
  "bathroom mirror, overhead light",
  "bathroom, soft natural window light",
  "car interior, night dashboard glow",
  "car interior, daytime",
  "standing against a car outside",
  "beach, natural daylight",
  "poolside, bright sun",
  "gym locker mirror",
  "coffee shop near a window",
  "balcony, soft city lights",
  "hotel room, warm ambient light",
  "living room couch",
  "kitchen counter area",
  "bar / club bathroom mirror",
  "outdoor night street",
  "rooftop, golden hour",
  "stairwell / hallway",
  "closet mirror full-length",
];

const OUTFITS_WOMAN = [
  "casual fitted t-shirt",
  "simple tank top",
  "crop top and jeans",
  "oversized hoodie",
  "sundress",
  "off-shoulder top",
  "satin camisole",
  "workout leggings and sports bra",
  "bikini",
  "lingerie set",
  "panties only",
  "panties and a loose open shirt",
  "bra and panties",
  "going-out tight dress",
  "club top and skirt",
  "sleep shirt",
];

const OUTFITS_MAN = [
  "casual fitted t-shirt",
  "hoodie",
  "button-up shirt",
  "tank top",
  "gym shirt",
  "open jacket over plain tee",
  "henley shirt",
  "simple black tee",
  "swim trunks",
  "shirtless",
  "open unbuttoned shirt",
  "low-rise shorts only",
  "sweatpants no shirt",
];

const CHEST = [
  { id: "covered", label: "Covered" },
  { id: "low_cut", label: "Low-cut / cleavage" },
  { id: "bare", label: "Bare / topless" },
];

const STYLES = ["honest", "unhinged", "filthy", "petty", "deadpan"];
const FOCUSES = ["overall", "face", "body", "tits", "ass", "vibe"];
const FILTHY = ["degrade", "worship", "mixed"];

export function SeedsTab() {
  const [demos, setDemos] = useState<Demo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [makePublic, setMakePublic] = useState(true);

  const [gender, setGender] = useState("woman");
  const [ageBand, setAgeBand] = useState("21-24");
  const [ethnicity, setEthnicity] = useState("random");
  const [bodyType, setBodyType] = useState("athletic");
  const [height, setHeight] = useState("average height");
  const [expression, setExpression] = useState("soft smile");
  const [hair, setHair] = useState("long hair");
  const [camera, setCamera] = useState("mirror_selfie");
  const [pose, setPose] = useState("front");
  const [setting, setSetting] = useState(SETTINGS[0]);
  const [outfit, setOutfit] = useState(OUTFITS_WOMAN[0]);
  const [chest, setChest] = useState("covered");
  const [style, setStyle] = useState("unhinged");
  const [focus, setFocus] = useState("overall");
  const [filthyMode, setFilthyMode] = useState("mixed");

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
    if (gender === "man") {
      setOutfit(OUTFITS_MAN[0]);
      setChest("covered");
    } else if (gender === "woman") {
      setOutfit(OUTFITS_WOMAN[0]);
    }
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
            ageBand,
            ethnicity: ethnicity === "random" ? undefined : ethnicity,
            bodyType,
            height,
            expression,
            hair,
            camera,
            pose,
            setting,
            outfit,
            chest,
            style,
            focus,
            filthyMode: style === "filthy" ? filthyMode : null,
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
    setMsg("Random demo (one at a time)…");
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

  const field = "w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200";

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5 space-y-4">
        <div>
          <p className="text-sm text-neutral-200 font-medium mb-1">Custom demo creator</p>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Full control over who shows up. One at a time is reliable. Gender locks clothing lists.
            Use pose + camera for butt shots, third-party photos, etc.
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

        <p className="text-[10px] uppercase tracking-wide text-neutral-600 pt-1">Identity</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-xs text-neutral-500 space-y-1">
            <span>Gender</span>
            <select value={gender} onChange={(e) => setGender(e.target.value)} className={field}>
              {GENDERS.map((g) => (
                <option key={g.id} value={g.id}>{g.label}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-neutral-500 space-y-1">
            <span>Age</span>
            <select value={ageBand} onChange={(e) => setAgeBand(e.target.value)} className={field}>
              {AGES.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-neutral-500 space-y-1">
            <span>Ethnicity / look</span>
            <select value={ethnicity} onChange={(e) => setEthnicity(e.target.value)} className={field}>
              {ETHNICITIES.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-neutral-500 space-y-1">
            <span>Body type</span>
            <select value={bodyType} onChange={(e) => setBodyType(e.target.value)} className={field}>
              {BODY_TYPES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-neutral-500 space-y-1">
            <span>Height vibe</span>
            <select value={height} onChange={(e) => setHeight(e.target.value)} className={field}>
              {HEIGHTS.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-neutral-500 space-y-1">
            <span>Hair</span>
            <select value={hair} onChange={(e) => setHair(e.target.value)} className={field}>
              {HAIR.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </label>
        </div>

        <p className="text-[10px] uppercase tracking-wide text-neutral-600 pt-2">Face & shot</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-xs text-neutral-500 space-y-1">
            <span>Expression</span>
            <select value={expression} onChange={(e) => setExpression(e.target.value)} className={field}>
              {EXPRESSIONS.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-neutral-500 space-y-1">
            <span>Camera</span>
            <select value={camera} onChange={(e) => setCamera(e.target.value)} className={field}>
              {CAMERAS.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-neutral-500 space-y-1 sm:col-span-2">
            <span>Pose / framing</span>
            <select value={pose} onChange={(e) => setPose(e.target.value)} className={field}>
              {POSES.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </label>
        </div>

        <p className="text-[10px] uppercase tracking-wide text-neutral-600 pt-2">Scene & clothes</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-xs text-neutral-500 space-y-1 sm:col-span-2">
            <span>Environment</span>
            <select value={setting} onChange={(e) => setSetting(e.target.value)} className={field}>
              {SETTINGS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-neutral-500 space-y-1 sm:col-span-2">
            <span>Outfit</span>
            <select value={outfit} onChange={(e) => setOutfit(e.target.value)} className={field}>
              {outfits.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-neutral-500 space-y-1 sm:col-span-2">
            <span>Chest visibility</span>
            <select value={chest} onChange={(e) => setChest(e.target.value)} className={field}>
              {CHEST.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </label>
        </div>

        <p className="text-[10px] uppercase tracking-wide text-neutral-600 pt-2">Judgment</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-xs text-neutral-500 space-y-1">
            <span>Style</span>
            <select value={style} onChange={(e) => setStyle(e.target.value)} className={field}>
              {STYLES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-neutral-500 space-y-1">
            <span>Focus</span>
            <select value={focus} onChange={(e) => setFocus(e.target.value)} className={field}>
              {FOCUSES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </label>
          {style === "filthy" && (
            <label className="text-xs text-neutral-500 space-y-1 sm:col-span-2">
              <span>Filthy mode</span>
              <select value={filthyMode} onChange={(e) => setFilthyMode(e.target.value)} className={field}>
                {FILTHY.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
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
          <Link href="/playground" className="px-4 py-2.5 rounded-xl text-sm border border-neutral-800 text-neutral-400">
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
              <div key={d.id} className="rounded-2xl border border-neutral-800/80 bg-[#111] p-4 space-y-3">
                <div className="flex gap-3">
                  <div className="w-14 h-[74px] rounded-lg overflow-hidden border border-neutral-800 bg-black shrink-0">
                    {d.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={d.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[9px] text-red-400/80">no img</div>
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
                  <button onClick={() => regen(d.id, "image")} disabled={anyBusy} className="px-3 py-1.5 rounded-lg text-[11px] border border-purple-900/40 text-purple-300/90 disabled:opacity-40">
                    Regen pic
                  </button>
                  <button onClick={() => regen(d.id, "verdict")} disabled={anyBusy || !d.image_url} className="px-3 py-1.5 rounded-lg text-[11px] border border-neutral-800 text-neutral-400 disabled:opacity-40">
                    Regen judgment
                  </button>
                  <button onClick={() => deleteOne(d.id, d.username)} disabled={anyBusy} className="px-3 py-1.5 rounded-lg text-[11px] border border-red-900/40 text-red-400/90 disabled:opacity-40">
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
