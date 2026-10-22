if (typeof window !== "undefined") {
  throw new Error("Attic storage stays on the server.");
}

export type AtticImage = {
  id: string;
  createdAt: string;
  kind: string;
  prompt: string;
  negative: string;
  model: string | null;
  style: string | null;
  seed: number | null;
  steps: number | null;
  cfg: number | null;
  width: number | null;
  height: number | null;
  strength: number | null;
  favorite: boolean;
  folder: string | null;
  storagePath: string | null;
  status: string;
  runpodId: string | null;
  error: string | null;
  parentId: string | null;
  url: string | null;
  src: string | null;
};

export type AtticProfile = {
  facePath: string | null;
  bodyPath: string | null;
  bodyNotes: string;
};

function configured() {
  return Boolean(process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

export function storageConfigured() {
  return configured();
}

function base() {
  return process.env.SUPABASE_URL?.replace(/\/$/, "") ?? "";
}

function key() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
}

async function rest(path: string, init?: RequestInit): Promise<unknown> {
  if (!configured()) throw new Error("UNCONFIGURED");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(`${base()}/rest/v1/${path}`, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
      headers: {
        apikey: key(),
        Authorization: `Bearer ${key()}`,
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
    });
    if (!response.ok) throw new Error(`BOOK_${response.status}`);
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } finally {
    clearTimeout(timer);
  }
}

function rows(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? (value.filter((row) => row && typeof row === "object") as Record<string, unknown>[]) : [];
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

async function sign(path: string): Promise<string | null> {
  if (!path) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(`${base()}/storage/v1/object/sign/attic/${path}`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        apikey: key(),
        Authorization: `Bearer ${key()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn: 300 }),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { signedURL?: string };
    if (!body.signedURL) return null;
    return `${base()}/storage/v1${body.signedURL}`;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function uploadObject(path: string, mime: string, bytes: Uint8Array): Promise<void> {
  if (!configured()) throw new Error("UNCONFIGURED");
  const response = await fetch(`${base()}/storage/v1/object/attic/${path}`, {
    method: "POST",
    headers: {
      apikey: key(),
      Authorization: `Bearer ${key()}`,
      "Content-Type": mime,
      "x-upsert": "true",
    },
    body: Buffer.from(bytes),
  });
  if (!response.ok) throw new Error(`BOOK_${response.status}`);
}

export async function downloadObject(path: string): Promise<{ mime: string; bytes: Uint8Array } | null> {
  if (!configured()) return null;
  const response = await fetch(`${base()}/storage/v1/object/attic/${path}`, {
    headers: { apikey: key(), Authorization: `Bearer ${key()}` },
  });
  if (!response.ok) return null;
  const mime = response.headers.get("content-type")?.split(";")[0]?.trim() || "image/png";
  return { mime, bytes: new Uint8Array(await response.arrayBuffer()) };
}

function mapImage(row: Record<string, unknown>, url: string | null): AtticImage {
  return {
    id: String(row.id),
    createdAt: String(row.created_at ?? ""),
    kind: String(row.kind ?? ""),
    prompt: String(row.prompt ?? ""),
    negative: String(row.negative ?? ""),
    model: text(row.model),
    style: text(row.style),
    seed: num(row.seed),
    steps: num(row.steps),
    cfg: num(row.cfg),
    width: num(row.width),
    height: num(row.height),
    strength: num(row.strength),
    favorite: Boolean(row.favorite),
    folder: text(row.folder),
    storagePath: text(row.storage_path),
    status: String(row.status ?? ""),
    runpodId: text(row.runpod_id),
    error: text(row.error),
    parentId: text(row.parent_id),
    url,
    src: text(row.src),
  };
}

async function withUrls(list: Record<string, unknown>[]): Promise<AtticImage[]> {
  return Promise.all(
    list.map(async (row) => {
      const path = text(row.storage_path);
      const url = row.status === "done" && path ? await sign(path) : null;
      return mapImage(row, url);
    }),
  );
}

export async function loadProfile(): Promise<AtticProfile> {
  const value = await rest("attic_profile?id=eq.1&select=face_path,body_path,body_notes");
  const row = rows(value)[0];
  return {
    facePath: text(row?.face_path),
    bodyPath: text(row?.body_path),
    bodyNotes: text(row?.body_notes) ?? "",
  };
}

export async function saveProfile(patch: Partial<{ face_path: string | null; body_path: string | null; body_notes: string }>) {
  await rest("attic_profile?on_conflict=id", {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ id: 1, ...patch, updated_at: new Date().toISOString() }),
  });
}

export async function listFolders(): Promise<string[]> {
  const value = await rest("attic_folders?select=name&order=name.asc");
  return rows(value).map((row) => String(row.name)).filter(Boolean);
}

export async function createFolder(name: string) {
  await rest("attic_folders?on_conflict=name", {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ name }),
  });
}

const IMAGE_COLUMNS =
  "id,created_at,kind,prompt,negative,model,style,seed,steps,cfg,width,height,strength,favorite,folder,storage_path,status,runpod_id,error,parent_id,src";
const IMAGE_COLUMNS_BASE =
  "id,created_at,kind,prompt,negative,model,style,seed,steps,cfg,width,height,strength,favorite,folder,storage_path,status,runpod_id,error,parent_id";

async function queryImages(filter: string): Promise<Record<string, unknown>[]> {
  try {
    return rows(await rest(`attic_images?select=${IMAGE_COLUMNS}&${filter}`));
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message !== "BOOK_400") throw error;
    return rows(await rest(`attic_images?select=${IMAGE_COLUMNS_BASE}&${filter}`));
  }
}

export async function listImages(): Promise<AtticImage[]> {
  return withUrls(await queryImages("order=created_at.desc&limit=80"));
}

async function insertRow(row: Record<string, unknown>): Promise<AtticImage> {
  const value = await rest("attic_images", {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(row),
  });
  const saved = rows(value)[0];
  if (!saved) throw new Error("BOOK_INSERT");
  return mapImage(saved, null);
}

export async function insertImage(row: Record<string, unknown>): Promise<AtticImage> {
  try {
    return await insertRow(row);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "BOOK_400" && "src" in row) {
      const next = { ...row };
      delete next.src;
      return await insertRow(next);
    }
    throw error;
  }
}

export async function updateImage(id: string, patch: Record<string, unknown>): Promise<void> {
  await rest(`attic_images?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(patch),
  });
}

