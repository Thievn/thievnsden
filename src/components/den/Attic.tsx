"use client";

import { useEffect, useRef, useState } from "react";
import { RATIOS, STYLES } from "@/lib/attic/options";
import "./attic.css";

type Shot = {
  id: string;
  prompt: string;
  negative: string;
  model: string | null;
  style: string | null;
  seed: number | null;
  width: number | null;
  height: number | null;
  favorite: boolean;
  folder: string | null;
  status: string;
  error: string | null;
  url: string | null;
  kind: string;
};

type Tool = "generate" | "img2img" | "inpaint" | "expand" | "upscale" | "restore" | "outfit";

function asShot(value: unknown): Shot | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<Shot>;
  if (typeof row.id !== "string") return null;
  return {
    id: row.id,
    prompt: typeof row.prompt === "string" ? row.prompt : "",
    negative: typeof row.negative === "string" ? row.negative : "",
    model: typeof row.model === "string" ? row.model : null,
    style: typeof row.style === "string" ? row.style : null,
    seed: typeof row.seed === "number" ? row.seed : null,
    width: typeof row.width === "number" ? row.width : null,
    height: typeof row.height === "number" ? row.height : null,
    favorite: Boolean(row.favorite),
    folder: typeof row.folder === "string" ? row.folder : null,
    status: typeof row.status === "string" ? row.status : "done",
    error: typeof row.error === "string" ? row.error : null,
    url: typeof row.url === "string" ? row.url : null,
    kind: typeof row.kind === "string" ? row.kind : "upload",
  };
}

function shotsFrom(value: unknown): Shot[] {
  return Array.isArray(value) ? value.flatMap((item) => {
    const shot = asShot(item);
    return shot ? [shot] : [];
  }) : [];
}

class LabError extends Error {
  images: Shot[];

  constructor(message: string, images: Shot[]) {
    super(message);
    this.images = images;
  }
}

async function post(body: Record<string, unknown>) {
  const response = await fetch("/api/lab", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!response.ok) {
    throw new LabError(typeof json?.error === "string" ? json.error : "That didn't go through.", [
      ...shotsFrom(json?.images),
      ...shotsFrom(json?.image ? [json.image] : []),
    ]);
  }
  return json ?? {};
}

async function fileToDataUrl(file: File) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Couldn't read that picture.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.86);
}

