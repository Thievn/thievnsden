"use client";

import { useEffect, useMemo, useState } from "react";
import { DEFAULTS, ENGINES, F, MULTI, STYLES, buildPrompt, dims } from "@/lib/lab/options";
import { pollJob, postLab } from "./api";
import { Chips, Section, Switcher } from "./bits";
import { PoseButton, PosePicker, poseData, type Pose } from "./pose";

type Sel = Record<string, string | string[]>;
type Shot = { img: string; url?: string | null; prompt: string; seed: number; style: string; engine: string };

const SECTIONS = [
  { id: "look", title: "Identity & Look", fields: [["gender", "Presentation"], ["age", "Age (adults only)"], ["ethnicity", "Ethnicity"], ["skin", "Skin"], ["body", "Body type"], ["height", "Height vibe"]] },
  { id: "hair", title: "Hair, Eyes & Face", fields: [["hairColor", "Hair color"], ["hairStyle", "Hair style"], ["hairLength", "Hair length"], ["eyes", "Eyes"], ["freckles", "Freckles"], ["makeup", "Makeup"]] },
  { id: "marks", title: "Ink, Metal & Marks", fields: [["piercings", "Piercings"], ["tattoos", "Tattoos"], ["marks", "Distinctive"]] },
  { id: "soul", title: "Soul & Vibe", fields: [["vibe", "Personality"]] },
  { id: "scene", title: "Outfit, Pose & Scene", fields: [["outfit", "Outfit"], ["pose", "Pose"], ["setting", "Setting"], ["expression", "Expression"], ["camera", "Camera"], ["lighting", "Lighting"]] },
] as const;

function pick<T>(list: readonly T[]) {
  return list[Math.floor(Math.random() * list.length)];
}

