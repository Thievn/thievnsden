"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export default function AccountHeatPage() {
  const router = useRouter();
  const [threads, setThreads] = useState<{ id: string; contact_name: string; status: string; created_at: string }[]>([]);
  const [saves, setSaves] = useState<{ id: string; body: string }[]>([]);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        router.push("/login?next=/account/heat-check");
        return;
      }
      load();
    });
  }, [router]);

  const load = async () => {
    const res = await fetch("/api/heat-check/thread", { headers: await authHeaders() });
    const data = await res.json();
    setThreads(data.threads || []);
    const s = await fetch(`/api/heat-check/saves${q ? `?q=${encodeURIComponent(q)}` : ""}`, { headers: await authHeaders() });
    const sd = await s.json();
    setSaves(sd.saves || []);
  };

  const wipe = async (id: string) => {
    if (!confirm("Delete this thread?")) return;
    await fetch("/api/heat-check/thread", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({ id }),
    });
    load();
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <p className="text-[11px] uppercase tracking-[0.2em] text-rose-300 mb-2">Heat Check</p>
      <h1 className="text-2xl font-semibold text-neutral-50 mb-6">Threads and lines</h1>
      <div className="space-y-2 mb-8">
        {threads.map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded-xl border border-neutral-800 px-3 py-3">
            <Link href={`/playground/heat-check?id=${t.id}`} className="text-sm text-neutral-200">
              {t.contact_name} · {t.status}
            </Link>
            <button type="button" className="text-xs text-rose-400" onClick={() => wipe(t.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onBlur={load}
        placeholder="Search saved lines"
        className="w-full mb-3 px-3 py-2 rounded-xl bg-[#111] border border-neutral-800 text-sm"
      />
      <div className="space-y-2">
        {saves.map((s) => (
          <p key={s.id} className="text-sm text-neutral-300 border border-neutral-800 rounded-xl p-3">
            {s.body}
          </p>
        ))}
      </div>
      {msg ? <p className="text-sm text-rose-300 mt-3">{msg}</p> : null}
    </div>
  );
}
