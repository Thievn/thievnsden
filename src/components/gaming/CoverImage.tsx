"use client";

import { useEffect, useState } from "react";

export function normalizeCoverUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  let u = url.trim();
  if (!u) return null;
  if (u.startsWith("//")) u = `https:${u}`;
  if (u.startsWith("http://")) u = `https://${u.slice(7)}`;
  return u;
}

export function displayCoverSrc(url: string) {
  if (url.startsWith("/")) return url;
  if (url.includes("thievnsden.com")) return url;
  if (url.includes("supabase.co") && url.includes("/storage/v1/object/public/")) return url;
  return `/api/gaming/cover?u=${encodeURIComponent(url)}`;
}

export function CoverImage({
  src,
  alt = "",
  className = "",
  imgClassName = "absolute inset-0 w-full h-full object-cover",
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  imgClassName?: string;
}) {
  const normalized = normalizeCoverUrl(src);
  const [failed, setFailed] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setFailed(false);
    setTick(0);
  }, [normalized]);

  if (!normalized || (failed && tick > 1)) {
    return (
      <div className={`relative bg-gradient-to-br from-red-950/40 via-[#111] to-purple-950/30 ${className}`}>
        <div className="absolute inset-0 flex items-end p-5">
          <span className="text-xs uppercase tracking-widest text-neutral-600">Thievn's Den</span>
        </div>
      </div>
    );
  }

  const shown = failed ? normalized : displayCoverSrc(normalized);

  return (
    <div className={`relative bg-neutral-900 overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={shown}
        alt={alt}
        referrerPolicy="no-referrer"
        loading="lazy"
        decoding="async"
        onError={() => {
          if (!failed) setFailed(true);
          else setTick((n) => n + 1);
        }}
        className={imgClassName}
      />
    </div>
  );
}
