import { AMAZON_TAG, amazonSearchUrl } from "@/lib/loot-data";

const AMAZON_MD = /\[([^\]]{1,80})\]\((amazon:[^)]+|https?:\/\/(?:www\.)?amazon\.com[^)]+)\)/gi;

const SHOP: { re: RegExp; query: string }[] = [
  { re: /\bCRT monitors?\b/gi, query: "CRT monitor" },
  { re: /\bCRT glow\b/gi, query: "CRT monitor" },
  { re: /\bCRTs\b/gi, query: "CRT monitor" },
  { re: /\bCRT\b/g, query: "CRT monitor" },
  { re: /\bgame manuals\b/gi, query: "retro video game manuals" },
  { re: /\binstruction manuals\b/gi, query: "retro video game manuals" },
  { re: /\bmonitor arms?\b/gi, query: "monitor arm" },
  { re: /\bphone cases?\b/gi, query: "phone case" },
  { re: /\bcable raceways?\b/gi, query: "cable raceway" },
  { re: /\bgaming mice\b/gi, query: "wireless gaming mouse" },
  { re: /\bgaming mouse\b/gi, query: "wireless gaming mouse" },
  { re: /\bmechanical keyboards?\b/gi, query: "60 percent mechanical keyboard" },
  { re: /\bgaming headsets?\b/gi, query: "wireless gaming headset" },
  { re: /\bwireless headsets?\b/gi, query: "wireless gaming headset" },
  { re: /\bXbox controllers?\b/gi, query: "Xbox wireless controller" },
  { re: /\bDualSense\b/gi, query: "DualSense controller" },
  { re: /\bDualShock\b/gi, query: "DualShock controller" },
  { re: /\bgaming chairs?\b/gi, query: "gaming chair" },
  { re: /\bcapture cards?\b/gi, query: "elgato capture card" },
  { re: /\bsteelbooks?\b/gi, query: "video game steelbook" },
  { re: /\banime figures?\b/gi, query: "anime figure statue" },
  { re: /\bgraphics cards?\b/gi, query: "ASUS ROG Strix RTX" },
  { re: /\bRTX\b/g, query: "ASUS ROG Strix RTX" },
  { re: /\bGame Boy\b/gi, query: "Game Boy console" },
  { re: /\bSNES\b/g, query: "Super Nintendo" },
  { re: /\bN64\b/g, query: "Nintendo 64" },
  { re: /\bretro consoles?\b/gi, query: "retro game console" },
];

export function isAmazonHref(href: string) {
  try {
    const u = new URL(href);
    return u.protocol === "https:" && /(^|\.)amazon\.com$/i.test(u.hostname);
  } catch {
    return false;
  }
}

export function resolveAffiliateHref(raw: string, tag = AMAZON_TAG) {
  const href = String(raw || "").trim();
  if (href.toLowerCase().startsWith("amazon:")) {
    return amazonSearchUrl(href.slice(7).trim(), tag);
  }
  if (!isAmazonHref(href)) return "";
  try {
    const u = new URL(href);
    if (!u.searchParams.get("tag")) u.searchParams.set("tag", tag);
    return u.toString();
  } catch {
    return "";
  }
}

function isInsideMarkdownLink(text: string, index: number) {
  const open = text.lastIndexOf("[", index);
  if (open < 0) return false;
  const mid = text.indexOf("](", open);
  const close = text.indexOf(")", mid === -1 ? open : mid);
  return mid >= 0 && close >= 0 && open <= index && index <= close;
}

export function injectShopLinks(body: string, mode: "essay" | "game" | "loot", tag = AMAZON_TAG) {
  let text = String(body || "");
  text = text.replace(AMAZON_MD, (_full, label: string, target: string) => {
    const href = resolveAffiliateHref(target, tag);
    return href ? `[${label}](${href})` : label;
  });

  const max = mode === "game" ? 1 : 3;
  let used = (text.match(/amazon\.com/gi) || []).length;
  if (used >= max) return text;

  for (const row of SHOP) {
    if (used >= max) break;
    const re = new RegExp(row.re.source, row.re.flags.includes("g") ? row.re.flags : `${row.re.flags}g`);
    let hit: RegExpExecArray | null;
    while ((hit = re.exec(text))) {
      if (isInsideMarkdownLink(text, hit.index)) continue;
      const label = hit[0];
      const href = amazonSearchUrl(row.query, tag);
      text = `${text.slice(0, hit.index)}[${label}](${href})${text.slice(hit.index + label.length)}`;
      used += 1;
      break;
    }
  }
  return text;
}

export function injectLootLinks(body: string, searchQuery = "", tag = AMAZON_TAG) {
  let text = injectShopLinks(body, "loot", tag);
  const query = String(searchQuery || "").trim();
  if (!query) return text;
  if ((text.match(/amazon\.com/gi) || []).length >= 3) return text;
  const href = amazonSearchUrl(query, tag);
  const needle = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(needle, "i");
  const hit = re.exec(text);
  if (hit && !isInsideMarkdownLink(text, hit.index)) {
    return `${text.slice(0, hit.index)}[${hit[0]}](${href})${text.slice(hit.index + hit[0].length)}`;
  }
  return text;
}

export type CopyPart = { type: "text"; text: string } | { type: "link"; text: string; href: string };

export function splitLinkedCopy(
  body: string,
  mode: "essay" | "game" | "loot" = "essay",
  tag = AMAZON_TAG,
  shopQuery = ""
): CopyPart[] {
  const text = mode === "loot" ? injectLootLinks(body, shopQuery, tag) : injectShopLinks(body, mode, tag);
  const parts: CopyPart[] = [];
  const re = /\[([^\]]{1,80})\]\((https?:\/\/[^)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push({ type: "text", text: text.slice(last, m.index) });
    const href = resolveAffiliateHref(m[2], tag);
    if (href) parts.push({ type: "link", text: m[1], href });
    else parts.push({ type: "text", text: m[1] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ type: "text", text: text.slice(last) });
  return parts.length ? parts : [{ type: "text", text }];
}

export const LOOT_WRITE_HINT = `This is a loot mini-article. Wrap TWO short shoppable phrases in markdown like [wireless headset](amazon:wireless gaming headset) using Amazon SEARCH keywords, not a single ASIN. Do not link the whole sentence. Do not write a shop pitch.`;

export const AFFILIATE_WRITE_HINT = `If the piece names a physical thing people actually buy (CRT, headset, keyboard, controller, GPU, steelbook, figure, retro console, game manuals), wrap ONE short phrase in markdown like [CRT monitor](amazon:CRT monitor). Do not link a whole sentence. Do not add a shop pitch. Zero links is correct if nothing is buyable.`;
