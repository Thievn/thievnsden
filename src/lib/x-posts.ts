export type XPostRow = {
  id: string;
  post_id: string | null;
  url: string | null;
  body: string;
  body_norm: string;
  source: string;
  posted_at: string | null;
  metrics: Record<string, number>;
  recipe?: Record<string, unknown> | null;
  created_at: string;
};

export type DupHit = {
  id: string;
  score: number;
  body: string;
  url: string | null;
  posted_at: string | null;
  post_id: string | null;
};

export function normalizePost(text: string) {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/\blink in bio\b/g, " ")
    .replace(/\bmore in the den\b/g, " ")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(text: string) {
  return new Set(
    normalizePost(text)
      .split(" ")
      .filter((w) => w.length > 2)
  );
}

export function similarity(a: string, b: string) {
  const left = tokenSet(a);
  const right = tokenSet(b);
  if (!left.size || !right.size) return 0;
  let overlap = 0;
  for (const w of left) if (right.has(w)) overlap += 1;
  const jaccard = overlap / (left.size + right.size - overlap);
  const na = normalizePost(a);
  const nb = normalizePost(b);
  const contained =
    na.length > 40 && nb.length > 40 && (na.includes(nb.slice(0, 80)) || nb.includes(na.slice(0, 80)));
  return contained ? Math.max(jaccard, 0.72) : jaccard;
}

export function findDuplicates(draft: string, rows: XPostRow[], limit = 5, skipId?: string): DupHit[] {
  const scored = rows
    .filter((row) => row.id !== skipId)
    .map((row) => ({
      id: row.id,
      score: similarity(draft, row.body),
      body: row.body,
      url: row.url,
      posted_at: row.posted_at,
      post_id: row.post_id,
    }))
    .filter((hit) => hit.score >= 0.42)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

export function parseStatusId(input: string) {
  const trimmed = input.trim();
  const fromUrl = trimmed.match(/(?:x|twitter)\.com\/[^/]+\/status\/(\d+)/i);
  if (fromUrl) return fromUrl[1];
  if (/^\d{8,}$/.test(trimmed)) return trimmed;
  return null;
}

export function postUrl(username: string, postId: string) {
  return `https://x.com/${username.replace(/^@/, "")}/status/${postId}`;
}
