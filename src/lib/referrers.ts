const X_HOSTS = new Set([
  "x.com",
  "twitter.com",
  "mobile.twitter.com",
  "t.co",
  "www.x.com",
  "www.twitter.com",
]);

export function hostFromReferrer(ref: string | null | undefined) {
  if (!ref) return "Direct";
  try {
    const u = new URL(ref);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    if (!host) return "Direct";
    if (X_HOSTS.has(host) || host.endsWith(".x.com") || host.endsWith(".twitter.com")) {
      return "X";
    }
    if (host.includes("reddit.com")) return "Reddit";
    if (host.includes("google.")) return "Google";
    if (host.includes("youtube.com") || host === "youtu.be") return "YouTube";
    if (host.includes("instagram.com")) return "Instagram";
    if (host.includes("tiktok.com")) return "TikTok";
    if (host.includes("facebook.com") || host === "fb.com" || host === "m.facebook.com") {
      return "Facebook";
    }
    return host;
  } catch {
    return "Other";
  }
}

/** If X/in-app browsers strip document.referrer, recover from utm / from= */
export function referrerFromQuery(search: string | null | undefined): string | null {
  if (!search) return null;
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const src = (
    params.get("utm_source") ||
    params.get("ref") ||
    params.get("from") ||
    ""
  )
    .toLowerCase()
    .trim();

  if (!src) return null;
  if (["x", "twitter", "t.co"].includes(src)) return "https://x.com/";
  if (src === "reddit") return "https://reddit.com/";
  if (src === "google") return "https://google.com/";
  if (src === "youtube") return "https://youtube.com/";
  if (src === "ig" || src === "instagram") return "https://instagram.com/";
  if (src === "tiktok") return "https://tiktok.com/";
  return null;
}
