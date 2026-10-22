"use client";

import { useEffect, useState } from "react";
import { fileToJpeg, pollJob, postDen, postLab, shrinkData } from "./api";
import { Chips, Switcher } from "./bits";
import { PoseButton, PosePicker, poseData, type Pose } from "./pose";
import { Compare, MaskBrush } from "./tools";

type Node = { id: string; parent: string | null; img: string; ref: { id?: string; data?: string; tag?: string | null }; src: string; instr: string; seed?: number };
type GalleryPic = { id: string; url: string | null; prompt: string; kind: string; style: string | null };

const QUICK = [
  ["Outfit", "Change her outfit to "],
  ["Background", "bg"],
  ["Fix face", "face"],
  ["Fix hands", "hands"],
  ["Touch-up", "touch"],
  ["Lighting", "Change the lighting to moody crimson rim light, keep everything else identical."],
  ["Hair", "Change her hair to "],
] as const;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export function EditView() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [curId, setCurId] = useState<string | null>(null);
  const [instr, setInstr] = useState("");
  const [preset, setPreset] = useState("");
  const [strength, setStrength] = useState(1);
  const [count, setCount] = useState(1);
  const [refs, setRefs] = useState<{ img: string; ref: { data: string }; src: string }[]>([]);
  const [poseSel, setPoseSel] = useState<Pose | null>(null);
  const [poseOpen, setPoseOpen] = useState(false);
  const [mask, setMask] = useState<string | null>(null);
  const [maskOpen, setMaskOpen] = useState(false);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [gallery, setGallery] = useState<GalleryPic[] | null>(null);
  const [pick, setPick] = useState<"subject" | "ref" | null>(null);
  const cur = nodes.find((node) => node.id === curId) || null;
  const parent = cur?.parent ? nodes.find((node) => node.id === cur.parent) : null;

  useEffect(() => {
    const incoming = sessionStorage.getItem("lf_edit_in");
    if (!incoming) return;
    sessionStorage.removeItem("lf_edit_in");
    try {
      const item = JSON.parse(incoming) as { id?: string; img?: string; tag?: string | null; label?: string };
      if (!item.img && !item.id) return;
      const node: Node = {
        id: uid(),
        parent: null,
        img: item.img || "",
        ref: item.id ? { id: item.id } : { data: item.img, tag: item.tag },
        src: item.id ? "lab" : "upload",
        instr: item.label ? `From ${item.label}` : "Start",
      };
      setNodes([node]);
      setCurId(node.id);
    } catch { /* ignore */ }
  }, []);

  async function openGallery() {
    setPick("subject");
    if (gallery) return;
    const payload = await postDen({ action: "state" });
    setGallery(((payload.images as GalleryPic[]) || []).filter((item) => item.url));
  }
  async function onUpload(file: File, target: "subject" | "ref") {
    const data = await fileToJpeg(file, target === "subject" ? 1536 : 1024);
    if (target === "ref") {
      setRefs((current) => [...current, { img: data, ref: { data }, src: "upload" }].slice(0, 3));
      return;
    }
    const node: Node = { id: uid(), parent: null, img: data, ref: { data }, src: "upload", instr: "Uploaded" };
    setNodes((current) => [...current, node]);
    setCurId(node.id);
    setMask(null);
    setRefs([]);
    setPoseSel(null);
  }
  async function run() {
    if (!cur) return;
    setErr("");
    setBusy("edit");
    try {
      const pose = poseSel ? { id: poseSel.id, data: await poseData(poseSel) } : null;
      let subject = cur.ref;
      let body = { action: "edit", subject, refs: refs.map((item) => item.ref), pose, instr, preset, strength, n: count, mask, parentId: cur.ref.id || null };
      if (JSON.stringify(body).length > 4.3e6 && subject.data) {
        subject = { ...subject, data: await shrinkData(subject.data, 2048, 0.9) };
        body = { ...body, subject };
      }
      if (JSON.stringify(body).length > 4.3e6 && subject.data) {
        subject = { ...subject, data: await shrinkData(subject.data, 1536, 0.85) };
        body = { ...body, subject };
      }
      const result = await postLab(body);
      const jobs = (result.jobs as { t: string; seed: number }[]) || [];
      let first = true;
      for (const [index, job] of jobs.entries()) {
        const done = await pollJob(job.t, (status) => setBusy(`edit:${status}`));
        const node: Node = {
          id: uid(),
          parent: cur.id,
          img: String(done.image || done.url || ""),
          ref: done.galleryId ? { id: String(done.galleryId) } : { data: String(done.image), tag: String(done.tag || "") },
          src: String(result.src || "lab"),
          instr: [preset, instr, poseSel && poseSel.name, mask && "painted area"].filter(Boolean).join(" · ") + (jobs.length > 1 ? ` (${index + 1})` : "") || "Edit",
          seed: job.seed,
        };
        setNodes((current) => [...current, node]);
        if (first) { first = false; setCurId(node.id); setMask(null); }
      }
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Edit failed");
    }
    setBusy("");
  }
  async function upscale() {
    if (!cur) return;
    setBusy("up");
    setErr("");
    try {
      const result = await postLab({ action: "upscale", image: cur.ref, parentId: cur.ref.id || null });
      const node: Node = {
        id: uid(),
        parent: cur.id,
        img: String(result.image),
        ref: result.galleryId ? { id: String(result.galleryId) } : { data: String(result.image), tag: String(result.tag || "") },
        src: cur.src,
        instr: `Larger (${result.w}×${result.h})`,
      };
      setNodes((current) => [...current, node]);
      setCurId(node.id);
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Upscale failed");
    }
    setBusy("");
  }
  const editing = busy.startsWith("edit");
  return (
    <main className="lab">
      <header className="labhead">
        <p className="brand">Den Lab</p>
        <Switcher current="Edit" />
        <p className="lede">Edit a picture. Everything you don&apos;t change stays exactly the same.</p>
      </header>
      {!cur ? (
        <div className="card start">
          <h2>Start an edit</h2>
          <label className="cta upl">Upload<input type="file" accept="image/*" hidden onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) onUpload(file, "subject").catch((error) => setErr(error.message)); }} /></label>
          <button type="button" className="btn" onClick={() => openGallery().catch((error) => setErr(error.message))}>From gallery</button>
          {err ? <p className="err">{err}</p> : null}
        </div>
      ) : (
        <div className="grid">
          <section className="col">
            <div className="card">
              <Compare before={parent?.img} after={cur.img} />
              <p className="muted small">{cur.instr}{parent ? " · drag to compare" : ""}</p>
              <div className="row">
                <button type="button" className="btn" disabled={!!busy} onClick={upscale}>{busy === "up" ? "Working…" : "Make larger"}</button>
                <a className="btn" href={cur.img} download={`den-edit-${cur.id}.jpg`}>Download</a>
                <button type="button" className="btn" onClick={() => openGallery()}>New image</button>
              </div>
            </div>
            <div className="card">
              <h2>What should change?</h2>
              <Chips options={QUICK.map((item) => item[0])} value={preset ? QUICK.find((item) => item[1] === preset)?.[0] || "" : ""} onPick={(label) => {
                const item = QUICK.find((entry) => entry[0] === label);
                if (!item) return;
                if (["bg", "face", "hands", "touch"].includes(item[1])) setPreset(preset === item[1] ? "" : item[1]);
                else { setPreset(""); setInstr(item[1]); }
              }} />
              <textarea rows={4} placeholder={preset === "bg" ? "Describe the new background" : "e.g. change the hoodie to a black lace dress, keep everything else"} value={instr} onChange={(event) => setInstr(event.target.value)} />
              <div className="row">
                <button type="button" className="btn" disabled={!!busy} onClick={async () => {
                  setBusy("enh"); setErr("");
                  try { const result = await postLab({ action: "enhance", prompt: instr || "improve this photo", engine: "zimage", mode: "edit" }); setInstr(String(result.prompt || "")); }
                  catch (error) { setErr(error instanceof Error ? error.message : "Enhance failed"); }
                  setBusy("");
                }}>{busy === "enh" ? "Enhancing…" : "Enhance"}</button>
                <button type="button" className={mask ? "chip on" : "chip"} onClick={() => setMaskOpen(true)}>{mask ? "Brush on" : "Brush"}</button>
              </div>
            </div>
            <PoseButton sel={poseSel} onOpen={() => setPoseOpen(true)} />
            <div className="card">
              <div className="row between"><h2>Outfit references · {refs.length}/3</h2>{refs.length ? <button type="button" className="btn" onClick={() => setRefs([])}>Clear</button> : null}</div>
              <div className="refs">
                {refs.map((item, index) => (
                  <div key={item.img.slice(-16)} className="ref"><img src={item.img} alt="" /><button type="button" onClick={() => setRefs((current) => current.filter((_, i) => i !== index))}>Remove</button></div>
                ))}
                {refs.length < 3 ? <label className="ref add">Add<input type="file" accept="image/*" hidden onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) onUpload(file, "ref").catch((error) => setErr(error.message)); }} /></label> : null}
              </div>
            </div>
            <div className="card">
              <label className="slider">How much to change <b>{strength.toFixed(2)}</b>
                <input type="range" min="0.4" max="1" step="0.05" value={strength} onChange={(event) => setStrength(Number(event.target.value))} />
              </label>
              <label className="lbl">Variations</label>
              <Chips options={["1", "2", "3", "4"]} value={String(count)} onPick={(option) => setCount(Number(option))} />
              <button type="button" className="cta desk" disabled={editing || !!busy} onClick={run}>{editing ? "Editing…" : "Apply edit"}</button>
              {err ? <p className="err">{err}</p> : null}
            </div>
          </section>
          <section className="col">
            <div className="card">
              <h2>Steps</h2>
              <div className="steps">
                {nodes.map((node) => (
                  <button key={node.id} type="button" className={node.id === curId ? "step on" : "step"} onClick={() => { setCurId(node.id); setMask(null); }}>
                    <img src={node.img} alt="" />
                    <span>{node.instr}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
      {pick ? (
        <div className="sheetwrap" onClick={() => setPick(null)}>
          <div className="sheet" role="dialog" aria-label="Gallery" onClick={(event) => event.stopPropagation()}>
            <div className="sheethead"><b>Gallery</b><button type="button" className="icon" onClick={() => setPick(null)}>Close</button></div>
            <div className="sheetbody gallery">
              {(gallery || []).map((item) => (
                <button key={item.id} type="button" className="tile" onClick={() => {
                  const node: Node = { id: uid(), parent: null, img: item.url || "", ref: { id: item.id }, src: item.kind === "upload" ? "upload" : "lab", instr: item.style || "From the gallery" };
                  setNodes((current) => [...current, node]);
                  setCurId(node.id);
                  setPick(null);
                  setMask(null);
                }}><img src={item.url || ""} alt="" /></button>
              ))}
              {gallery && !gallery.length ? <p className="muted">Gallery is empty.</p> : null}
            </div>
          </div>
        </div>
      ) : null}
      {maskOpen && cur ? <MaskBrush src={cur.img} onClose={() => setMaskOpen(false)} onDone={(value) => { setMask(value); setMaskOpen(false); }} /> : null}
      <PosePicker open={poseOpen} onClose={() => setPoseOpen(false)} sel={poseSel} onPick={setPoseSel} />
      {cur ? (
        <div className="actionbar">
          <button type="button" className="cta grow" disabled={editing || !!busy} onClick={run}>{editing ? "Editing…" : `Apply edit${count > 1 ? ` ×${count}` : ""}`}</button>
        </div>
      ) : null}
    </main>
  );
}
