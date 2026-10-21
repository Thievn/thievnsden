import { createHash } from "node:crypto";
import { describeBody, enhancePrompt, grokConfigured, readFace } from "./grok";
import { parseDataUrl, toBase64, toDataUrl } from "./images";
import { clampBatch, clampCfg, clampSeed, clampSteps, clampStrength, pixelSize, styleById, type ModelId } from "./options";
import { bytesFromRunpodOutput, publicImageError, readRunpod, runpodConfigured, submitWorkflow } from "./runpod";
import { AGE_BLOCK, composePositive, decideFace, isExplicit, minorReason } from "./safety";
import {
  createFolder,
  downloadObject,
  findUpload,
  imageById,
  imagesByIds,
  insertImage,
  isAtticResult,
  listFolders,
  listImages,
  loadProfile,
  publicStoreError,
  saveProfile,
  storageConfigured,
  updateImage,
  uploadObject,
  type AtticImage,
} from "./store";
import { chromaGraph, qwenEditGraph, zimageGraph } from "./workflows";

type Reply = { status: number; json: Record<string, unknown> };

function reply(status: number, json: Record<string, unknown>): Reply {
  return { status, json };
}

function str(value: unknown, max: number) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function present(image: AtticImage) {
  return {
    id: image.id,
    createdAt: image.createdAt,
    kind: image.kind,
    prompt: image.prompt,
    negative: image.negative,
    model: image.model,
    style: image.style,
    seed: image.seed,
    steps: image.steps,
    cfg: image.cfg,
    width: image.width,
    height: image.height,
    strength: image.strength,
    favorite: image.favorite,
    folder: image.folder,
    status: image.status,
    error: image.error,
    url: image.url,
  };
}

/** Runs only while making a picture. Saving an upload does not call this. */
async function checkGenerationFace(dataUrl: string, lockUrl: string | null, explicit: boolean) {
  const report = await readFace(dataUrl, lockUrl);
  return { report, decision: decideFace(report, explicit) };
}

async function rememberUpload(image: { mime: string; bytes: Uint8Array }): Promise<AtticImage | null> {
  if (!storageConfigured()) return null;
  const digest = createHash("sha256").update(image.bytes).digest("hex");
  const existing = await findUpload(digest);
  if (existing) return existing;
  const row = await insertImage({
    kind: "upload",
    prompt: "",
    negative: "",
    status: "done",
    upload_sha: digest,
  });
  const ext = image.mime === "image/png" ? "png" : image.mime === "image/webp" ? "webp" : "jpg";
  const path = `uploads/${row.id}.${ext}`;
  await uploadObject(path, image.mime, image.bytes);
  await updateImage(row.id, { storage_path: path, status: "done" });
  return imageById(row.id);
}

async function rememberUploads(images: Array<{ mime: string; bytes: Uint8Array } | null>) {
  const saved: AtticImage[] = [];
  for (const image of images) {
    if (!image) continue;
    const row = await rememberUpload(image);
    if (row && !saved.some((item) => item.id === row.id)) saved.push(row);
  }
  return saved;
}

async function lockDataUrl(): Promise<{ hasLock: boolean; url: string | null }> {
  const profile = await loadProfile();
  if (!profile.facePath) return { hasLock: false, url: null };
  const file = await downloadObject(profile.facePath);
  if (!file) return { hasLock: true, url: null };
  return { hasLock: true, url: toDataUrl(file.mime, file.bytes) };
}

export async function handleLab(body: Record<string, unknown> | null): Promise<Reply> {
  const action = str(body?.action, 40);
  try {
    if (action === "state") return await state();
    if (action === "enhance") return await enhance(body);
    if (action === "generate" || action === "edit") return await make(body, action);
    if (action === "poll") return await poll(body);
    if (action === "save") return await saveUpload(body);
    if (action === "face-lock") return await faceLock(body);
    if (action === "face-clear") return await clearFace();
    if (action === "body-scan") return await bodyScan(body);
    if (action === "body-clear") return await clearBody();
    if (action === "favorite") return await favorite(body);
    if (action === "folder") return await folder(body);
    if (action === "file") return await file(body);
    return reply(400, { error: "Unknown action." });
  } catch (error) {
    return reply(500, { error: publicStoreError(error) });
  }
}

