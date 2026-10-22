"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  APPEARANCE,
  ART_STYLES,
  PERSONALITY,
  POSES,
  RATIO_CHOICES,
  SCENES,
  buildCharacterPrompt,
  poseById,
  styleEmoji,
  withPose,
  type Recipe,
} from "@/lib/attic/presets";
import "./lab.css";

export type LabView = "create" | "gallery" | "edit" | "characters";

type Shot = {
  id: string;
  prompt: string;
  negative: string;
  model: string | null;
  style: string | null;
  seed: number | null;
  favorite: boolean;
  folder: string | null;
  status: string;
  error: string | null;
  url: string | null;
  kind: string;
  parentId: string | null;
};

type Character = {
  id: string;
  name: string;
  style: string;
  appearance: Record<string, string>;
  personality: string;
  scene: string;
  prompt: string;
  favorite: boolean;
  url: string | null;
};

type Tool = "img2img" | "inpaint" | "expand" | "upscale" | "restore" | "outfit";

const TOOLS: { id: Tool; label: string }[] = [
  { id: "img2img", label: "Remix" },
  { id: "inpaint", label: "Brush" },
  { id: "expand", label: "Expand" },
  { id: "upscale", label: "Upscale" },
  { id: "restore", label: "Face fix" },
  { id: "outfit", label: "Outfit" },
];

const TABS: { href: string; view: LabView; icon: string; label: string }[] = [
  { href: "/attic", view: "create", icon: "✦", label: "Create" },
  { href: "/characters", view: "characters", icon: "♡", label: "Characters" },
  { href: "/gallery", view: "gallery", icon: "▦", label: "Gallery" },
  { href: "/edit", view: "edit", icon: "✎", label: "Edit" },
];

const BUDGET = 4_000_000;

class LabError extends Error {
  images: Shot[];
  constructor(message: string, images: Shot[]) {
    super(message);
    this.images = images;
  }
}

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
    favorite: Boolean(row.favorite),
    folder: typeof row.folder === "string" ? row.folder : null,
    status: typeof row.status === "string" ? row.status : "done",
    error: typeof row.error === "string" ? row.error : null,
    url: typeof row.url === "string" ? row.url : null,
    kind: typeof row.kind === "string" ? row.kind : "upload",
    parentId: typeof row.parentId === "string" ? row.parentId : null,
  };
}

function shotsFrom(value: unknown): Shot[] {
  return Array.isArray(value) ? value.flatMap((item) => {
    const shot = asShot(item);
    return shot ? [shot] : [];
  }) : [];
}

function asCharacter(value: unknown): Character | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<Character>;
  if (typeof row.id !== "string" || typeof row.name !== "string") return null;
  const appearance: Record<string, string> = {};
  if (row.appearance && typeof row.appearance === "object") {
    for (const [key, item] of Object.entries(row.appearance)) {
      if (typeof item === "string") appearance[key] = item;
    }
  }
  return {
    id: row.id,
    name: row.name,
    style: typeof row.style === "string" ? row.style : "semireal",
    appearance,
    personality: typeof row.personality === "string" ? row.personality : "",
    scene: typeof row.scene === "string" ? row.scene : "",
    prompt: typeof row.prompt === "string" ? row.prompt : "",
    favorite: Boolean(row.favorite),
    url: typeof row.url === "string" ? row.url : null,
  };
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

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Couldn't read that picture."));
    reader.readAsDataURL(file);
  });
}

async function shrinkDataUrl(dataUrl: string, maxEdge: number, quality: number) {
  const image = new Image();
  image.src = dataUrl;
  await image.decode();
  const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

async function fitEdit(body: Record<string, unknown>) {
  let next = body;
  const size = () => JSON.stringify(next).length;
  if (size() <= BUDGET) return next;
  for (const key of ["image", "outfit", "extra", "mask"]) {
    if (typeof next[key] !== "string") continue;
    next = { ...next, [key]: await shrinkDataUrl(String(next[key]), 1280, 0.72) };
    if (size() <= BUDGET) return next;
  }
  if (size() > BUDGET) throw new Error("That picture is too big to send.");
  return next;
}

function blankFrame() {
  const canvas = document.createElement("canvas");
  canvas.width = 832;
  canvas.height = 1216;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const wash = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  wash.addColorStop(0, "#1a1020");
  wash.addColorStop(0.55, "#2a1020");
  wash.addColorStop(1, "#140818");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.86);
}

function choiceLabel(groupId: string, optionId: string) {
  const group = APPEARANCE.find((item) => item.id === groupId);
  return group?.options.find((option) => option.id === optionId)?.label ?? "";
}

