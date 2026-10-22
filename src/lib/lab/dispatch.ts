import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { minorReason as denAge } from "@/lib/attic/safety";
import { downloadObject, imageById, insertImage, storageConfigured, uploadObject } from "@/lib/attic/store";
import { ensureAdult } from "./adult";
import { isExplicitEdit } from "./explicit";
import { minorReason as labAge, STYLES } from "./options";
import poses from "./poses.json";
import { parseDataUrl, readTicket, signImage, signTicket, verifyImage, weakest } from "./sign";
import { pickLoras, withTriggers } from "./loras";
import { addPose, BUILDERS, qwenEdit } from "./workflows";

const POSES = poses as { id: string; hint: string }[];

type Reply = { status: number; json: Record<string, unknown> };

function reply(status: number, json: Record<string, unknown>): Reply {
  return { status, json };
}

function blocked(text: string) {
  const why = labAge(text);
  if (why) return `Blocked (adults only): ${why}`;
  if (denAge(text)) return "Adults only.";
  return null;
}

function endpoint() {
  const id = process.env.RUNPOD_ENDPOINT_ID?.trim();
  if (!id || !process.env.RUNPOD_API_KEY?.trim()) {
    const error = new Error("Picture machine isn't set up yet.") as Error & { status?: number };
    error.status = 503;
    throw error;
  }
  return id;
}

async function submit(input: Record<string, unknown>) {
  const response = await fetch(`https://api.runpod.ai/v2/${endpoint()}/run`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RUNPOD_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ input }),
  });
  const body = (await response.json().catch(() => ({}))) as { id?: string };
  if (!response.ok || !body.id) {
    const error = new Error("Runpod error") as Error & { detail?: unknown };
    error.detail = body;
    throw error;
  }
  return body.id;
}

function fail(error: unknown, status = 502): Reply {
  const err = error as { message?: string; detail?: unknown; status?: number };
  return reply(err.status || status, { error: err.message || "Couldn't do that.", detail: err.detail });
}

async function keep(opts: {
  bytes: Buffer;
  kind: string;
  prompt: string;
  engine: string;
  style: string;
  seed: number | null;
  w: number | null;
  h: number | null;
  strength: number | null;
  runpodId: string | null;
  parentId: string | null;
  src: string;
}) {
  if (!storageConfigured()) return null;
  const path = `lab/${randomUUID()}.jpg`;
  await uploadObject(path, "image/jpeg", new Uint8Array(opts.bytes));
  const parent = opts.parentId && /^[0-9a-f-]{36}$/i.test(opts.parentId) ? opts.parentId : null;
  const row = await insertImage({
    kind: opts.kind,
    prompt: opts.prompt.slice(0, 4000),
    negative: "",
    model: opts.engine,
    style: opts.style,
    seed: opts.seed,
    width: opts.w,
    height: opts.h,
    strength: opts.strength,
    favorite: false,
    storage_path: path,
    status: "done",
    runpod_id: opts.runpodId,
    parent_id: parent,
    src: opts.src === "upload" ? "upload" : "lab",
  });
  const full = await imageById(row.id);
  return { id: row.id, url: full?.url ?? null };
}

const SYS: Record<string, string> = {
  zimage:
    "Write ONE rich natural-language image prompt (60-140 words) in flowing descriptive sentences for a photoreal/stylized diffusion model with a strong text encoder. Lead with the art style, then subject, appearance, outfit, pose, expression, setting, camera and lighting.",
  chroma:
    "Write ONE rich, highly detailed natural-language image prompt (80-160 words) for Chroma (Flux-family, T5 encoder). Lead with the art style; be concrete about materials, lighting and composition.",
  illustrious:
    "Write ONE comma-separated Danbooru-style tag prompt (30-60 tags) for the Illustrious-XL anime model. Start with '1girl, solo, adult woman, mature' (or '1boy, solo, adult man, mature'). No sentences.",
};

