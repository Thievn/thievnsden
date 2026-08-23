"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { AfterimagePeek, PeekThumb } from "@/components/afterimage/AfterimagePeek";
import "@/app/afterimage/afterimage.css";

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
  const [peek, setPeek] = useState<string | null>(null);
  const [saveAs, setSaveAs] = useState("");

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

  const download = (url: string) => {
    const name = (saveAs || "afterimage").replace(/[^a-z0-9-_ ]/gi, "").slice(0, 40) || "afterimage";
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}.jpg`;
    a.click();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-300 mb-2">Afterimage</p>
      <h1 className="text-2xl font-semibold text-neutral-50 mb-1">Your prints</h1>
      <p className="text-sm text-neutral-500 mb-6">Click a picture to open it. Share puts it on the board.</p>
      <div className="flex gap-3 mb-6 text-sm">
        <Link href="/afterimage" className="text-fuchsia-300">Afterimage</Link>
        <Link href="/account" className="text-neutral-500">Account</Link>
      </div>
      <input
        value={saveAs}
        onChange={(e) => setSaveAs(e.target.value)}
        placeholder="Name when you save"
        className="w-full mb-6 px-3 py-2 rounded-xl bg-[#0b0b0b] border border-neutral-800 text-sm"
      />
      {msg && <p className="text-sm text-amber-200 mb-4">{msg}</p>}
      {prints.length === 0 ? (
        <p className="text-sm text-neutral-500">Nothing saved yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {prints.map((p) => (
            <div key={p.id} className="rounded-2xl overflow-hidden border border-neutral-800 bg-black">
              <PeekThumb src={p.image_url} onOpen={() => setPeek(p.image_url)} imgClass="w-full aspect-[9/16] object-cover" />
              <div className="p-2 flex justify-between text-[11px]">
                <button type="button" onClick={() => share(p, !p.is_public)} className="text-fuchsia-300">
                  {p.is_public ? "On board" : "Board"}
                </button>
                <button type="button" onClick={() => download(p.image_url)} className="text-neutral-400">Save</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <AfterimagePeek src={peek} onClose={() => setPeek(null)} />
    </div>
  );
}