export function LabApp({ view, shot, character }: { view: LabView; shot: string; character: string }) {
  const [name, setName] = useState("");
  const [style, setStyle] = useState("semireal");
  const [appearance, setAppearance] = useState<Record<string, string>>({});
  const [personality, setPersonality] = useState("");
  const [scene, setScene] = useState("");
  const [action, setAction] = useState("");
  const [prompt, setPrompt] = useState("");
  const [custom, setCustom] = useState(false);
  const [negative, setNegative] = useState("");
  const [ratio, setRatio] = useState("portrait");
  const [resolution, setResolution] = useState("standard");
  const [model, setModel] = useState("chroma");
  const [seed, setSeed] = useState("");
  const [steps, setSteps] = useState("");
  const [cfg, setCfg] = useState("");
  const [batch, setBatch] = useState(1);
  const [strength, setStrength] = useState(0.65);
  const [scale, setScale] = useState<2 | 4>(2);
  const [tool, setTool] = useState<Tool>("img2img");
  const [source, setSource] = useState<string | null>(null);
  const [sourceKind, setSourceKind] = useState<"upload" | "character" | null>(null);
  const [outfit, setOutfit] = useState<string | null>(null);
  const [extra, setExtra] = useState<string | null>(null);
  const [mask, setMask] = useState<string | null>(null);
  const [parent, setParent] = useState("");
  const [pose, setPose] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [beforeUrl, setBeforeUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [useBody, setUseBody] = useState(false);
  const [face, setFace] = useState(false);
  const [body, setBody] = useState(false);
  const [bodyNotes, setBodyNotes] = useState("");
  const [folders, setFolders] = useState<string[]>([]);
  const [folderName, setFolderName] = useState("");
  const [folderFilter, setFolderFilter] = useState("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [images, setImages] = useState<Shot[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [savedId, setSavedId] = useState("");
  const [open, setOpen] = useState(view === "create" ? "look" : "");
  const [sheet, setSheet] = useState(false);
  const [viewer, setViewer] = useState<{ items: Shot[]; index: number } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(true);
  const [storageReady, setStorageReady] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const stageRef = useRef<HTMLImageElement | null>(null);
  const maskRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const appliedCharacter = useRef("");

  const built = useMemo(
    () => buildCharacterPrompt({ name, style, appearance, personality, scene, action }),
    [name, style, appearance, personality, scene, action],
  );
  const preview = custom ? prompt : built;
  const selected = characters.find((item) => item.id === selectedId) ?? null;

  useEffect(() => {
    let gone = false;
    post({ action: "state" })
      .then((json) => {
        if (gone) return;
        setFace(Boolean(json.face));
        setBody(Boolean(json.body));
        setBodyNotes(typeof json.bodyNotes === "string" ? json.bodyNotes : "");
        setFolders(Array.isArray(json.folders) ? json.folders.filter((item): item is string => typeof item === "string") : []);
        setImages(shotsFrom(json.images));
        setCharacters(Array.isArray(json.characters) ? json.characters.flatMap((item) => {
          const row = asCharacter(item);
          return row ? [row] : [];
        }) : []);
        setConnected(Boolean(json.runpod));
        setStorageReady(json.storage !== false);
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
          const fresh = shotsFrom(json.images);
          setImages((current) => current.map((item) => fresh.find((next) => next.id === item.id) ?? item));
          const done = fresh.find((item) => item.url);
          if (done?.url) setResultUrl(done.url);
        })
        .catch(() => undefined);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [images]);

  useEffect(() => {
    if (!character || appliedCharacter.current === character) return;
    const found = characters.find((item) => item.id === character);
    if (!found) return;
    appliedCharacter.current = character;
    setName(found.name);
    setStyle(found.style || "semireal");
    setAppearance(found.appearance);
    setPersonality(found.personality);
    setScene(found.scene);
    setSavedId(found.id);
    setSelectedId(found.id);
    setCustom(false);
  }, [character, characters]);

  useEffect(() => {
    if (view !== "edit" || !/^[0-9a-f-]{36}$/i.test(shot)) return;
    let gone = false;
    post({ action: "file", id: shot })
      .then((json) => {
        if (gone) return;
        if (typeof json.dataUrl === "string") {
          setSource(json.dataUrl);
          setParent(shot);
          setSourceKind("upload");
        }
        const image = asShot(json.image);
        if (image?.prompt) setEditPrompt(image.prompt);
      })
      .catch(() => undefined);
    return () => {
      gone = true;
    };
  }, [view, shot]);

  function prepend(next: Shot[]) {
    if (!next.length) return;
    setImages((current) => {
      const ids = new Set(current.map((item) => item.id));
      const fresh = next.filter((item) => !ids.has(item.id));
      return fresh.length ? [...fresh, ...current] : current;
    });
  }

  function recipe(): Recipe {
    return { name, style, appearance, personality, scene, action };
  }

  function toggleAppearance(group: string, id: string) {
    setAppearance((current) => {
      const next = { ...current };
      if (next[group] === id) delete next[group];
      else next[group] = id;
      return next;
    });
    setCustom(false);
  }

  async function keep(dataUrl: string) {
    try {
      const json = await post({ action: "save", image: dataUrl });
      const saved = asShot(json.image);
      if (saved) prepend([saved]);
    } catch (reason) {
      if (reason instanceof LabError && reason.images.length) prepend(reason.images);
      const message = reason instanceof Error ? reason.message : "";
      if (message && message !== "History isn't set up yet.") setError(message);
    }
  }

  async function pick(slot: "source" | "outfit" | "extra", file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      const dataUrl = await readFile(file);
      if (slot === "source") {
        setSource(dataUrl);
        setSourceKind("upload");
        setMask(null);
        setParent("");
        setResultUrl(null);
        setBeforeUrl(null);
      } else if (slot === "outfit") setOutfit(dataUrl);
      else setExtra(dataUrl);
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
    ctx.fillStyle = "#1a1020";
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

  function choosePose(id: string) {
    const previous = poseById(pose)?.keywords ?? "";
    const stripped = previous ? editPrompt.replace(previous, " ") : editPrompt;
    setPose(id);
    setEditPrompt(withPose(stripped, id));
  }

  async function enhance() {
    const text = view === "edit" ? editPrompt : preview;
    setBusy(true);
    setError(null);
    try {
      const json = await post({ action: "enhance", prompt: text });
      if (typeof json.prompt === "string") {
        if (view === "edit") setEditPrompt(json.prompt);
        else {
          setPrompt(json.prompt);
          setCustom(true);
        }
      }
      setNotice(typeof json.notice === "string" ? json.notice : "Polished.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "That didn't go through.");
    } finally {
      setBusy(false);
    }
  }

  async function generate() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const json = await post({
        action: "generate",
        prompt: preview,
        custom,
        recipe: recipe(),
        negative,
        style,
        ratio,
        resolution,
        model,
        seed: seed ? Number(seed) : undefined,
        steps: steps ? Number(steps) : undefined,
        cfg: cfg ? Number(cfg) : undefined,
        batch,
        useBody,
      });
      const jobs = Array.isArray(json.jobs) ? json.jobs : [];
      prepend(jobs.flatMap((job) => {
        const row = job as { id?: string; status?: string; seed?: number };
        if (!row.id) return [];
        return [{
          id: row.id,
          prompt: preview,
          negative,
          model,
          style,
          seed: row.seed ?? null,
          favorite: false,
          folder: null,
          status: row.status ?? "running",
          error: null,
          url: null,
          kind: "generate",
          parentId: null,
        }];
      }));
      setNotice("It's cooking.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "That didn't go through.");
    } finally {
      setBusy(false);
    }
  }

  async function runEdit() {
    if (!source) {
      setError("Add a picture first.");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    setBeforeUrl(source);
    setResultUrl(null);
    try {
      const body = await fitEdit({
        action: "edit",
        tool,
        prompt: editPrompt,
        negative,
        style,
        ratio,
        resolution,
        seed: seed ? Number(seed) : undefined,
        strength,
        scale,
        useBody,
        image: source,
        outfit,
        extra,
        mask,
        parent: parent || undefined,
      });
      const json = await post(body);
      const jobs = Array.isArray(json.jobs) ? json.jobs : [];
      prepend([
        ...jobs.flatMap((job) => {
          const row = job as { id?: string; status?: string; seed?: number };
          if (!row.id) return [];
          return [{
            id: row.id,
            prompt: editPrompt,
            negative,
            model: "qwen",
            style,
            seed: row.seed ?? null,
            favorite: false,
            folder: null,
            status: row.status ?? "running",
            error: null,
            url: null,
            kind: tool,
            parentId: parent || null,
          }];
        }),
        ...shotsFrom(json.images),
      ]);
      setNotice("It's cooking.");
    } catch (reason) {
      if (reason instanceof LabError && reason.images.length) prepend(reason.images);
      setError(reason instanceof Error ? reason.message : "That didn't go through.");
    } finally {
      setBusy(false);
    }
  }

  async function saveCharacter() {
    if (!name.trim()) {
      setError("Give her a name.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      let cover: string | undefined;
      const latest = images.find((item) => item.status === "done" && item.url);
      if (latest) {
        const file = await post({ action: "file", id: latest.id }).catch(() => null);
        if (file && typeof file.dataUrl === "string") cover = await shrinkDataUrl(file.dataUrl, 900, 0.7);
      }
      const json = await post({
        action: "character-save",
        id: savedId || undefined,
        recipe: { ...recipe(), action: "" },
        cover,
      });
      const saved = asCharacter(json.character);
      if (saved) {
        setSavedId(saved.id);
        setSelectedId(saved.id);
        setCharacters((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
        setNotice("Saved.");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Couldn't save that.");
    } finally {
      setBusy(false);
    }
  }

  function selectCharacter(item: Character) {
    setSelectedId(item.id);
    setSavedId(item.id);
    setName(item.name);
    setStyle(item.style || "semireal");
    setAppearance(item.appearance);
    setPersonality(item.personality);
    setScene(item.scene);
    setAction("");
    setCustom(false);
    setConfirmDelete(false);
  }

  const shown = images.filter((item) => {
    if (favoritesOnly && !item.favorite) return false;
    if (folderFilter !== "all" && item.folder !== folderFilter) return false;
    if (query.trim()) {
      const hay = `${item.prompt} ${item.kind} ${item.style ?? ""}`.toLowerCase();
      if (!hay.includes(query.trim().toLowerCase())) return false;
    }
    return view === "gallery" ? item.kind !== "upload" || Boolean(item.favorite) : true;
  });
  const tree = images.filter((item) => item.id === parent || (parent && item.parentId === parent) || item.id === shot);
  const lookSummary = Object.entries(appearance).map(([group, id]) => choiceLabel(group, id)).filter(Boolean).join(" · ");
  const output = images.find((item) => item.status === "queued" || item.status === "running") ?? images.find((item) => item.kind !== "upload" && item.url);

  const primary = view === "edit" ? runEdit : generate;
  const primaryLabel = busy ? "Working" : view === "edit" ? "Edit" : "Make her";

  return (
    <div className="lab">
      <div className="wrap app">
        <header className="top">
          <a className="back muted" href="/den">Den</a>
          <h1 className="logo">Den <span>Lab</span></h1>
          <span className="pill">{styleEmoji(style)} {ART_STYLES.find((item) => item.id === style)?.label}</span>
        </header>
        {!connected ? <p className="muted small">The picture machine isn't connected yet. You can still look around.</p> : null}
        {!storageReady ? <p className="muted small">History isn't set up yet.</p> : null}
        {notice ? <p className="muted small">{notice}</p> : null}
        {error ? <p className="err">{error}</p> : null}

        {view === "create" ? (
          <div className="grid">
            <div className="col">
              <section className="card">
                <h3>Art style</h3>
                <div className="stylegrid" role="listbox" aria-label="Art style">
                  {ART_STYLES.map((item) => (
                    <button key={item.id} type="button" className={style === item.id ? "stylecard on" : "stylecard"} aria-pressed={style === item.id} onClick={() => { setStyle(item.id); setCustom(false); }}>
                      <span className="em">{item.emoji}</span>
                      <b>{item.label}</b>
                      <small>{item.blurb}</small>
                    </button>
                  ))}
                </div>
              </section>
              <label className="card">
                Name
                <input value={name} maxLength={40} onChange={(event) => { setName(event.target.value); setCustom(false); }} placeholder="What do you call her?" />
              </label>
              <Accordion title="Appearance" summary={lookSummary || "Hair, eyes, clothes"} open={open === "look"} onToggle={() => setOpen(open === "look" ? "" : "look")}>
                {APPEARANCE.map((group) => (
                  <div key={group.id}>
                    <p className="lbl">{group.label}</p>
                    <div className="chiprow" role="listbox" aria-label={group.label}>
                      {group.options.map((option) => (
                        <button key={option.id} type="button" className={appearance[group.id] === option.id ? "chip on" : "chip"} aria-pressed={appearance[group.id] === option.id} onClick={() => toggleAppearance(group.id, option.id)}>
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </Accordion>
              <Accordion title="Personality" summary={PERSONALITY.find((item) => item.id === personality)?.label ?? "Manner"} open={open === "self"} onToggle={() => setOpen(open === "self" ? "" : "self")}>
                <div className="chiprow" aria-label="Personality">
                  {PERSONALITY.map((item) => (
                    <button key={item.id} type="button" className={personality === item.id ? "chip on" : "chip"} aria-pressed={personality === item.id} onClick={() => { setPersonality(personality === item.id ? "" : item.id); setCustom(false); }}>
                      {item.label}
                    </button>
                  ))}
                </div>
              </Accordion>
              <Accordion title="Scene" summary={SCENES.find((item) => item.id === scene)?.label ?? "Place"} open={open === "place"} onToggle={() => setOpen(open === "place" ? "" : "place")}>
                <div className="chiprow" aria-label="Scene">
                  {SCENES.map((item) => (
                    <button key={item.id} type="button" className={scene === item.id ? "chip on" : "chip"} aria-pressed={scene === item.id} onClick={() => { setScene(scene === item.id ? "" : item.id); setCustom(false); }}>
                      {item.label}
                    </button>
                  ))}
                </div>
              </Accordion>
              <label className="card">
                What is she doing?
                <textarea value={action} maxLength={400} onChange={(event) => { setAction(event.target.value); setCustom(false); }} placeholder="Walking through the doorway, coat still on." />
              </label>
              <section className="card">
                <h3>Prompt</h3>
                <button type="button" className="promptprev" onClick={() => setSheet(true)}>{preview}</button>
                <div className="row">
                  <label className="seed">
                    Seed
                    <input value={seed} inputMode="numeric" onChange={(event) => setSeed(event.target.value.replace(/[^\d]/g, ""))} placeholder="Random" />
                  </label>
                </div>
                <div className="chiprow" aria-label="Shape">
                  {RATIO_CHOICES.map((item) => (
                    <button key={item.id} type="button" className={ratio === item.id ? "chip on" : "chip"} aria-pressed={ratio === item.id} onClick={() => setRatio(item.id)}>
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="desk">
                  <button className="cta big" type="button" disabled={busy} onClick={primary}>{primaryLabel}</button>
                </div>
                <button className="btn wide" type="button" disabled={busy} onClick={saveCharacter}>Save character</button>
              </section>
              <Accordion title="Fine tune" summary={model === "zimage" ? "Z-Image" : "Chroma"} open={open === "fine"} onToggle={() => setOpen(open === "fine" ? "" : "fine")}>
                <FineTune
                  model={model} setModel={setModel} resolution={resolution} setResolution={setResolution}
                  steps={steps} setSteps={setSteps} cfg={cfg} setCfg={setCfg} batch={batch} setBatch={setBatch}
                  negative={negative} setNegative={setNegative} useBody={useBody} setUseBody={setUseBody}
                />
              </Accordion>
            </div>
            <aside className="col side">
              <section className="card">
                <h3>Output</h3>
                {output?.url ? <img className="out" src={output.url} alt="" /> : <div className={output ? "out skeleton" : "out skeleton"}>{output ? output.status : "She'll show up here."}</div>}
                <div className="hist">
                  {images.slice(0, 9).map((item) => (
                    <button key={item.id} type="button" className="thumb" onClick={() => { if (item.url) setViewer({ items: images, index: images.findIndex((row) => row.id === item.id) }); }}>
                      {item.url ? <img src={item.url} alt="" /> : <div className="skeleton" style={{ aspectRatio: "2 / 3" }}>{item.status}</div>}
                      {item.favorite ? <span className="badge">★</span> : null}
                    </button>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        ) : null}

        {view === "characters" ? (
          <div className="col">
            {selected ? (
              <section className="card hero">
                {selected.url ? <img className="cover" src={selected.url} alt="" /> : <div className="noimg cover">{styleEmoji(selected.style)}</div>}
                <div className="grow">
                  <label>
                    Name
                    <input value={name} maxLength={40} onChange={(event) => setName(event.target.value)} />
                  </label>
                  <div className="tags">
                    <span className="tag">{ART_STYLES.find((item) => item.id === style)?.label}</span>
                    {lookSummary.split(" · ").filter(Boolean).slice(0, 4).map((item) => <span key={item} className="tag">{item}</span>)}
                  </div>
                  <label>
                    What should she do?
                    <textarea value={action} maxLength={400} onChange={(event) => { setAction(event.target.value); setCustom(false); }} placeholder="What should she do?" />
                  </label>
                  <p className="promptprev clamp">{preview}</p>
                  <div className="row">
                    <button className="btn" type="button" disabled={busy} onClick={saveCharacter}>Save</button>
                    <a className="btn" href={`/attic?character=${selected.id}`}>Adjust her look</a>
                    <button className="btn" type="button" onClick={() => {
                      const on = !selected.favorite;
                      setCharacters((current) => current.map((item) => item.id === selected.id ? { ...item, favorite: on } : item));
                      post({ action: "character-favorite", id: selected.id, on }).catch(() => undefined);
                    }}>{selected.favorite ? "Starred" : "Star"}</button>
                    <button className="btn danger" type="button" onClick={() => {
                      if (!confirmDelete) {
                        setConfirmDelete(true);
                        return;
                      }
                      post({ action: "character-delete", id: selected.id })
                        .then(() => {
                          setCharacters((current) => current.filter((item) => item.id !== selected.id));
                          setSelectedId("");
                          setConfirmDelete(false);
                        })
                        .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Couldn't save that."));
                    }}>{confirmDelete ? "Confirm delete" : "Delete"}</button>
                  </div>
                  <div className="desk">
                    <button className="cta big" type="button" disabled={busy} onClick={primary}>{primaryLabel}</button>
                  </div>
                </div>
              </section>
            ) : <p className="empty muted">Save a character from Create, then tell her what to do.</p>}
            <div className="cgrid">
              {characters.map((item) => (
                <button key={item.id} type="button" className="ccard" onClick={() => selectCharacter(item)}>
                  {item.url ? <img src={item.url} alt="" /> : <div className="noimg">{styleEmoji(item.style)}</div>}
                  <span className="cinfo">
                    <b>{item.name}</b>
                    <small className="muted">{ART_STYLES.find((styleItem) => styleItem.id === item.style)?.label}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {view === "gallery" ? (
          <section className="card">
            <div className="row between">
              <h3>Gallery</h3>
              <label className="check">
                <input type="checkbox" checked={favoritesOnly} onChange={(event) => setFavoritesOnly(event.target.checked)} />
                Favorites
              </label>
            </div>
            <input className="search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pictures" aria-label="Search pictures" />
            <div className="row">
              <input value={folderName} onChange={(event) => setFolderName(event.target.value)} placeholder="New folder" aria-label="New folder" />
              <button className="btn" type="button" onClick={() => {
                const folder = folderName.trim();
                if (!folder) return;
                post({ action: "folder", create: true, name: folder }).then((json) => {
                  setFolders(Array.isArray(json.folders) ? json.folders.filter((item): item is string => typeof item === "string") : []);
                  setFolderName("");
                }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Couldn't save that."));
              }}>Add</button>
              <select aria-label="Folder" value={folderFilter} onChange={(event) => setFolderFilter(event.target.value)}>
                <option value="all">All</option>
                {folders.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            {shown.length ? (
              <div className="hist big">
                {shown.map((item) => (
                  <button key={item.id} type="button" className="thumb" onClick={() => setViewer({ items: shown, index: shown.findIndex((row) => row.id === item.id) })}>
                    {item.url ? <img src={item.url} alt="" /> : <div className="skeleton" style={{ aspectRatio: "2 / 3" }}>{item.status}</div>}
                    {item.favorite ? <span className="badge">★</span> : null}
                    <span className="badge r">{item.kind}</span>
                  </button>
                ))}
              </div>
            ) : <p className="empty muted">No pictures yet. Make one, and she'll land here.</p>}
          </section>
        ) : null}

        {view === "edit" ? (
          <div className="grid">
            <div className="col">
              <section className="card">
                <div className="row between">
                  <h3>Editor</h3>
                  {sourceKind ? <span className={sourceKind === "character" ? "pill src character" : "pill src upload"}>{sourceKind === "character" ? "Character" : "Upload"}</span> : null}
                </div>
                {beforeUrl && resultUrl ? <Compare before={beforeUrl} after={resultUrl} /> : source ? (
                  <div className="stage">
                    <img ref={stageRef} src={source} alt="" />
                    {tool === "inpaint" ? (
                      <canvas ref={maskRef} className="mask" onPointerDown={paint} onPointerMove={paint} onPointerUp={paint} onPointerLeave={paint} />
                    ) : null}
                    {busy ? <div className="busyover">Working</div> : null}
                  </div>
                ) : <p className="empty muted">Add a picture, or start from a blank frame.</p>}
                <div className="toolrow" aria-label="Tools">
                  {TOOLS.map((item) => (
                    <button key={item.id} type="button" className={tool === item.id ? "btn on" : "btn"} aria-pressed={tool === item.id} onClick={() => setTool(item.id)}>
                      {item.label}
                    </button>
                  ))}
                </div>
                {tool === "expand" ? (
                  <div className="chiprow">
                    {(["left", "right", "up", "down"] as const).map((direction) => (
                      <button key={direction} className="chip" type="button" onClick={() => expand(direction)}>{direction}</button>
                    ))}
                  </div>
                ) : null}
                {tool === "upscale" ? (
                  <div className="chiprow">
                    <button type="button" className={scale === 2 ? "chip on" : "chip"} onClick={() => setScale(2)}>2x</button>
                    <button type="button" className={scale === 4 ? "chip on" : "chip"} onClick={() => setScale(4)}>4x</button>
                  </div>
                ) : null}
                <div className="refs">
                  <RefSlot label="Picture" image={source} onPick={(file) => pick("source", file)} onClear={() => { setSource(null); setMask(null); setSourceKind(null); }} />
                  <RefSlot label="Outfit" image={outfit} onPick={(file) => pick("outfit", file)} onClear={() => setOutfit(null)} />
                  <RefSlot label="Extra" image={extra} onPick={(file) => pick("extra", file)} onClear={() => setExtra(null)} />
                </div>
                <button className="btn wide" type="button" onClick={() => {
                  const frame = blankFrame();
                  if (!frame) return;
                  setSource(frame);
                  setSourceKind("upload");
                  setMask(null);
                  setParent("");
                }}>Blank frame</button>
                <div className="desk">
                  <button className="cta big" type="button" disabled={busy} onClick={primary}>{primaryLabel}</button>
                </div>
              </section>
            </div>
            <aside className="col side">
              <section className="card">
                <h3>Pose library</h3>
                <label>
                  Edit prompt
                  <textarea value={editPrompt} maxLength={2000} onChange={(event) => setEditPrompt(event.target.value)} placeholder="What should change?" />
                </label>
                <div className="posegrid">
                  {POSES.map((item) => (
                    <button key={item.id} type="button" className={pose === item.id ? "posecard on" : "posecard"} aria-pressed={pose === item.id} onClick={() => choosePose(item.id)}>
                      <span className="pnone">{item.emoji}</span>
                      <b>{item.label}</b>
                      <small>{item.keywords}</small>
                    </button>
                  ))}
                </div>
                {tool !== "upscale" && tool !== "restore" ? (
                  <label className="slider">
                    Strength {strength.toFixed(2)}
                    <input type="range" min={0.2} max={0.9} step={0.05} value={strength} onChange={(event) => setStrength(Number(event.target.value))} />
                  </label>
                ) : null}
                <label className="seed">
                  Seed
                  <input value={seed} inputMode="numeric" onChange={(event) => setSeed(event.target.value.replace(/[^\d]/g, ""))} placeholder="Random" />
                </label>
              </section>
              <Accordion title="Face lock and body" summary={face ? "Face locked" : "Optional"} open={open === "refs"} onToggle={() => setOpen(open === "refs" ? "" : "refs")}>
                <div className="row">
                  <label className={face ? "btn gate" : "btn"}>
                    Face lock
                    <input className="sr-only" type="file" accept="image/*" onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      readFile(file).then((image) => post({ action: "face-lock", image })).then((json) => {
                        setFace(Boolean(json.face));
                        const saved = asShot(json.image);
                        if (saved) prepend([saved]);
                      }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Couldn't save that."));
                    }} />
                  </label>
                  {face ? <button className="btn" type="button" onClick={() => post({ action: "face-clear" }).then(() => setFace(false)).catch(() => undefined)}>Clear face</button> : null}
                  <label className="btn">
                    Body scan
                    <input className="sr-only" type="file" accept="image/*" onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      readFile(file).then((image) => post({ action: "body-scan", image })).then((json) => {
                        setBody(Boolean(json.body));
                        setBodyNotes(typeof json.bodyNotes === "string" ? json.bodyNotes : "");
                        const saved = asShot(json.image);
                        if (saved) prepend([saved]);
                      }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Couldn't save that."));
                    }} />
                  </label>
                  {body ? <button className="btn" type="button" onClick={() => post({ action: "body-clear" }).then(() => { setBody(false); setBodyNotes(""); }).catch(() => undefined)}>Clear body</button> : null}
                </div>
                {bodyNotes ? <p className="muted small">{bodyNotes}</p> : null}
                <label className="check">
                  <input type="checkbox" checked={useBody} onChange={(event) => setUseBody(event.target.checked)} />
                  Use body scan
                </label>
              </Accordion>
              {tree.length ? (
                <section className="card">
                  <h3>Versions</h3>
                  <div className="tree">
                    {tree.map((item) => (
                      <button key={item.id} type="button" className={item.id === shot ? "tnode on" : "tnode"} onClick={() => { if (item.url) {
                        post({ action: "file", id: item.id }).then((json) => {
                          if (typeof json.dataUrl === "string") {
                            setSource(json.dataUrl);
                            setParent(item.id);
                          }
                        }).catch(() => undefined);
                      } }}>
                        {item.url ? <img src={item.url} alt="" /> : <span className="pnone">{item.status}</span>}
                        <span><b>{item.kind}</b><small className="muted">{item.prompt.slice(0, 80)}</small></span>
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}
            </aside>
          </div>
        ) : null}
      </div>

      {view === "gallery" ? (
        <div className="actionbar"><a className="cta grow" href="/attic">Create</a></div>
      ) : (
        <div className="actionbar">
          {view !== "characters" ? <button className="btn" type="button" disabled={busy || !(view === "edit" ? editPrompt : preview).trim()} onClick={enhance}>Enhance</button> : null}
          <button className="cta grow" type="button" disabled={busy || (view === "characters" && !selected)} onClick={primary}>{primaryLabel}</button>
        </div>
      )}

      <nav className="tabbar" aria-label="Lab">
        {TABS.map((tab) => (
          <a key={tab.view} className={view === tab.view ? "tab on" : "tab"} href={tab.href} aria-current={view === tab.view ? "page" : undefined}>
            <span className="ti">{tab.icon}</span>
            {tab.label}
          </a>
        ))}
      </nav>

      {sheet ? (
        <div className="sheetwrap" onClick={() => setSheet(false)}>
          <div className="sheet full" role="dialog" aria-modal="true" aria-label="Prompt" onClick={(event) => event.stopPropagation()}>
            <div className="sheethead"><span className="grab" /><b>Prompt</b><button className="iconbtn" type="button" onClick={() => setSheet(false)} aria-label="Close">×</button></div>
            <div className="sheetbody">
              <textarea className="bigta" value={preview} maxLength={1800} onChange={(event) => { setPrompt(event.target.value); setCustom(true); }} />
            </div>
            <div className="sheetfoot"><button className="cta big" type="button" onClick={() => setSheet(false)}>Use this</button></div>
          </div>
        </div>
      ) : null}

      {viewer ? (
        <Viewer
          items={viewer.items}
          index={viewer.index}
          folders={folders}
          onIndex={(index) => setViewer({ items: viewer.items, index })}
          onClose={() => setViewer(null)}
          onFavorite={(item) => {
            const on = !item.favorite;
            setImages((current) => current.map((row) => row.id === item.id ? { ...row, favorite: on } : row));
            setViewer((current) => current ? { ...current, items: current.items.map((row) => row.id === item.id ? { ...row, favorite: on } : row) } : current);
            post({ action: "favorite", id: item.id, on }).catch(() => undefined);
          }}
          onFolder={(item, folder) => {
            setImages((current) => current.map((row) => row.id === item.id ? { ...row, folder } : row));
            post({ action: "folder", id: item.id, name: folder }).catch(() => undefined);
          }}
        />
      ) : null}
    </div>
  );
}

function Accordion({ title, summary, open, onToggle, children }: { title: string; summary: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <section className="card acc">
      <button type="button" className="acchead" aria-expanded={open} onClick={onToggle}>
        <span className="acct">{title}</span>
        <span className="sum muted">{summary}</span>
        <span className="chev">{open ? "–" : "+"}</span>
      </button>
      {open ? <div className="accbody">{children}</div> : null}
    </section>
  );
}

function FineTune(props: {
  model: string;
  setModel: (value: string) => void;
  resolution: string;
  setResolution: (value: string) => void;
  steps: string;
  setSteps: (value: string) => void;
  cfg: string;
  setCfg: (value: string) => void;
  batch: number;
  setBatch: (value: number) => void;
  negative: string;
  setNegative: (value: string) => void;
  useBody: boolean;
  setUseBody: (value: boolean) => void;
}) {
  return (
    <>
      <div className="fine">
        <label>
          Model
          <select value={props.model} onChange={(event) => props.setModel(event.target.value)}>
            <option value="chroma">Chroma</option>
            <option value="zimage">Z-Image</option>
          </select>
        </label>
        <label>
          Size
          <select value={props.resolution} onChange={(event) => props.setResolution(event.target.value)}>
            <option value="standard">Standard</option>
            <option value="large">Large</option>
          </select>
        </label>
        <label>
          Steps
          <input value={props.steps} inputMode="numeric" onChange={(event) => props.setSteps(event.target.value.replace(/[^\d]/g, ""))} placeholder={props.model === "zimage" ? "8" : "28"} />
        </label>
        <label>
          CFG
          <input value={props.cfg} inputMode="decimal" onChange={(event) => props.setCfg(event.target.value.replace(/[^\d.]/g, ""))} placeholder={props.model === "zimage" ? "1" : "4"} />
        </label>
      </div>
      <label>
        Batch
        <select value={props.batch} onChange={(event) => props.setBatch(Number(event.target.value))}>
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
          <option value={4}>4</option>
        </select>
      </label>
      <label>
        Negative
        <textarea value={props.negative} maxLength={800} onChange={(event) => props.setNegative(event.target.value)} placeholder="What to leave out" />
      </label>
      <label className="check">
        <input type="checkbox" checked={props.useBody} onChange={(event) => props.setUseBody(event.target.checked)} />
        Use body scan
      </label>
    </>
  );
}

function RefSlot({ label, image, onPick, onClear }: { label: string; image: string | null; onPick: (file: File | undefined) => void; onClear: () => void }) {
  if (!image) {
    return (
      <label className="refslot add">
        +<small>{label}</small>
        <input className="sr-only" type="file" accept="image/*" aria-label={label} onChange={(event) => onPick(event.target.files?.[0])} />
      </label>
    );
  }
  return (
    <div className="refslot">
      <img src={image} alt="" />
      <button className="x" type="button" aria-label={`Clear ${label}`} onClick={onClear}>×</button>
    </div>
  );
}

function Compare({ before, after }: { before: string; after: string }) {
  const [at, setAt] = useState(52);
  const drag = useRef(false);
  function move(event: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current && event.type !== "pointerdown") return;
    const rect = event.currentTarget.getBoundingClientRect();
    setAt(Math.max(2, Math.min(98, ((event.clientX - rect.left) / rect.width) * 100)));
  }
  return (
    <div
      className="cmp"
      onPointerDown={(event) => {
        drag.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        move(event);
      }}
      onPointerMove={move}
      onPointerUp={() => { drag.current = false; }}
    >
      <img src={before} alt="Before" />
      <div className="cmpb" style={{ clipPath: `inset(0 ${100 - at}% 0 0)` }}>
        <img src={after} alt="After" />
      </div>
      <div className="cmpline" style={{ left: `${at}%` }}><span>↔</span></div>
      <span className="cmplab l">Before</span>
      <span className="cmplab r">After</span>
    </div>
  );
}

function Viewer({ items, index, folders, onIndex, onClose, onFavorite, onFolder }: { items: Shot[]; index: number; folders: string[]; onIndex: (index: number) => void; onClose: () => void; onFavorite: (item: Shot) => void; onFolder: (item: Shot, folder: string) => void }) {
  const item = items[index];
  if (!item) return null;
  return (
    <div className="viewer" role="dialog" aria-modal="true" aria-label="Picture">
      <div className="vtop">
        <button className="iconbtn" type="button" onClick={onClose} aria-label="Close">×</button>
        <span className="muted small">{index + 1} / {items.length}</span>
      </div>
      <div className="vstage">
        {index > 0 ? <button className="vnav l" type="button" aria-label="Previous" onClick={() => onIndex(index - 1)}>‹</button> : null}
        {item.url ? <img src={item.url} alt="" /> : <p>{item.status}</p>}
        {index < items.length - 1 ? <button className="vnav r" type="button" aria-label="Next" onClick={() => onIndex(index + 1)}>›</button> : null}
      </div>
      <p className="vcap">{item.prompt.slice(0, 180)}</p>
      <div className="vactions">
        <button className="vbtn" type="button" onClick={() => onFavorite(item)}><span>★</span>{item.favorite ? "Starred" : "Star"}</button>
        <a className="vbtn" href={`/edit?shot=${item.id}`}><span>✎</span>Edit</a>
        {item.url ? <a className="vbtn" href={item.url} download><span>↓</span>Save</a> : null}
      </div>
      {folders.length ? (
        <label className="vcap">
          Folder
          <select aria-label="Picture folder" value={item.folder ?? ""} onChange={(event) => onFolder(item, event.target.value)}>
            <option value="">No folder</option>
            {folders.map((folder) => <option key={folder} value={folder}>{folder}</option>)}
          </select>
        </label>
      ) : null}
    </div>
  );
}
