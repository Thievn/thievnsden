const API = "https://api.x.com/2";

export function xApiReady() {
  return Boolean(process.env.X_BEARER_TOKEN);
}

export function xHandle() {
  return (process.env.X_HANDLE || "Thievn").replace(/^@/, "");
}

async function xGet(path: string) {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) {
    const err = new Error("X_BEARER_TOKEN missing");
    (err as Error & { status?: number }).status = 501;
    throw err;
  }
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const text = await res.text();
  let json: any = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { detail: text.slice(0, 200) };
  }
  if (!res.ok) {
    const err = new Error(json.detail || json.title || json.error || `X request failed (${res.status})`);
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }
  return json;
}

export type RemoteXPost = {
  post_id: string;
  body: string;
  posted_at: string | null;
  url: string;
  metrics: Record<string, number>;
};

export async function fetchOwnPosts(maxResults = 10): Promise<RemoteXPost[]> {
  const handle = xHandle();
  const user = await xGet(
    `/users/by/username/${encodeURIComponent(handle)}?user.fields=id,username`
  );
  const userId = user.data?.id;
  if (!userId) throw new Error("Could not resolve that X handle");
  const n = Math.min(Math.max(maxResults, 5), 20);
  const posts = await xGet(
    `/users/${userId}/tweets?max_results=${n}&exclude=retweets,replies&tweet.fields=created_at,public_metrics,text`
  );
  const rows: any[] = Array.isArray(posts.data) ? posts.data : [];
  return rows.map((row) => ({
    post_id: String(row.id),
    body: String(row.text || ""),
    posted_at: row.created_at || null,
    url: `https://x.com/${handle}/status/${row.id}`,
    metrics: {
      likes: Number(row.public_metrics?.like_count || 0),
      reposts: Number(row.public_metrics?.retweet_count || 0),
      replies: Number(row.public_metrics?.reply_count || 0),
      quotes: Number(row.public_metrics?.quote_count || 0),
    },
  }));
}
