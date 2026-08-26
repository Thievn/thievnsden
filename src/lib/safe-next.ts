export function safeNextPath(raw: string | null | undefined, fallback = "/playground") {
  if (!raw) return fallback;
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//")) return fallback;
  if (raw.includes("://")) return fallback;
  return raw;
}

export function nextFromLocation(fallback = "/playground") {
  if (typeof window === "undefined") return fallback;
  return safeNextPath(new URLSearchParams(window.location.search).get("next"), fallback);
}