async function enhance(body: Record<string, unknown>): Promise<Reply> {
  const prompt = String(body.prompt || "");
  const why = blocked(prompt);
  if (why) return reply(400, { error: why.startsWith("Blocked") ? `Blocked (adults only): your prompt ${labAge(prompt)}` : why });
  const mode = body.mode === "edit" ? "edit" : "generate";
  const engine = String(body.engine || "zimage");
  const styleLabel = String(body.styleLabel || "photoreal");
  const editSys =
    'You rewrite IMAGE-EDIT instructions for Qwen-Image-Edit (an instruction-following editor that sees the input image). Turn the user\'s rough request into ONE clear, specific edit instruction of 25-70 words in imperative voice: say exactly what to change (garment, material, color, pose, background, lighting, retouch) and explicitly list what must stay identical (face, identity, hair, body, pose, background) unless the user wants those changed. Refer to inputs as "image 1" (the photo being edited) and "image 2"/"image 3" (references) when relevant. Every person is an adult 21+. Do not add nudity or sexual content unless the user\'s request explicitly asks for it. Only if the request involves a minor, reply exactly "REFUSED: <reason>". Output only the instruction.';
  const genSys = `You are the prompt engineer for a private adult character-art tool used by its adult owner. CONTEXT: every character is a fictional, consenting adult aged 21 or older — always. Words like petite, small, slim, short, shy, sweet, cute, girl, girlfriend, innocent-looking, youthful skin or "young adult" describe ADULT women here and are fine; keep them, and phrase the subject as an adult woman (21+). Adult, sensual and suggestive language is allowed; explicit content is allowed when the input asks for it. Never add ages under 21, school settings or childlike traits. Only if the input explicitly describes a minor (a stated age under 18 or a child), reply with exactly "REFUSED: <short reason>". Otherwise never refuse — just write the prompt. Keep every user-selected attribute. Always include the phrase "adult woman, 21+" (or "adult man, 21+") naturally in the prompt. ${SYS[engine] || SYS.zimage} Art style: ${styleLabel}. Output only the prompt text: no preamble, quotes, notes, commentary, parenthetical explanations or Midjourney-style flags.`;
  const temperature = mode === "edit" ? 0.5 : 0.8;
  const user = mode === "edit" ? prompt.slice(0, 2000) : `Rewrite this into one prompt (all characters are consenting adults 21+):\n\n${prompt}`;
  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.XAI_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: process.env.XAI_MODEL || "grok-4.20-0309-non-reasoning",
      temperature,
      messages: [
        { role: "system", content: mode === "edit" ? editSys : genSys },
        { role: "user", content: user },
      ],
    }),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    choices?: { message?: { content?: string } }[];
    error?: { message?: string };
  };
  let out = payload.choices?.[0]?.message?.content?.trim();
  if (!response.ok || !out) {
    return reply(502, { error: `Grok API error (${response.status})` });
  }
  if (/^REFUSED/i.test(out)) {
    return reply(422, { error: `Grok declined: ${out.replace(/^REFUSED:?\s*/i, "") || "no reason given"}` });
  }
  if (mode === "edit") {
    out = out.replace(/^["'`]+|["'`]+$/g, "").trim();
  } else {
    out = out
      .replace(/<\|[^|>]*\|>/g, "")
      .replace(/\s--[a-z]+(\s+[\w.:]+)?/gi, "")
      .replace(/\s*\((?:[^()]*\b(?:framing|phrasing|required|mandatory|note|as requested|per instructions)\b[^()]*)\)\s*$/i, "")
      .replace(/^["'`]+|["'`]+$/g, "")
      .trim();
  }
  const again = blocked(out);
  if (again) return reply(422, { error: mode === "edit" ? "Blocked (adults only)" : `Blocked (adults only): Grok's rewrite ${labAge(out) || again}. Try again.` });
  return reply(200, { prompt: mode === "edit" ? out : ensureAdult(out, engine) });
}

async function generate(body: Record<string, unknown>): Promise<Reply> {
  let prompt = String(body.prompt || "").slice(0, 4000);
  if (!prompt.trim()) return reply(400, { error: "Empty prompt" });
  const why = blocked(prompt);
  if (why) return reply(400, { error: why });
  const style = STYLES.find((item: { id: string }) => item.id === body.style) || STYLES[0];
  const builders = BUILDERS as Record<string, (prompt: string, opts: { seed: number; w: number; h: number; steps?: number }) => Record<string, unknown>>;
  const engine = builders[String(body.engine || "")] ? String(body.engine) : style.engine;
  const base =
    Number.isFinite(Number(body.seed)) && body.seed !== "" && body.seed != null
      ? Number(body.seed)
      : Math.floor(Math.random() * 2 ** 31);
  const w = [832, 1024, 1216].includes(Number(body.w)) ? Number(body.w) : 832;
  const h = [832, 1024, 1216].includes(Number(body.h)) ? Number(body.h) : 1216;
  prompt = ensureAdult(prompt, engine);
  const adultWhy = blocked(prompt);
  if (adultWhy) return reply(400, { error: adultWhy });
  const count = Math.max(1, Math.min(4, Number(body.n) || 1));
  const pose = body.pose && typeof body.pose === "object" ? (body.pose as { data?: string; strength?: number }) : null;
  if (pose?.data && engine !== "zimage") {
    return reply(400, { error: "Poses only work with photo styles." });
  }
  const poseMatch = pose?.data ? /^data:image\/png;base64,(.+)$/.exec(pose.data) : null;
  if (pose?.data && !poseMatch) return reply(400, { error: "Pose skeleton must be a PNG" });
  const jobs = [];
  for (let i = 0; i < count; i += 1) {
    const seed = (base + i * 7919) % 2 ** 31;
    const opts: { seed: number; w: number; h: number; steps?: number } = { seed, w, h };
    if (Number(body.steps) > 0 && Number(body.steps) <= 50) opts.steps = Number(body.steps);
    const workflow = builders[engine](prompt, opts);
    const input: { workflow: unknown; images?: { name: string; image: string }[] } = { workflow, images: [] };
    if (poseMatch) {
      addPose(workflow, { strength: Math.max(0.1, Math.min(1, Number(pose?.strength) || 0.8)) });
      input.images?.push({ name: "pose.png", image: poseMatch[1] });
    }
    if (!input.images?.length) delete input.images;
    const id = await submit(input);
    jobs.push({
      id,
      seed,
      engine,
      t: signTicket({ id, src: "lab", kind: "gen", prompt, seed, engine, style: style.id, w, h, strength: null, parentId: null }),
    });
  }
  return reply(200, { jobs, engine, seed: base });
}

const ADULT = " Everyone shown is an adult (21+).";
const PRESETS: Record<string, string> = {
  bg: "Replace the background with: {x}. Keep the person (face, hair, body, pose, outfit) exactly the same and match the lighting to the new scene.",
  face: "Fix and refine the face: natural, symmetrical, sharp eyes, clean detailed skin. Keep her identity, expression, hair, outfit, pose and background unchanged.",
  hands: "Fix the hands: anatomically correct hands with five well-formed fingers each. Keep everything else in the image unchanged.",
  touch: "Subtle retouch: improve sharpness, skin texture and lighting while keeping everything else identical.",
};

async function resolveRef(ref: unknown): Promise<{ buf: Buffer; src: string }> {
  const record = ref && typeof ref === "object" ? (ref as { id?: string; data?: string; tag?: string }) : {};
  if (record.id && /^[0-9a-f-]{36}$/i.test(record.id)) {
    const image = await imageById(record.id);
    if (!image?.storagePath) throw new Error("Picture isn't here");
    const file = await downloadObject(image.storagePath);
    if (!file) throw new Error("Picture isn't here");
    const src = image.src === "upload" || image.kind === "upload" ? "upload" : "lab";
    return { buf: Buffer.from(file.bytes), src };
  }
  const parsed = parseDataUrl(record.data);
  if (!parsed) throw new Error("Bad image");
  if (parsed.buf.length > 6e6) throw new Error("Image too large");
  return { buf: parsed.buf, src: verifyImage(parsed.buf, record.tag) };
}

async function edit(body: Record<string, unknown>): Promise<Reply> {
  let instr = String(body.instr || "").slice(0, 2000).trim();
  const preset = String(body.preset || "");
  if (preset && PRESETS[preset]) {
    instr = PRESETS[preset].replace("{x}", instr || "a moody neon-lit city street at night") + (preset !== "bg" && instr ? ` ${instr}` : "");
  }
  const refsIn = (Array.isArray(body.refs) ? body.refs : []).slice(0, 3);
  const poseId = body.pose && typeof body.pose === "object" ? String((body.pose as { id?: string }).id || "") : "";
  const pose = poseId ? POSES.find((item) => item.id === poseId) : null;
  const poseData = body.pose && typeof body.pose === "object" ? String((body.pose as { data?: string }).data || "") : "";
  if (!instr && !refsIn.length && !pose && !poseData) return reply(400, { error: "Describe the edit, add a reference outfit, or pick a pose." });
  const why = blocked(instr);
  if (why) return reply(400, { error: `Blocked (adults only): instruction ${labAge(instr) || why}` });
  let subject: { buf: Buffer; src: string };
  let refs: { buf: Buffer; src: string }[];
  try {
    subject = await resolveRef(body.subject);
    refs = await Promise.all(refsIn.map((item) => resolveRef(item)));
  } catch (error) {
    return reply(400, { error: error instanceof Error ? error.message : "Bad image" });
  }
  const src = weakest([subject.src, ...refs.map((item) => item.src)]);
  let explicit = false;
  try {
    explicit = (await isExplicitEdit(instr)).explicit;
  } catch {
    explicit = false;
  }
  const images: { name: string; image: string }[] = [];
  const meta = await sharp(subject.buf).metadata();
  let subjectOut = await sharp(subject.buf).rotate().png().toBuffer();
  if (subjectOut.length > 3.5e6) {
    subjectOut = await sharp(subject.buf).rotate().jpeg({ quality: 97, chromaSubsampling: "4:4:4" }).toBuffer();
  }
  images.push({ name: "subject.png", image: subjectOut.toString("base64") });
  let refsCollage = false;
  if (refs.length) {
    const height = 768;
    const parts = await Promise.all(refs.map((item) => sharp(item.buf).rotate().resize({ height }).png().toBuffer({ resolveWithObject: true })));
    const width = parts.reduce((sum, part) => sum + part.info.width, 0);
    let left = 0;
    const collage = await sharp({ create: { width, height, channels: 3, background: "#000" } })
      .composite(parts.map((part) => {
        const layer = { input: part.data, left, top: 0 };
        left += part.info.width;
        return layer;
      }))
      .jpeg({ quality: 93 })
      .toBuffer();
    images.push({ name: "refs.png", image: collage.toString("base64") });
    refsCollage = true;
  }
  const posed = Boolean(poseData);
  if (posed) {
    const parsed = parseDataUrl(poseData);
    if (!parsed) return reply(400, { error: "Pose skeleton missing" });
    images.push({ name: "pose.png", image: parsed.buf.toString("base64") });
  }
  if (body.mask) {
    const mask = parseDataUrl(body.mask);
    if (!mask) return reply(400, { error: "Bad mask" });
    const fitted = await sharp(mask.buf).resize(meta.width, meta.height, { fit: "fill" }).png().toBuffer();
    images.push({ name: "mask.png", image: fitted.toString("base64") });
  }
  const index = 1 + (refs.length ? 1 : 0);
  const parts: string[] = [];
  if (refs.length) {
    parts.push(
      `Dress the woman in image 1 in the outfit shown in image 2${refs.length > 1 ? ` (image 2 is a collage of ${refs.length} outfit references; combine the garments shown)` : ""}. Keep her face, hair, skin tone and body exactly the same as image 1; ignore the faces and bodies of anyone in image 2.`,
    );
  }
  if (posed) {
    // Lab pose input is an OpenPose skeleton (photos are rejected client-side). Tested 2026-10-22: AnyPose README
    // person-to-person framing ignores skeletons, so keep the skeleton instruction and add AnyPose's accuracy lines.
    const p = index + 1;
    parts.push(
      `Change her pose so her body matches the OpenPose stick-figure skeleton in image ${p}${pose?.hint ? `: ${pose.hint}` : ""}. The position of the arms, head and legs should be the same as the pose we are trying to copy. Keep her face, hair, outfit and body proportions identical to image 1 and keep the background of image 1. Do not draw the skeleton.`,
    );
  }
  if (instr) parts.push(instr);
  if (body.mask) parts.push("Only change the masked area; keep the rest identical.");
  const loras = pickLoras(instr, { refs: refsCollage, explicit, pose: posed });
  const text = withTriggers(`${parts.join(" ")}${ADULT}`, loras);
  const textWhy = blocked(text);
  if (textWhy) return reply(400, { error: textWhy });
  const strength = Math.max(0.3, Math.min(1, Number(body.strength) || 1));
  const count = Math.max(1, Math.min(4, Number(body.n) || 1));
  const base =
    Number.isFinite(Number(body.seed)) && body.seed !== "" && body.seed != null
      ? Number(body.seed)
      : Math.floor(Math.random() * 2 ** 31);
  const total = images.reduce((sum, image) => sum + image.image.length, 0);
  if (total > 9e6) return reply(413, { error: `Images too large for the GPU worker (${(total / 1048576).toFixed(1)} MB). Use a smaller picture or fewer outfit refs.` });
  const parentId = typeof body.parentId === "string" ? body.parentId : null;
  const jobs = [];
  for (let i = 0; i < count; i += 1) {
    const seed = (base + i * 7919) % 2 ** 31;
    const workflow = qwenEdit({
      instr: text,
      seed,
      denoise: strength,
      refs: refsCollage,
      pose: posed,
      mask: Boolean(body.mask),
      loras,
    });
    const id = await submit({ workflow, images });
    jobs.push({
      id,
      seed,
      t: signTicket({
        id,
        src,
        kind: "edit",
        prompt: text,
        seed,
        engine: "qwen-edit",
        style: "edit",
        w: meta.width || null,
        h: meta.height || null,
        strength,
        parentId,
        loras: loras.map((lora) => ({ id: lora.id, file: lora.file, strength: lora.strength })),
      }),
    });
  }
  return reply(200, { jobs, src, explicit, instruction: text, loras: loras.map((lora) => lora.id) });
}

async function status(body: Record<string, unknown>): Promise<Reply> {
  const ticket = readTicket(body.t);
  const id = String(ticket?.id || "");
  if (!/^[\w-]+$/.test(id)) return reply(400, { error: "bad id" });
  const response = await fetch(`https://api.runpod.ai/v2/${endpoint()}/status/${id}`, {
    headers: { Authorization: `Bearer ${process.env.RUNPOD_API_KEY}` },
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => ({}))) as {
    status?: string;
    output?: { images?: { data?: string }[] };
    error?: unknown;
    delayTime?: number;
    executionTime?: number;
  };
  if (payload.status === "COMPLETED") {
    const images = payload.output?.images || [];
    const image = images[images.length - 1];
    if (!image?.data) return reply(200, { status: "FAILED", error: "No image in output" });
    const jpg = await sharp(Buffer.from(image.data, "base64")).jpeg({ quality: 93, chromaSubsampling: "4:4:4" }).toBuffer();
    const src = String(ticket?.src || "lab");
    const saved = await keep({
      bytes: jpg,
      kind: String(ticket?.kind || "gen"),
      prompt: String(ticket?.prompt || ""),
      engine: String(ticket?.engine || ""),
      style: String(ticket?.style || ""),
      seed: Number.isFinite(Number(ticket?.seed)) ? Number(ticket?.seed) : null,
      w: Number.isFinite(Number(ticket?.w)) ? Number(ticket?.w) : null,
      h: Number.isFinite(Number(ticket?.h)) ? Number(ticket?.h) : null,
      strength: Number.isFinite(Number(ticket?.strength)) ? Number(ticket?.strength) : null,
      runpodId: id,
      parentId: typeof ticket?.parentId === "string" ? ticket.parentId : null,
      src,
    }).catch(() => null);
    return reply(200, {
      status: "COMPLETED",
      image: `data:image/jpeg;base64,${jpg.toString("base64")}`,
      tag: signImage(jpg, src),
      galleryId: saved?.id ?? null,
      url: saved?.url ?? null,
      seed: ticket?.seed ?? null,
      delayMs: payload.delayTime,
      execMs: payload.executionTime,
    });
  }
  if (payload.status === "FAILED" || payload.status === "CANCELLED" || payload.status === "TIMED_OUT") {
    return reply(200, { status: payload.status, error: typeof payload.error === "string" ? payload.error.slice(0, 400) : "Job failed" });
  }
  return reply(200, { status: payload.status || "UNKNOWN" });
}

async function upscale(body: Record<string, unknown>): Promise<Reply> {
  let image: { buf: Buffer; src: string };
  try {
    image = await resolveRef(body.image);
  } catch (error) {
    return reply(400, { error: error instanceof Error ? error.message : "Bad image" });
  }
  const meta = await sharp(image.buf).metadata();
  const width = meta.width || 1;
  const height = meta.height || 1;
  const scale = Math.min(2, 2560 / Math.max(width, height));
  const out = await sharp(image.buf)
    .rotate()
    .resize(Math.round(width * scale), Math.round(height * scale), { kernel: "lanczos3" })
    .sharpen({ sigma: 1.1 })
    .jpeg({ quality: 92, chromaSubsampling: "4:4:4" })
    .toBuffer();
  if (out.length > 4.2e6) return reply(413, { error: "Result too large" });
  const saved = await keep({
    bytes: out,
    kind: "upscale",
    prompt: "Upscale 2×",
    engine: "lanczos",
    style: "upscale",
    seed: null,
    w: Math.round(width * scale),
    h: Math.round(height * scale),
    strength: null,
    runpodId: null,
    parentId: typeof body.parentId === "string" ? body.parentId : null,
    src: image.src,
  }).catch(() => null);
  return reply(200, {
    image: `data:image/jpeg;base64,${out.toString("base64")}`,
    tag: signImage(out, image.src),
    w: Math.round(width * scale),
    h: Math.round(height * scale),
    galleryId: saved?.id ?? null,
    url: saved?.url ?? null,
  });
}

export async function labDispatch(body: Record<string, unknown> | null): Promise<Reply> {
  const action = String(body?.action || "");
  try {
    if (action === "enhance") return await enhance(body || {});
    if (action === "generate") return await generate(body || {});
    if (action === "edit") return await edit(body || {});
    if (action === "status") return await status(body || {});
    if (action === "upscale") return await upscale(body || {});
    return reply(400, { error: "Unknown action." });
  } catch (error) {
    return fail(error);
  }
}
