"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastKey = useRef<string>("");

  useEffect(() => {
    if (!pathname) return;

    // Don't track admin
    if (pathname.startsWith("/admin")) return;

    const key = pathname + (searchParams?.toString() || "");
    if (key === lastKey.current) return;
    lastKey.current = key;

    const referrer = typeof document !== "undefined" ? document.referrer : "";

    // Fire and forget
    fetch("/api/analytics/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        referrer: referrer || "",
      }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname, searchParams]);

  return null;
}
