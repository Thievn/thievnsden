"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Print = {
  id: string;
  image_url: string;
  want?: string;
  finish?: string;
  is_public?: boolean;
};

export default function AccountAfterimagePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [prints, setPrints] = useState<Print[]>([]);
  const [credits, setCredits] = useState(0);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        router.push("/login");
        return;
      }
      setUserId(session.user.id);
      load(session.user.id);
    });
  }, [router]);

  const load = async (id: string) => {
    const res = await fetch(`/api/afterimage/me?userId=${id}`);
    const data = await res.json();
    setPrints(data.prints || []);
    setCredits(data.wallet?.credits || 0);
  };

  const share = async (p: Print, next: boolean) => {
    if (!userId) return;
    const res = await fetch("/api/afterimage/print", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, userId, is_public: next }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Could not update");
      return;
    }
    setPrints((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_public: next } : x)));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-300 mb-2">Afterimage</p>
      <h1 className="text-2xl font-semibold text-neutral-50 mb-1">Your prints</h1>
      <p className="text-sm text-neutral-500 mb-6">
        Credits {credits}. Share puts it on the public board. Off keeps it in this locker only.
      </p>
      <div className="flex gap-3 mb-8 text-sm">
        <Link href="/afterimage" className="text-fuchsia-300">Make another</Link>
        <Link href="/account" className="text-neutral-500">Account</Link>
      </div>
      {msg && <p className="text-sm text-amber-200 mb-4">{msg}</p>}
      {prints.length === 0 ? (
        <p className="text-sm text-neutral-500">Nothing saved yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {prints.map((p) => (
            <div key={p.id} className="rounded-2xl overflow-hidden border border-neutral-800 bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image_url} alt="" className="w-full aspect-[9/16] object-cover" />
              <div className="p-2 space-y-1">
                <p className="text-[10px] text-neutral-500 truncate">{p.finish} · {p.want || "print"}</p>
                <div className="flex justify-between text-[11px]">
                  <button type="button" onClick={() => share(p, !p.is_public)} className="text-fuchsia-300">
                    {p.is_public ? "On board" : "Share to board"}
                  </button>
                  <a href={p.image_url} download className="text-neutral-400">Save</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
