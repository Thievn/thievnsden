"use client";

import { useEffect, useState } from "react";
import { PLAYGROUND_GAMES, type PlaygroundGameId } from "@/lib/playground-games";

type ArtMap = Record<string, { url?: string; updated_at?: string }>;

export function PlaygroundArtTab() {
  const [art, setArt] = useState<ArtMap>({});
  const [extra, setExtra] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const load = async () => {
    const res = await fetch("/api/admin/playground-art");
    const data = await res.json();
    setArt(data.art || {});
  };

  useEffect(() => {
    load();
  }, []);

  const shoot = async (id?: PlaygroundGameId) => {
    setBusy(id || "all");
    setFailed(false);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/playground-art", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Shoot failed");
      setArt(data.art || {});
      const n = data.results?.length || 0;
      const extraErr = data.errors?.length ? ` · ${data.errors.join(" | ")}` : "";
      setMsg(`Shot ${n} still${n === 1 ? "" : "s"}${extraErr}`);
    } catch (err: unknown) {
      setFailed(true);
      setMsg(err instanceof Error ? err.message : "Shoot failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-rose-300/80 mb-1">Playground · cards</p>
        <h2 className="text-2xl font-semibold text-neutral-50">Lobby atmospheres</h2>
        <p className="text-sm text-neutral-500 mt-2 max-w-xl">
          Quiet Grok stills behind the machine cards. Dark, one accent, empty left for copy. Reroll if a plate gets too loud.
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-3">
        <textarea
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          rows={2}
          placeholder="Optional extra direction (keep it dim, no faces staring, more rain…)"
          className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200"
        />
        <button
          type="button"
          onClick={() => shoot()}
          disabled={!!busy}
          className="px-4 py-2.5 rounded-xl text-sm border border-rose-800/60 text-rose-100 disabled:opacity-40"
        >
          {busy === "all" ? "Shooting all…" : "Shoot all four"}
        </button>
        {msg && <p className={`text-xs ${failed ? "text-red-300" : "text-neutral-400"}`}>{msg}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PLAYGROUND_GAMES.map((g) => {
          const url = art[g.id]?.url;
          return (
            <div key={g.id} className="rounded-2xl border border-neutral-800 bg-[#0d0d0d] overflow-hidden">
              <div className="relative h-36 bg-[#080608]">
                {url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
                ) : (
                  <p className="absolute inset-0 grid place-items-center text-xs text-neutral-600">No still yet</p>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <p className="absolute bottom-3 left-3 text-sm font-medium text-neutral-50">{g.title}</p>
              </div>
              <div className="p-3 flex items-center justify-between gap-2">
                <p className="text-[11px] text-neutral-500 truncate">{art[g.id]?.updated_at?.slice(0, 16) || "—"}</p>
                <button
                  type="button"
                  onClick={() => shoot(g.id)}
                  disabled={!!busy}
                  className="text-xs px-3 py-1.5 rounded-lg border border-neutral-700 text-neutral-200 disabled:opacity-40"
                >
                  {busy === g.id ? "Shooting…" : url ? "Reroll" : "Shoot"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
