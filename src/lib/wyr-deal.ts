import type { WyrPair } from "@/lib/wyr-data";
import { contrastLine } from "@/lib/wyr-topics";

function shuffle<T>(list: T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function topicsOf(p: WyrPair) {
  return [p.topic, p.topicB].filter(Boolean) as string[];
}

export function dealFromPool(pool: WyrPair[], n = 10): WyrPair[] {
  if (pool.length <= n) return shuffle(pool);
  const shuffled = shuffle(pool);
  const picked: WyrPair[] = [];
  const used = new Set<string>();

  for (const p of shuffled) {
    if (picked.length >= n) break;
    const topics = topicsOf(p);
    const overlap = topics.filter((t) => used.has(t)).length;
    if (picked.length < 8 && overlap >= 2) continue;
    picked.push(p);
    topics.forEach((t) => used.add(t));
  }

  for (const p of shuffled) {
    if (picked.length >= n) break;
    if (!picked.some((x) => x.id === p.id)) picked.push(p);
  }

  return picked.slice(0, n);
}

export function floorTitle(pairs: WyrPair[]) {
  const counts = new Map<string, number>();
  for (const p of pairs) {
    for (const t of topicsOf(p)) counts.set(t, (counts.get(t) || 0) + 1);
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const a = ranked[0]?.[0];
  const b = ranked.find((x) => x[0] !== a)?.[0];
  return contrastLine(a, b);
}
