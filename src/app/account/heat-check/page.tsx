"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

async function headers(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function HeatAccountPage() {
  const router = useRouter();
  const [nights, setNights] = useState<any[]>([]);
  const [saves, setSaves] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");
  const [companion, setCompanion] = useState(false);

  const load = async () => {
    const h = await headers();
    const [t, s, c] = await Promise.all([
      fetch("/api/heat-check/threads", { headers: h }).then((r) => r.json()),
      fetch(`/api/heat-check/saves?q=${encodeURIComponent(q)}`, { headers: h }).then((r) => r.json()),
      fetch("/api/heat-check/companion", { headers: h }).then((r) => r.json()).catch(() => ({})),
    ]);
    setNights(t.nights || t.threads || []);
    setSaves(s.saves || []);
    if (typeof c.enabled === "boolean") setCompanion(c.enabled);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) router.push("/login?next=/account/heat-check");
      else load();
    });
  }, [router]);

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <Link href="/account" className="text-sm text-neutral-500">← Account</Link>
      <h1 className="text-2xl font-semibold text-neutral-50 mt-4 mb-2">Heat Check</h1>
      <p className="text-sm text-neutral-500 mb-6">Resume a night. Search the line stash. Keep the same person.</p>
      <label className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-800 bg-[#111] px-4 py-3 mb-6 text-sm">
        <span>Companion check-ins</span>
        <input
          type="checkbox"
          checked={companion}
          onChange={async (e) => {
            const on = e.target.checked;
            setCompanion(on);
            await fetch("/api/heat-check/companion", {
              method: "POST",
              headers: { ...(await headers()), "Content-Type": "application/json" },
              body: JSON.stringify({ enabled: on }),
            });
          }}
        />
      </label>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && load()}
        placeholder="Search saved lines"
        className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm mb-6"
      />

      <p className="text-[11px] uppercase tracking-[0.18em] text-orange-300/80 mb-2">Nights</p>
      <div className="rounded-2xl border border-neutral-800 bg-[#111] divide-y divide-neutral-800/60 mb-8">
        {nights.length === 0 ? (
          <p className="p-4 text-sm text-neutral-500">No nights yet.</p>
        ) : (
          nights.map((t) => (
            <div key={t.id} className="p-4 flex items-center justify-between gap-3">
              <Link href={`/playground/heat-check?night=${t.id}`} className="min-w-0">
                <p className="text-sm text-neutral-100">{t.contact_name}</p>
                <p className="text-[11px] text-neutral-500">{t.role} · {t.ended ? "faded" : "open"}</p>
              </Link>
              <button
                type="button"
                className="text-[11px] text-rose-300"
                onClick={async () => {
                  if (!confirm("Delete this night and its images?")) return;
                  await fetch(`/api/heat-check/threads/${t.id}`, { method: "DELETE", headers: await headers() });
                  setMsg("Deleted.");
                  load();
                }}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>

      <p className="text-[11px] uppercase tracking-[0.18em] text-orange-300/80 mb-2">Line stash</p>
      <div className="rounded-2xl border border-neutral-800 bg-[#111] divide-y divide-neutral-800/60">
        {saves.length === 0 ? (
          <p className="p-4 text-sm text-neutral-500">Nothing saved.</p>
        ) : (
          saves.map((s) => (
            <p key={s.id} className="p-4 text-sm text-neutral-200">{s.line}</p>
          ))
        )}
      </div>
      {msg ? <p className="text-xs text-neutral-500 mt-4">{msg}</p> : null}
    </div>
  );
}