async function state(): Promise<Reply> {
  if (!storageConfigured()) {
    return reply(200, {
      face: false,
      body: false,
      bodyNotes: "",
      folders: [],
      images: [],
      runpod: runpodConfigured(),
      grok: grokConfigured(),
      storage: false,
    });
  }
  const [profile, folders, images] = await Promise.all([loadProfile(), listFolders(), listImages()]);
  return reply(200, {
    face: Boolean(profile.facePath),
    body: Boolean(profile.bodyPath),
    bodyNotes: profile.bodyNotes,
    folders,
    images: images.map(present),
    runpod: runpodConfigured(),
    grok: grokConfigured(),
    storage: true,
  });
}

async function enhance(body: Record<string, unknown> | null): Promise<Reply> {
  const prompt = str(body?.prompt, 2000);
  if (minorReason(prompt)) return reply(400, { error: AGE_BLOCK });
  if (!grokConfigured()) return reply(200, { prompt, kept: true, notice: "Enhance is offline. Kept your words." });
  const next = await enhancePrompt(prompt);
  if (minorReason(next.prompt)) return reply(200, { prompt, kept: true, notice: "Kept your words." });
  return reply(200, {
    prompt: next.prompt,
    kept: next.kept,
    notice: next.kept ? "Kept your words." : "Polished.",
  });
}

async function make(body: Record<string, unknown> | null, action: "generate" | "edit"): Promise<Reply> {
  const prompt = str(body?.prompt, 2000);
  const negative = str(body?.negative, 800);
  if (action === "edit") return edit(body, prompt, negative);

  if (!prompt) return reply(400, { error: "Write a prompt first." });
  if (minorReason(prompt) || minorReason(negative)) return reply(400, { error: AGE_BLOCK });
  if (!runpodConfigured()) return reply(503, { error: publicImageError("IMAGE_NOT_CONFIGURED") });
  if (!storageConfigured()) return reply(503, { error: "History isn't set up yet." });

  const style = styleById(str(body?.style, 40));
  const model: ModelId = body?.model === "zimage" ? "zimage" : "chroma";
  const size = pixelSize(str(body?.ratio, 40), str(body?.resolution, 20));
  const steps = clampSteps(model, body?.steps);
  const cfg = clampCfg(model, body?.cfg);
  const batch = clampBatch(body?.batch);
  const seed = clampSeed(body?.seed);

  let userPrompt = prompt;
  if (body?.useBody === true) {
    const profile = await loadProfile();
    if (profile.bodyNotes && !minorReason(profile.bodyNotes)) {
      userPrompt = `${userPrompt} Build: ${profile.bodyNotes}`;
    }
  }

  const positive = composePositive(userPrompt, style.text, true);
  const jobs = [];
  for (let index = 0; index < batch; index += 1) {
    const itemSeed = seed + index;
    const row = await insertImage({
      kind: "generate",
      prompt,
      negative,
      model,
      style: style.id,
      seed: itemSeed,
      steps,
      cfg,
      width: size.w,
      height: size.h,
      status: "queued",
    });
    try {
      const graph =
        model === "zimage"
          ? zimageGraph(positive, negative, { seed: itemSeed, steps, cfg, ...size })
          : chromaGraph(positive, negative, { seed: itemSeed, steps, cfg, ...size });
      const runpodId = await submitWorkflow(graph, []);
      await updateImage(row.id, { runpod_id: runpodId, status: "running" });
      jobs.push({ id: row.id, status: "running", seed: itemSeed });
    } catch (error) {
      const code = error instanceof Error ? error.message : "IMAGE_FAILED";
      await updateImage(row.id, { status: "failed", error: publicImageError(code) });
      jobs.push({ id: row.id, status: "failed", seed: itemSeed });
    }
  }
  return reply(200, { jobs, prompt });
}