export function CreateView() {
  const [sel, setSel] = useState<Sel>({ ...DEFAULTS });
  const [openId, setOpenId] = useState<string | null>("look");
  const [custom, setCustom] = useState("");
  const [usingCustom, setUsingCustom] = useState(false);
  const [engineOverride, setEngine] = useState("");
  const [poseSel, setPoseSel] = useState<Pose | null>(null);
  const [poseOpen, setPoseOpen] = useState(false);
  const [seed, setSeed] = useState("");
  const [lock, setLock] = useState(false);
  const [count, setCount] = useState(1);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [shots, setShots] = useState<Shot[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const style = STYLES.find((item: { id: string }) => item.id === sel.style) || STYLES[0];
  const engine = engineOverride || style.engine;
  const poseOn = !!poseSel && engine === "zimage";
  const built = useMemo(() => buildPrompt(poseOn && poseSel?.hint ? { ...sel, pose: poseSel.hint } : sel), [sel, poseOn, poseSel]);
  const prompt = usingCustom ? custom : built;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("den_lab_state") || "null");
      if (saved) setSel({ ...DEFAULTS, ...saved });
      setHistory(JSON.parse(localStorage.getItem("den_lab_prompts") || "[]"));
      const vary = sessionStorage.getItem("den_lab_vary");
      if (vary) {
        sessionStorage.removeItem("den_lab_vary");
        const item = JSON.parse(vary) as { prompt?: string; style?: string };
        if (item.style) setSel((current) => ({ ...current, style: item.style || current.style }));
        if (item.prompt) {
          setCustom(item.prompt);
          setUsingCustom(true);
        }
      }
    } catch { /* keep defaults */ }
  }, []);
  useEffect(() => { localStorage.setItem("den_lab_state", JSON.stringify(sel)); }, [sel]);

  function setField(key: string, value: string) {
    setSel((current) => {
      if (MULTI.has(key)) {
        const list = Array.isArray(current[key]) ? current[key] : [];
        return { ...current, [key]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value] };
      }
      return { ...current, [key]: current[key] === value ? "" : value };
    });
  }
  function summary(fields: readonly (readonly [string, string])[]) {
    return fields.map(([key]) => {
      const value = sel[key];
      return Array.isArray(value) ? value.join(", ") : value;
    }).filter(Boolean).join(" · ");
  }
  function remember(text: string) {
    const next = [text, ...history.filter((item) => item !== text)].slice(0, 12);
    setHistory(next);
    localStorage.setItem("den_lab_prompts", JSON.stringify(next));
  }
  async function enhance() {
    setErr("");
    setBusy("enhance");
    try {
      const result = await postLab({ action: "enhance", prompt: prompt || built, engine, styleLabel: `${style.label} — ${style.prefix}` });
      setCustom(String(result.prompt || ""));
      setUsingCustom(true);
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Enhance failed");
    }
    setBusy("");
  }
  async function generate(forceSeed = seed) {
    setErr("");
    const text = (prompt || built).trim();
    if (!text) return setErr("Write a prompt first.");
    const [w, h] = poseOn && poseSel ? [poseSel.w, poseSel.h] : dims(sel.aspect);
    setBusy("gen");
    try {
      const pose = poseOn && poseSel ? { data: await poseData(poseSel), strength: poseSel.strength ?? 0.8 } : null;
      const result = await postLab({
        action: "generate",
        prompt: text,
        style: sel.style,
        engine,
        seed: lock ? forceSeed : forceSeed,
        w,
        h,
        n: count,
        pose,
      });
      remember(text);
      const jobs = (result.jobs as { t: string; seed: number; engine: string }[]) || [];
      const made: Shot[] = [];
      for (const job of jobs) {
        const done = await pollJob(job.t, (status) => setBusy(`gen:${status}`));
        made.push({
          img: String(done.image || done.url || ""),
          url: (done.url as string | null) ?? null,
          prompt: text,
          seed: job.seed,
          style: style.label,
          engine: job.engine,
        });
        setShots((current) => [made[made.length - 1], ...current].slice(0, 8));
      }
      if (lock && jobs[0]) setSeed(String(jobs[0].seed));
      if (!lock) setSeed("");
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Generate failed");
    }
    setBusy("");
  }
  function reroll() {
    const next = String(Math.floor(Math.random() * 2 ** 31));
    setSeed(next);
    setLock(true);
  }
  const working = busy.startsWith("gen");
  return (
    <main className="lab">
      <header className="labhead">
        <div className="labhead-row">
          <p className="brand">Den Lab</p>
          <div className="row">
          <button type="button" className="btn" onClick={() => {
            const next = { ...sel };
            for (const key of Object.keys(F) as (keyof typeof F)[]) {
              if (MULTI.has(key)) next[key] = [...F[key]].sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 3));
              else if (key !== "aspect") next[key] = pick(F[key]);
            }
            next.style = pick(STYLES).id;
            setSel(next);
            setUsingCustom(false);
          }}>Surprise</button>
          <button type="button" className="btn" onClick={() => { setSel(DEFAULTS); setUsingCustom(false); setEngine(""); setPoseSel(null); }}>Reset</button>
          </div>
        </div>
        <Switcher current="Create" />
        <p className="lede">Adults 21+. Every finished picture is saved to your gallery.</p>
      </header>
      <div className="grid">
        <section className="col">
          <div className="card">
            <label className="lbl">Art style</label>
            <Chips options={STYLES.map((item: { label: string }) => item.label)} value={style.label} onPick={(label) => {
              const next = STYLES.find((item: { label: string }) => item.label === label);
              if (next) { setSel((current) => ({ ...current, style: next.id })); setEngine(""); }
            }} />
            <label className="lbl">Model</label>
            <Chips
              options={Object.keys(ENGINES).map((key) => ENGINES[key as keyof typeof ENGINES].label)}
              value={ENGINES[engine as keyof typeof ENGINES].label}
              onPick={(label) => {
                const key = Object.keys(ENGINES).find((item) => ENGINES[item as keyof typeof ENGINES].label === label) || "";
                setEngine(key === style.engine ? "" : key);
              }}
            />
            <p className="muted small">{ENGINES[engine as keyof typeof ENGINES].note}</p>
          </div>
          <PoseButton sel={poseSel} onOpen={() => setPoseOpen(true)} disabled={engine !== "zimage"} note="Poses work on photo styles." />
          <div className="card">
            <div className="row between"><h2>Prompt</h2>{usingCustom ? <span className="pill">Custom</span> : null}</div>
            <textarea rows={7} value={prompt} onChange={(event) => { setCustom(event.target.value); setUsingCustom(true); }} />
            <div className="row">
              <button type="button" className="btn" onClick={() => { setCustom(""); setUsingCustom(false); }}>Build</button>
              <button type="button" className="btn" disabled={!!busy} onClick={enhance}>{busy === "enhance" ? "Enhancing…" : "Enhance"}</button>
            </div>
            {history.length ? (
              <div className="history">
                <p className="lbl">Prompt history</p>
                {history.slice(0, 6).map((item) => (
                  <button key={item} type="button" className="histbtn" onClick={() => { setCustom(item); setUsingCustom(true); }}>{item}</button>
                ))}
              </div>
            ) : null}
          </div>
          {SECTIONS.map((section) => (
            <Section key={section.id} id={section.id} openId={openId} setOpenId={setOpenId} title={section.title} summary={summary(section.fields)}>
              {section.fields.map(([key, label]) => (
                <div key={key} className="field">
                  <label>{label}</label>
                  <Chips options={F[key]} value={sel[key] || ""} multi={MULTI.has(key)} onPick={(option) => setField(key, option)} />
                </div>
              ))}
            </Section>
          ))}
          <Section id="custom" openId={openId} setOpenId={setOpenId} title="Custom extras" summary={typeof sel.custom === "string" ? sel.custom : ""}>
            <input placeholder="e.g. holding a glass of red wine" value={typeof sel.custom === "string" ? sel.custom : ""} onChange={(event) => setSel((current) => ({ ...current, custom: event.target.value }))} />
          </Section>
        </section>
        <section className="col side">
          <div className="card">
            <label className="lbl">Aspect</label>
            <Chips options={F.aspect} value={sel.aspect} onPick={(option) => setSel((current) => ({ ...current, aspect: option }))} />
            <label className="lbl">Batch</label>
            <Chips options={["1", "2", "3", "4"]} value={String(count)} onPick={(option) => setCount(Number(option))} />
            <label className="lbl">Seed</label>
            <div className="row">
              <input className="seed" inputMode="numeric" placeholder="Random" value={seed} onChange={(event) => setSeed(event.target.value.replace(/\D/g, ""))} />
              <button type="button" className={lock ? "chip on" : "chip"} onClick={() => setLock((value) => !value)}>{lock ? "Seed locked" : "Lock seed"}</button>
              <button type="button" className="btn" onClick={reroll}>Reroll</button>
            </div>
            <button type="button" className="cta desk" disabled={working} onClick={() => generate(lock ? seed : "")}>{working ? `Generating… ${busy.split(":")[1] || ""}` : "Generate"}</button>
            {err ? <p className="err">{err}</p> : null}
          </div>
          {shots.map((shot) => (
            <article className="card" key={`${shot.seed}-${shot.img.slice(-24)}`}>
              <img className="out" src={shot.url || shot.img} alt="" />
              <p className="muted small">{shot.style} · seed {shot.seed}</p>
              <div className="row">
                <button type="button" className="btn" onClick={() => generate("")}>Vary this</button>
                <button type="button" className="btn" onClick={() => { setSeed(String(shot.seed)); setLock(true); }}>Use seed</button>
                <button type="button" className="btn" onClick={() => {
                  sessionStorage.setItem("lf_edit_in", JSON.stringify({ img: shot.img, tag: null, label: shot.style }));
                  location.href = "/edit";
                }}>Edit</button>
                <a className="btn" href={shot.img} download={`den-${shot.seed}.jpg`}>Download</a>
              </div>
            </article>
          ))}
          {working && !shots.length ? <div className="card skeleton">Generating…</div> : null}
        </section>
      </div>
      <PosePicker open={poseOpen} onClose={() => setPoseOpen(false)} sel={poseSel} onPick={setPoseSel} />
      <div className="actionbar">
        <button type="button" className="btn" disabled={!!busy} onClick={enhance}>Enhance</button>
        <button type="button" className="cta grow" disabled={working} onClick={() => generate(lock ? seed : "")}>{working ? "Generating…" : "Generate"}</button>
      </div>
    </main>
  );
}
