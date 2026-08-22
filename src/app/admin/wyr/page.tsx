"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { isAdmin } from "@/lib/admin";
import { WyrTab } from "@/app/admin/WyrTab";

export default function AdminWyrPage() {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user || !isAdmin(session.user)) {
        router.push("/");
        return;
      }
      setOk(true);
    })();
  }, [router]);

  if (!ok) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-sm text-neutral-500">Checking access…</div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-1">Admin</p>
          <h1 className="text-2xl font-semibold text-neutral-100">Would You Rather</h1>
        </div>
        <Link href="/admin" className="text-sm text-neutral-500 hover:text-neutral-300">
          ← Admin
        </Link>
      </div>
      <WyrTab />
    </div>
  );
}
