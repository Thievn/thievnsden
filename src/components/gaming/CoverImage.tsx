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
  if (url.includes("/api/gaming/cover?")) return url;
  return `/api/gaming/cover?u=${encodeURIComponent(url)}`;
}

export function CoverImage({
  src,
  alt = "",
  className = "",
  imgClassName = "h-full w-full object-cover",
  eager = false,
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  imgClassName?: string;
  eager?: boolean;
}) {
  const normalized = normalizeCoverUrl(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [normalized]);

  if (!normalized || failed) {
    return (
      <div className={`relative overflow-hidden bg-gradient-to-br from-violet-950/70 via-[#111] to-rose-950/40 ${className}`}>
        <div className="absolute inset-0 flex items-end p-5">
          <span className="text-xs uppercase tracking-widest text-neutral-600">Thievn&apos;s Den</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-neutral-900 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={normalized}
        src={displayCoverSrc(normalized)}
        alt={alt}
        referrerPolicy="no-referrer"
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onError={() => setFailed(true)}
        className={imgClassName}
      />
    </div>
  );
}
