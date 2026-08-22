"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminWyrRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin?tab=wyr");
  }, [router]);
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-sm text-neutral-500">Opening WYR in admin…</div>
  );
}
