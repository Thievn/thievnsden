"use client";

import { useMemo, useState } from "react";
import poses from "@/lib/lab/poses.json";

export type Pose = {
  id: string;
  name: string;
  cat: string;
  aspect: string;
  hint: string;
  w: number;
  h: number;
  strength?: number;
  data?: string;
  thumb?: string;
};

const POSES = poses as Pose[];
const CATS = [...new Set(POSES.map((pose) => pose.cat))];
const DIMS = { portrait: [832, 1216], square: [1024, 1024], landscape: [1216, 832] } as const;

export async function poseData(sel: Pose) {
  if (sel.data) return sel.data;
  const blob = await (await fetch(`/poses/${sel.id}.png`)).blob();
  return await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

function loadSkeleton(file: File) {
  return new Promise<Pose>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const ratio = image.width / image.height;
      const aspect = ratio > 1.2 ? "landscape" : ratio < 0.85 ? "portrait" : "square";
      const [width, height] = DIMS[aspect];
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Couldn't read that skeleton"));
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, width, height);
      const scale = Math.min(width / image.width, height / image.height);
      const w = image.width * scale;
      const h = image.height * scale;
      ctx.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
      const data = ctx.getImageData(0, 0, width, height).data;
      let dark = 0;
      let n = 0;
      for (let i = 0; i < data.length; i += 4 * 37) {
        n += 1;
        if (Math.max(data[i], data[i + 1], data[i + 2]) < 30) dark += 1;
      }
      if (dark / n < 0.6) {
        return reject(new Error("That looks like a photo. Upload an OpenPose skeleton (colored stick figure on black)."));
      }
      resolve({
        id: "upload",
        name: "Uploaded skeleton",
        cat: "Custom",
        hint: "",
        aspect,
        w: width,
        h: height,
        data: canvas.toDataURL("image/png"),
        thumb: canvas.toDataURL("image/jpeg", 0.6),
      });
    };
    image.onerror = () => reject(new Error("Couldn't read that skeleton"));
    image.src = URL.createObjectURL(file);
  });
}

export function PoseButton({ sel, onOpen, disabled, note }: { sel: Pose | null; onOpen: () => void; disabled?: boolean; note?: string }) {
  return (
    <button type="button" className="picker" onClick={onOpen} disabled={disabled}>
      {sel ? <img className="posethumb" src={sel.thumb || `/poses/thumbs/${sel.id}.webp`} alt="" /> : <span className="mark">Pose</span>}
      <span className="grow">
        <b>{sel ? sel.name : "No pose control"}</b>
        <small>{disabled ? note : sel ? `${sel.cat} · strength ${(sel.strength ?? 0.8).toFixed(2)}` : "Search skeletons by name or hidden keyword"}</small>
      </span>
    </button>
  );
}

export function PosePicker({
  open,
  onClose,
  sel,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  sel: Pose | null;
  onPick: (pose: Pose | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");
  const [err, setErr] = useState("");
  const [strength, setStrength] = useState(sel?.strength ?? 0.8);
  const list = useMemo(() => {
    const text = query.trim().toLowerCase();
    return POSES.filter((pose) => (cat === "All" || pose.cat === cat) && (!text || `${pose.name} ${pose.cat} ${pose.hint}`.toLowerCase().includes(text)));
  }, [query, cat]);
  if (!open) return null;
  function pick(pose: Pose | null) {
    onPick(pose ? { ...pose, strength } : null);
    onClose();
  }
  return (
    <div className="sheetwrap" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label={`Pose · ${POSES.length} skeletons`} onClick={(event) => event.stopPropagation()}>
        <div className="sheethead">
          <b>Pose · {POSES.length}</b>
          <button type="button" className="icon" onClick={onClose} aria-label="Close">Close</button>
        </div>
        <div className="sheetbody">
          <input type="search" placeholder="Search poses (e.g. mirror, kneel, couch)" value={query} onChange={(event) => setQuery(event.target.value)} />
          <div className="chips">
            {["All", ...CATS].map((item) => (
              <button key={item} type="button" className={cat === item ? "chip on" : "chip"} onClick={() => setCat(item)}>{item}</button>
            ))}
          </div>
          {err ? <p className="err">{err}</p> : null}
          <div className="posegrid">
            {cat === "All" && !query ? (
              <>
                <button type="button" className={!sel ? "posecard on" : "posecard"} onClick={() => pick(null)}>
                  <b>No pose</b><small>prompt only</small>
                </button>
                <label className="posecard">
                  <b>Upload skeleton</b><small>OpenPose PNG</small>
                  <input type="file" accept="image/*" hidden onChange={async (event) => {
                    setErr("");
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (!file) return;
                    try { pick(await loadSkeleton(file)); } catch (error) { setErr(error instanceof Error ? error.message : "Couldn't read that"); }
                  }} />
                </label>
              </>
            ) : null}
            {list.map((pose) => (
              <button key={pose.id} type="button" className={sel?.id === pose.id ? "posecard on" : "posecard"} onClick={() => pick(pose)}>
                <img src={`/poses/thumbs/${pose.id}.webp`} alt="" className={pose.aspect} />
                <b>{pose.name}</b>
                <small>{pose.cat}</small>
              </button>
            ))}
          </div>
          {!list.length ? <p className="muted">No poses match “{query}”.</p> : null}
        </div>
        <div className="sheetfoot">
          <label className="slider">Pose strength <b>{strength.toFixed(2)}</b>
            <input type="range" min="0.3" max="1" step="0.05" value={strength} onChange={(event) => {
              const value = Number(event.target.value);
              setStrength(value);
              if (sel) onPick({ ...sel, strength: value });
            }} />
          </label>
        </div>
      </div>
    </div>
  );
}