async function edit(body: Record<string, unknown> | null, prompt: string, negative: string): Promise<Reply> {
  const subject = parseDataUrl(body?.image);
  const outfit = parseDataUrl(body?.outfit);
  const extra = parseDataUrl(body?.extra);
  const mask = parseDataUrl(body?.mask);
  const saved = (await rememberUploads([subject, outfit, extra])).map(present);
  const blocked = (status: number, error: string) => reply(status, { error, images: saved });
  const tool = str(body?.tool, 20) || "img2img";
  const scale = Number(body?.scale) === 4 ? 4 : 2;
  const strength = clampStrength(body?.strength);
  const seed = clampSeed(body?.seed);
  const style = styleById(str(body?.style, 40));
  const size = pixelSize(str(body?.ratio, 40), str(body?.resolution, 20));

  if (!subject) return blocked(400, "Add a picture first.");
  if ((tool === "inpaint" || tool === "expand") && !mask) return blocked(400, "Paint the area to change.");
  if (tool === "outfit" && !outfit) return blocked(400, "Add an outfit picture.");
  if (!prompt) return blocked(400, "Write a prompt first.");
  if (minorReason(prompt) || minorReason(negative)) return blocked(400, AGE_BLOCK);
  if (!runpodConfigured()) return blocked(503, publicImageError("IMAGE_NOT_CONFIGURED"));
  if (!storageConfigured()) return blocked(503, "History isn't set up yet.");

  let userPrompt = prompt;
  if (body?.useBody === true) {
    const profile = await loadProfile();
    if (profile.bodyNotes && !minorReason(profile.bodyNotes)) {
      userPrompt = `${userPrompt} Build: ${profile.bodyNotes}`;
    }
  }

  const lock = await lockDataUrl();
  if (lock.hasLock && !lock.url) return blocked(503, "Face check is unavailable.");
  const uploads = [subject, outfit, extra].filter((item): item is { mime: string; bytes: Uint8Array } => Boolean(item));
  const explicit = isExplicit(userPrompt);
  let keepFace = false;
  for (const upload of uploads) {
    const digest = createHash("sha256").update(upload.bytes).digest("hex");
    if (await isAtticResult(digest)) continue;
    const screened = await checkGenerationFace(toDataUrl(upload.mime, upload.bytes), lock.url, explicit);
    if (!screened.decision.ok) return blocked(400, screened.decision.error);
    if (screened.report?.realFace) keepFace = true;
  }

  const positive = composePositive(userPrompt, style.text, !keepFace);
  const denoise = tool === "restore" ? 0.4 : tool === "upscale" ? 0.3 : strength;
  const editPrompt =
    tool === "restore"
      ? `Restore the face: natural adult features. Keep identity, clothing, pose, and background. ${positive}`
      : tool === "upscale"
        ? `Add fine detail and sharpness. Keep the same person, pose, and framing. ${positive}`
        : tool === "outfit"
          ? `Change the outfit to match the clothing reference. Keep the face identical. ${positive}`
          : positive;
  const graph = qwenEditGraph(editPrompt, negative, {
    seed,
    denoise,
    lock: tool === "inpaint" || tool === "restore" || tool === "outfit",
    images: {
      outfit: Boolean(outfit),
      extra: Boolean(extra),
      mask: Boolean(mask),
      scale: tool === "upscale" ? scale : undefined,
    },
  });
  const images = [{ name: "subject.png", image: toBase64(subject.bytes) }];
  if (outfit) images.push({ name: "outfit.png", image: toBase64(outfit.bytes) });
  if (extra) images.push({ name: "extra.png", image: toBase64(extra.bytes) });
  if (mask) images.push({ name: "mask.png", image: toBase64(mask.bytes) });

  const row = await insertImage({
    kind: tool,
    prompt,
    negative,
    model: "qwen",
    style: style.id,
    seed,
    steps: 4,
    cfg: 1,
    width: size.w,
    height: size.h,
    strength: denoise,
    status: "queued",
  });
  try {
    const runpodId = await submitWorkflow(graph, images);
    await updateImage(row.id, { runpod_id: runpodId, status: "running" });
    return reply(200, { jobs: [{ id: row.id, status: "running", seed }], prompt, images: saved });
  } catch (error) {
    const code = error instanceof Error ? error.message : "IMAGE_FAILED";
    await updateImage(row.id, { status: "failed", error: publicImageError(code) });
    return reply(502, { error: publicImageError(code), jobs: [{ id: row.id, status: "failed", seed }], images: saved });
  }
}

async function saveUpload(body: Record<string, unknown> | null): Promise<Reply> {
  const image = parseDataUrl(body?.image);
  if (!image) return reply(400, { error: "Add a picture first." });
  const saved = await rememberUpload(image);
  if (!saved) return reply(503, { error: "History isn't set up yet." });
  return reply(200, { image: present(saved) });
}