export async function isAtticResult(sha: string): Promise<boolean> {
  if (!/^[a-f0-9]{64}$/i.test(sha)) return false;
  const value = await rest(`attic_images?content_sha=eq.${sha}&status=eq.done&kind=neq.upload&select=id&limit=1`);
  return rows(value).length > 0;
}

export async function findUpload(sha: string): Promise<AtticImage | null> {
  if (!/^[a-f0-9]{64}$/i.test(sha)) return null;
  const value = await rest(`attic_images?upload_sha=eq.${sha}&kind=eq.upload&select=id&limit=1`);
  const id = text(rows(value)[0]?.id);
  return id ? imageById(id) : null;
}

export async function imageById(id: string): Promise<AtticImage | null> {
  const row = (await queryImages(`id=eq.${encodeURIComponent(id)}&limit=1`))[0];
  if (!row) return null;
  const path = text(row.storage_path);
  const url = row.status === "done" && path ? await sign(path) : null;
  return mapImage(row, url);
}

export async function imagesByIds(ids: string[]): Promise<AtticImage[]> {
  const clean = ids.filter((id) => /^[0-9a-f-]{36}$/i.test(id)).slice(0, 8);
  if (!clean.length) return [];
  return withUrls(await queryImages(`id=in.(${clean.join(",")})`));
}

export function publicStoreError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (message === "UNCONFIGURED" || message.startsWith("BOOK_")) return "History isn't set up yet.";
  return "Couldn't save that.";
}

