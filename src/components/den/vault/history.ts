export type HistPoint = { t: number; usd: number; sol: number };

const LIMIT = 120;

export function historyKey(cluster: string, address: string) {
  return `den_balance_history_v1:${cluster}:${address}`;
}

export function readHistory(cluster: string, address: string): HistPoint[] {
  try {
    const raw = localStorage.getItem(historyKey(cluster, address));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((point) => {
      if (!point || typeof point !== "object") return [];
      const row = point as Partial<HistPoint>;
      if (typeof row.t !== "number" || typeof row.usd !== "number") return [];
      return [{ t: row.t, usd: row.usd, sol: typeof row.sol === "number" ? row.sol : 0 }];
    }).slice(-LIMIT);
  } catch {
    return [];
  }
}

export function rememberBalance(cluster: string, address: string, point: HistPoint): HistPoint[] {
  const points = readHistory(cluster, address);
  const last = points[points.length - 1];
  const changed = !last || Math.abs(last.usd - point.usd) >= 0.5 || Math.abs(last.sol - point.sol) >= 0.0001;
  const stale = !last || point.t - last.t > 5 * 60_000;
  if (last && !changed && !stale) return points;
  const next = [...points, point].slice(-LIMIT);
  localStorage.setItem(historyKey(cluster, address), JSON.stringify(next));
  return next;
}