async function poll(body: Record<string, unknown> | null): Promise<Reply> {
  const ids = Array.isArray(body?.ids) ? body.ids.filter((id): id is string => typeof id === "string") : [];
  const images = await imagesByIds(ids);
  if (!runpodConfigured()) return reply(200, { images: images.map(present) });
  for (const image of images) {
    if (!image.runpodId || (image.status !== "queued" && image.status !== "running")) continue;
    try {
      const job = await readRunpod(image.runpodId);
      if (job.status === "COMPLETED") {
        const file = await bytesFromRunpodOutput(job.output);
        const path = `results/${image.id}.png`;
        await uploadObject(path, file.mime, file.bytes);
        await updateImage(image.id, {
          status: "done",
          storage_path: path,
          content_sha: createHash("sha256").update(file.bytes).digest("hex"),
          error: null,
        });
      } else if (job.status === "FAILED" || job.status === "CANCELLED" || job.status === "TIMED_OUT") {
        await updateImage(image.id, { status: "failed", error: "Couldn't finish that." });
      }
    } catch {
      await updateImage(image.id, { status: "failed", error: "Couldn't finish that." });
    }
  }
  const fresh = await imagesByIds(ids);
  return reply(200, { images: fresh.map(present) });
}

async function faceLock(body: Record<string, unknown> | null): Promise<Reply> {
  const image = parseDataUrl(body?.image);
  if (!image) return reply(400, { error: "Add a picture first." });
  const saved = await rememberUpload(image);
  const presented = saved ? present(saved) : null;
  if (!presented) return reply(503, { error: "History isn't set up yet." });
  try {
    await uploadObject("face/lock.jpg", image.mime, image.bytes);
    await saveProfile({ face_path: "face/lock.jpg" });
  } catch (error) {
    return reply(500, { error: publicStoreError(error), image: presented, face: false });
  }
  return reply(200, { face: true, image: presented });
}

async function clearFace(): Promise<Reply> {
  await saveProfile({ face_path: null });
  return reply(200, { face: false });
}

async function bodyScan(body: Record<string, unknown> | null): Promise<Reply> {
  const image = parseDataUrl(body?.image);
  if (!image) return reply(400, { error: "Add a picture first." });
  const saved = await rememberUpload(image);
  const presented = saved ? present(saved) : null;
  if (!presented) return reply(503, { error: "History isn't set up yet." });
  let notes = "";
  if (grokConfigured()) {
    const described = (await describeBody(toDataUrl(image.mime, image.bytes))) ?? "";
    notes = minorReason(described) ? "" : described;
  }
  try {
    await uploadObject("body/scan.jpg", image.mime, image.bytes);
    await saveProfile({ body_path: "body/scan.jpg", body_notes: notes });
  } catch (error) {
    return reply(500, { error: publicStoreError(error), image: presented, body: false });
  }
  return reply(200, { body: true, bodyNotes: notes, image: presented });
}

async function clearBody(): Promise<Reply> {
  await saveProfile({ body_path: null, body_notes: "" });
  return reply(200, { body: false, bodyNotes: "" });
}

async function favorite(body: Record<string, unknown> | null): Promise<Reply> {
  const id = str(body?.id, 40);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return reply(400, { error: "That picture isn't here." });
  await updateImage(id, { favorite: body?.on === true });
  return reply(200, { id, favorite: body?.on === true });
}

async function folder(body: Record<string, unknown> | null): Promise<Reply> {
  const name = str(body?.name, 40);
  if (body?.create === true) {
    if (!name || /[\\/]/.test(name)) return reply(400, { error: "Give the folder a short name." });
    await createFolder(name);
    return reply(200, { folders: await listFolders() });
  }
  const id = str(body?.id, 40);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return reply(400, { error: "That picture isn't here." });
  await updateImage(id, { folder: name || null });
  return reply(200, { id, folder: name || null });
}

async function file(body: Record<string, unknown> | null): Promise<Reply> {
  const id = str(body?.id, 40);
  const image = /^[0-9a-f-]{36}$/i.test(id) ? await imageById(id) : null;
  if (!image?.storagePath) return reply(404, { error: "That picture isn't here." });
  const file = await downloadObject(image.storagePath);
  if (!file) return reply(404, { error: "That picture isn't here." });
  return reply(200, { dataUrl: toDataUrl(file.mime, file.bytes) });
}