export function Attic() {
  const [advanced, setAdvanced] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [negative, setNegative] = useState("");
  const [style, setStyle] = useState<string>(STYLES[0].id);
  const [ratio, setRatio] = useState<string>(RATIOS[0].id);
  const [resolution, setResolution] = useState("standard");
  const [model, setModel] = useState("chroma");
  const [seed, setSeed] = useState("");
  const [steps, setSteps] = useState("");
  const [cfg, setCfg] = useState("");
  const [batch, setBatch] = useState(1);
  const [strength, setStrength] = useState(0.65);
  const [scale, setScale] = useState<2 | 4>(2);
  const [tool, setTool] = useState<Tool>("generate");
  const [source, setSource] = useState<string | null>(null);
  const [outfit, setOutfit] = useState<string | null>(null);
  const [extra, setExtra] = useState<string | null>(null);
  const [mask, setMask] = useState<string | null>(null);
  const [useBody, setUseBody] = useState(false);
  const [face, setFace] = useState(false);
  const [body, setBody] = useState(false);
  const [bodyNotes, setBodyNotes] = useState("");
  const [folders, setFolders] = useState<string[]>([]);
  const [folderName, setFolderName] = useState("");
  const [folderFilter, setFolderFilter] = useState("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [images, setImages] = useState<Shot[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(true);
  const stageRef = useRef<HTMLImageElement | null>(null);
  const maskRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);

  useEffect(() => {
    let gone = false;
    post({ action: "state" })
      .then((json) => {
        if (gone) return;
        setFace(Boolean(json.face));
        setBody(Boolean(json.body));
        setBodyNotes(typeof json.bodyNotes === "string" ? json.bodyNotes : "");
        setFolders(Array.isArray(json.folders) ? json.folders.filter((item): item is string => typeof item === "string") : []);
        setImages(Array.isArray(json.images) ? (json.images as Shot[]) : []);
        setConnected(Boolean(json.runpod));
        if (json.storage === false) setNotice("History isn't set up yet.");
      })
      .catch((reason: unknown) => {
        if (!gone) setError(reason instanceof Error ? reason.message : "Couldn't open this.");
      });
    return () => {
      gone = true;
    };
  }, []);

  useEffect(() => {
    const pending = images.filter((item) => item.status === "queued" || item.status === "running").map((item) => item.id);
    if (!pending.length) return;
    const timer = window.setTimeout(() => {
      post({ action: "poll", ids: pending })
        .then((json) => {
          const fresh = Array.isArray(json.images) ? (json.images as Shot[]) : [];
          setImages((current) => current.map((item) => fresh.find((next) => next.id === item.id) ?? item));
        })
        .catch(() => undefined);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [images]);

  function prepend(next: Shot[]) {
    if (!next.length) return;
    setImages((current) => {
      const ids = new Set(current.map((item) => item.id));
      const fresh = next.filter((item) => !ids.has(item.id));
      return fresh.length ? [...fresh, ...current] : current;
    });
  }

  async function keep(dataUrl: string) {
    try {
      const json = await post({ action: "save", image: dataUrl });
      const shot = asShot(json.image);
      if (shot) prepend([shot]);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "";
      if (reason instanceof LabError && reason.images.length) prepend(reason.images);
      if (message && message !== "History isn't set up yet.") setError(message);
    }
  }

  async function pick(setter: (value: string) => void, file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      const dataUrl = await fileToDataUrl(file);
      setter(dataUrl);
      setMask(null);
      await keep(dataUrl);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Couldn't read that picture.");
    }
  }

  function paint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = maskRef.current;
    const image = stageRef.current;
    if (!canvas || !image || tool !== "inpaint") return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (canvas.width !== image.naturalWidth) {
      canvas.width = image.naturalWidth || image.clientWidth;
      canvas.height = image.naturalHeight || image.clientHeight;
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    if (event.type === "pointerdown") {
      drawing.current = true;
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
    if (!drawing.current) return;
    ctx.strokeStyle = "white";
    ctx.lineWidth = Math.max(18, canvas.width / 28);
    ctx.lineCap = "round";
    ctx.lineTo(x, y);
    ctx.stroke();
    if (event.type === "pointerup" || event.type === "pointerleave") {
      drawing.current = false;
      setMask(canvas.toDataURL("image/png"));
    }
  }

  async function expand(direction: "left" | "right" | "up" | "down") {
    if (!source) return;
    const image = new Image();
    image.src = source;
    await image.decode();
    const growX = direction === "left" || direction === "right" ? Math.round(image.width * 0.28) : 0;
    const growY = direction === "up" || direction === "down" ? Math.round(image.height * 0.28) : 0;
    const canvas = document.createElement("canvas");
    canvas.width = image.width + growX;
    canvas.height = image.height + growY;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#1a1d26";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const x = direction === "left" ? growX : 0;
    const y = direction === "up" ? growY : 0;
    ctx.drawImage(image, x, y);
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const maskCtx = maskCanvas.getContext("2d");
    if (!maskCtx) return;
    maskCtx.fillStyle = "white";
    maskCtx.fillRect(0, 0, canvas.width, canvas.height);
    maskCtx.fillStyle = "black";
    maskCtx.fillRect(x, y, image.width, image.height);
    const next = canvas.toDataURL("image/jpeg", 0.9);
    setSource(next);
    setMask(maskCanvas.toDataURL("image/png"));
    setTool("expand");
    await keep(next);
  }

  async function run(kind: "make" | "enhance" | "face" | "body", file?: File) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (kind === "enhance") {
        const json = await post({ action: "enhance", prompt });
        if (typeof json.prompt === "string") setPrompt(json.prompt);
        setNotice(typeof json.notice === "string" ? json.notice : "Polished.");
        return;
      }
      if (kind === "face" && file) {
        const json = await post({ action: "face-lock", image: await fileToDataUrl(file) });
        setFace(Boolean(json.face));
        const shot = asShot(json.image);
        if (shot) prepend([shot]);
        setNotice("Face lock is on.");
        return;
      }
      if (kind === "body" && file) {
        const json = await post({ action: "body-scan", image: await fileToDataUrl(file) });
        setBody(Boolean(json.body));
        setBodyNotes(typeof json.bodyNotes === "string" ? json.bodyNotes : "");
        const shot = asShot(json.image);
        if (shot) prepend([shot]);
        setNotice("Body scan saved.");
        return;
      }
      const chosen: Tool = advanced ? tool : outfit ? "outfit" : source ? "img2img" : "generate";
      const json = await post({
        action: chosen === "generate" ? "generate" : "edit",
        tool: chosen,
        prompt,
        negative,
        style,
        ratio,
        resolution,
        model,
        seed: seed ? Number(seed) : undefined,
        steps: steps ? Number(steps) : undefined,
        cfg: cfg ? Number(cfg) : undefined,
        batch,
        strength,
        scale,
        useBody,
        image: source,
        outfit,
        extra,
        mask,
      });
      const jobs = Array.isArray(json.jobs) ? json.jobs : [];
      const added: Shot[] = [];
      for (const job of jobs) {
        const row = job as { id?: string; status?: string; seed?: number };
        if (!row.id) continue;
        added.push({
          id: row.id,
          prompt,
          negative,
          model: chosen === "generate" ? model : "qwen",
          style,
          seed: row.seed ?? null,
          width: null,
          height: null,
          favorite: false,
          folder: null,
          status: row.status ?? "running",
          error: null,
          url: null,
          kind: chosen,
        });
      }
      prepend([...added, ...shotsFrom(json.images)]);
      setNotice("It's cooking.");
    } catch (reason) {
      if (reason instanceof LabError && reason.images.length) prepend(reason.images);
      setError(reason instanceof Error ? reason.message : "That didn't go through.");
    } finally {
      setBusy(false);
    }
  }

  const shown = images.filter((item) => {
    if (favoritesOnly && !item.favorite) return false;
    if (folderFilter !== "all" && item.folder !== folderFilter) return false;
    return true;
  });

  return (
    <main className="attic">
      <header className="attic-top">
        <a className="attic-back" href="/den">
          Back
        </a>
        <h1>Den&apos;s Attic</h1>
        <button type="button" className={advanced ? "attic-mode is-on" : "attic-mode"} onClick={() => setAdvanced((value) => !value)}>
          {advanced ? "Advanced" : "Simple"}
        </button>
      </header>

      {!connected ? <p className="attic-note">The picture machine isn&apos;t connected yet. You can still look around.</p> : null}
      {notice ? <p className="attic-note">{notice}</p> : null}
      {error ? <p className="attic-error">{error}</p> : null}

      <section className="attic-card">
        <label>
          Prompt
          <textarea value={prompt} maxLength={2000} onChange={(event) => setPrompt(event.target.value)} placeholder="What should it look like?" />
        </label>
        {advanced ? (
          <label>
            Negative
            <textarea value={negative} maxLength={800} onChange={(event) => setNegative(event.target.value)} placeholder="What to leave out" />
          </label>
        ) : null}
        <div className="chip-row" role="listbox" aria-label="Style">
          {STYLES.map((item) => (
            <button key={item.id} type="button" className={style === item.id ? "chip is-on" : "chip"} onClick={() => setStyle(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
        <div className="chip-row" aria-label="Shape">
          {RATIOS.map((item) => (
            <button key={item.id} type="button" className={ratio === item.id ? "chip is-on" : "chip"} onClick={() => setRatio(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
        {advanced ? (
          <>
            <div className="pair">
              <label>
                Model
                <select value={model} onChange={(event) => setModel(event.target.value)}>
                  <option value="chroma">Chroma</option>
                  <option value="zimage">Z-Image</option>
                </select>
              </label>
              <label>
                Size
                <select value={resolution} onChange={(event) => setResolution(event.target.value)}>
                  <option value="standard">Standard</option>
                  <option value="large">Large</option>
                </select>
              </label>
            </div>
            <div className="pair">
              <label>
                Seed
                <input value={seed} inputMode="numeric" onChange={(event) => setSeed(event.target.value.replace(/[^\d]/g, ""))} placeholder="Random" />
              </label>
              <label>
                Batch
                <select value={batch} onChange={(event) => setBatch(Number(event.target.value))}>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
              </label>
            </div>
            <div className="pair">
              <label>
                Steps
                <input value={steps} inputMode="numeric" onChange={(event) => setSteps(event.target.value.replace(/[^\d]/g, ""))} placeholder={model === "zimage" ? "8" : "28"} />
              </label>
              <label>
                CFG
                <input value={cfg} inputMode="decimal" onChange={(event) => setCfg(event.target.value.replace(/[^\d.]/g, ""))} placeholder={model === "zimage" ? "1" : "4"} />
              </label>
            </div>
          </>
        ) : null}
        <div className="attic-row">
          <button className="turn" type="button" disabled={busy} onClick={() => run("make")}>
            {busy ? "Working" : "Make it"}
          </button>
          <button className="text-button" type="button" disabled={busy || !prompt.trim()} onClick={() => run("enhance")}>
            Enhance
          </button>
        </div>
      </section>

      <section className="attic-card">
        <div className="slot-grid">
          <Slot label="Picture" image={source} onPick={(file) => pick(setSource, file)} onClear={() => { setSource(null); setMask(null); }} />
          <Slot label="Outfit" image={outfit} onPick={(file) => pick(setOutfit, file)} onClear={() => setOutfit(null)} />
          <Slot label="Another piece" image={extra} onPick={(file) => pick(setExtra, file)} onClear={() => setExtra(null)} />
        </div>
        {source ? (
          <div className="stage">
            <img ref={stageRef} src={source} alt="" />
            {advanced && tool === "inpaint" ? (
              <canvas
                ref={maskRef}
                className="mask"
                onPointerDown={paint}
                onPointerMove={paint}
                onPointerUp={paint}
                onPointerLeave={paint}
              />
            ) : null}
          </div>
        ) : null}
        {advanced ? (
          <>
            <div className="tool-row" aria-label="Tools">
              {(["img2img", "inpaint", "expand", "upscale", "restore", "outfit"] as Tool[]).map((item) => (
                <button key={item} type="button" className={tool === item ? "attic-tool is-on" : "attic-tool"} onClick={() => setTool(item)}>
                  {item === "img2img" ? "Remix" : item === "inpaint" ? "Brush" : item === "expand" ? "Expand" : item === "upscale" ? "Upscale" : item === "restore" ? "Face fix" : "Outfit"}
                </button>
              ))}
            </div>
            {tool === "expand" ? (
              <div className="chip-row">
                {(["left", "right", "up", "down"] as const).map((direction) => (
                  <button key={direction} type="button" className="chip" onClick={() => expand(direction)}>
                    {direction}
                  </button>
                ))}
              </div>
            ) : null}
            {tool === "upscale" ? (
              <div className="chip-row">
                <button type="button" className={scale === 2 ? "chip is-on" : "chip"} onClick={() => setScale(2)}>2x</button>
                <button type="button" className={scale === 4 ? "chip is-on" : "chip"} onClick={() => setScale(4)}>4x</button>
              </div>
            ) : null}
            {tool === "img2img" || tool === "inpaint" ? (
              <label>
                Strength {strength.toFixed(2)}
                <input className="range" type="range" min={0.2} max={1} step={0.05} value={strength} onChange={(event) => setStrength(Number(event.target.value))} />
              </label>
            ) : null}
          </>
        ) : null}
        <div className="attic-row">
          <label className="check">
            <input type="checkbox" checked={useBody} onChange={(event) => setUseBody(event.target.checked)} />
            Use body scan
          </label>
          <span className="quiet">{face ? "Face lock on" : "No face lock"}</span>
        </div>
        {bodyNotes ? <p className="quiet">{bodyNotes}</p> : null}
        <div className="chip-row">
          <label className="chip">
            Face scan
            <input className="sr-only" type="file" accept="image/*" onChange={(event) => run("face", event.target.files?.[0])} />
          </label>
          <label className="chip">
            Body scan
            <input className="sr-only" type="file" accept="image/*" onChange={(event) => run("body", event.target.files?.[0])} />
          </label>
          {face ? (
            <button
              type="button"
              className="chip"
              onClick={() => post({ action: "face-clear" }).then(() => setFace(false)).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Couldn't clear that."))}
            >
              Clear face
            </button>
          ) : null}
          {body ? (
            <button
              type="button"
              className="chip"
              onClick={() => post({ action: "body-clear" }).then(() => { setBody(false); setBodyNotes(""); }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Couldn't clear that."))}
            >
              Clear body
            </button>
          ) : null}
        </div>
      </section>

      <section className="attic-card">
        <div className="attic-row">
          <h2>History</h2>
          <button type="button" className={favoritesOnly ? "chip is-on" : "chip"} onClick={() => setFavoritesOnly((value) => !value)}>
            Favorites
          </button>
        </div>
        <div className="pair">
          <label>
            Folder
            <select value={folderFilter} onChange={(event) => setFolderFilter(event.target.value)}>
              <option value="all">All</option>
              {folders.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>
          <label>
            New folder
            <input
              value={folderName}
              maxLength={40}
              onChange={(event) => setFolderName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" || !folderName.trim()) return;
                post({ action: "folder", create: true, name: folderName.trim() })
                  .then((json) => {
                    setFolders(Array.isArray(json.folders) ? json.folders.filter((item): item is string => typeof item === "string") : []);
                    setFolderName("");
                  })
                  .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Couldn't save that folder."));
              }}
              placeholder="Name, then Enter"
            />
          </label>
        </div>
        {shown.length === 0 ? <p className="quiet">Nothing up here yet.</p> : null}
        <div className="gallery">
          {shown.map((item) => (
            <article key={item.id} className="shot">
              {item.url ? <img src={item.url} alt="" /> : <p className="quiet">{item.status === "failed" ? item.error || "Couldn't finish that." : "Cooking"}</p>}
              <div className="shot-actions">
                <button
                  type="button"
                  onClick={() => {
                    setPrompt(item.prompt);
                    setNegative(item.negative);
                    if (item.style) setStyle(item.style);
                    if (item.model === "zimage" || item.model === "chroma") setModel(item.model);
                    if (item.seed != null) setSeed(String(item.seed));
                    setNotice("Settings loaded.");
                    if (item.url) {
                      post({ action: "file", id: item.id })
                        .then((json) => {
                          if (typeof json.dataUrl === "string") setSource(json.dataUrl);
                        })
                        .catch(() => undefined);
                    }
                  }}
                >
                  Remix
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = !item.favorite;
                    setImages((current) => current.map((row) => (row.id === item.id ? { ...row, favorite: next } : row)));
                    post({ action: "favorite", id: item.id, on: next }).catch(() => {
                      setImages((current) => current.map((row) => (row.id === item.id ? { ...row, favorite: item.favorite } : row)));
                    });
                  }}
                >
                  {item.favorite ? "Starred" : "Star"}
                </button>
                {item.url ? (
                  <a href={item.url} download>
                    Download
                  </a>
                ) : null}
              </div>
              {folders.length ? (
                <select
                  value={item.folder ?? ""}
                  onChange={(event) => {
                    const folder = event.target.value;
                    setImages((current) => current.map((row) => (row.id === item.id ? { ...row, folder: folder || null } : row)));
                    post({ action: "folder", id: item.id, name: folder }).catch(() => undefined);
                  }}
                >
                  <option value="">No folder</option>
                  {folders.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function Slot({
  label,
  image,
  onPick,
  onClear,
}: {
  label: string;
  image: string | null;
  onPick: (file: File | undefined) => void;
  onClear: () => void;
}) {
  return (
    <div>
      <label className="slot">
        {image ? <img src={image} alt="" /> : null}
        <span>{label}</span>
        <input className="sr-only" type="file" accept="image/*" onChange={(event) => onPick(event.target.files?.[0])} />
      </label>
      {image ? (
        <button type="button" className="text-button" onClick={onClear}>
          Clear
        </button>
      ) : null}
    </div>
  );
}
