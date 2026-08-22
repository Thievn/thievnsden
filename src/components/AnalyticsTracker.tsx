"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { referrerFromQuery } from "@/lib/referrers";

export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastKey = useRef<string>("");

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/admin")) return;

    const qs = searchParams?.toString() || "";
    const key = pathname + qs;
    if (key === lastKey.current) return;
    lastKey.current = key;

    const rawRef = typeof document !== "undefined" ? document.referrer : "";
    const fromQuery = referrerFromQuery(qs);
    const referrer = rawRef || fromQuery || "";

    fetch("/api/analytics/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        referrer,
      }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname, searchParams]);

  return null;
}
