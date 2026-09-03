const BASE = "https://zernio.com/api/v1";

export type ZernioAccount = {
  id: string;
  platform: string;
  username?: string;
  handle?: string;
};

function pickId(row: Record<string, unknown>) {
  return String(row._id || row.id || "");
}

export async function zernioFetch(path: string, opts: { key: string; method?: string; body?: unknown }) {
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method || "GET",
    headers: {
      Authorization: `Bearer ${opts.key}`,
      "Content-Type": "application/json",
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });
  const text = await res.text();
  let json: any = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { error: text.slice(0, 200) };
  }
  if (!res.ok) {
    const err = new Error(json.error || json.message || json.detail || `Send failed (${res.status})`);
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }
  return json;
}

export async function zernioAccounts(key: string): Promise<ZernioAccount[]> {
  const json = await zernioFetch("/accounts", { key });
  const rows: any[] = json.accounts || json.data?.accounts || json.data || [];
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    id: pickId(row),
    platform: String(row.platform || ""),
    username: String(row.username || row.handle || row.name || "").replace(/^@/, ""),
    handle: String(row.username || row.handle || "").replace(/^@/, ""),
  }));
}

export type ZernioPublishInput = {
  key: string;
  accountId: string;
  content: string;
  mediaUrls?: string[];
  publishNow?: boolean;
  scheduledFor?: string;
  timezone?: string;
};

export type ZernioPublishResult = {
  zernio_post_id: string;
  post_id: string | null;
  url: string | null;
  status: string;
};

export async function zernioPublish(input: ZernioPublishInput): Promise<ZernioPublishResult> {
  const mediaItems = (input.mediaUrls || [])
    .filter(Boolean)
    .slice(0, 4)
    .map((url) => ({ type: "image", url }));
  const body: Record<string, unknown> = {
    content: input.content,
    platforms: [{ platform: "twitter", accountId: input.accountId }],
  };
  if (mediaItems.length) body.mediaItems = mediaItems;
  if (input.publishNow) body.publishNow = true;
  if (input.scheduledFor) {
    body.scheduledFor = input.scheduledFor;
    body.timezone = input.timezone || "America/New_York";
  }
  const json = await zernioFetch("/posts", { key: input.key, method: "POST", body });
  const post = json.post || json.data?.post || json.data || json;
  const platforms: any[] = post.platforms || [];
  const tw = platforms.find((p) => String(p.platform || "") === "twitter") || platforms[0] || {};
  return {
    zernio_post_id: String(post._id || post.id || ""),
    post_id: tw.platformPostId ? String(tw.platformPostId) : null,
    url: tw.platformPostUrl ? String(tw.platformPostUrl) : null,
    status: String(post.status || tw.status || (input.publishNow ? "published" : "scheduled")),
  };
}

function normHandle(value: string) {
  return value.replace(/^@/, "").trim().toLowerCase();
}

export function twitterAccount(accounts: ZernioAccount[], preferredId?: string) {
  const want = (preferredId || "").trim();
  if (want) {
    const byId = accounts.find((a) => a.id === want);
    if (byId) return byId;
    const handle = normHandle(want);
    const byHandle = accounts.find(
      (a) => normHandle(a.username || "") === handle || normHandle(a.handle || "") === handle
    );
    if (byHandle) return byHandle;
  }
  return accounts.find((a) => a.platform === "twitter" || a.platform === "x") || accounts[0] || null;
}
