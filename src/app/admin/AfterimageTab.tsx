"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { HEATS, LIGHTS, LOOKS, PHONES, PLACES } from "@/lib/afterimage";

export function AfterimageTab() {
  const [userId, setUserId] = useState("");
  const [prints, setPrints] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [want, setWant] = useState("rain on a rooftop, looking back, city below");
  const [styleId, setStyleId] = useState("glamour");
  const [styleSearch, setStyleSearch] = useState("");
  const [heat, setHeat] = useState("flirty");
  const [phoneId, setPhoneId] = useState("iphone-16-pro-max");
  const [subject, setSubject] = useState("");
  const [clothes, setClothes] = useState("");
  const [lighting, setLighting] = useState("neon night");
  const [place, setPlace] = useState("city rooftop");
  const [overlay, setOverlay] = useState("");
  const [extra, setExtra] = useState("");
  const [rawPrompt, setRawPrompt] = useState("");
  const [safeZone, setSafeZone] = useState(true);
  const [threeUp, setThreeUp] = useState(true);
  const [publish, setPublish] = useState(true);
  const [finish, setFinish] = useState<"preview" | "phone">("phone");
  const [grantUser, setGrantUser] = useState("");
  const [grantAmt, setGrantAmt] = useState(8);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || "");
    });
    load();
  }, []);

  const load = async (query = q) => {
    const res = await fetch(`/api/admin/afterimage?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setPrints(data.prints || []);
    if (data.error) setMsg(data.error);
  };

  const print = async () => {
    if (!userId) return setMsg("Not logged in");
    setBusy(true);
    setMsg("Printing… this can take a minute");
    try {
      const res = await fetch("/api/afterimage/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          want,
          styleId,
          styleSearch,
          heat,
          phoneId,
          subject,
          clothes,
          lighting,
          place,
          overlay,
          extra,
          rawPrompt,
          safeZone,
          threeUp,
          publish,
          finish,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMsg(`OK · ${data.prints?.length || 1} print(s)`);
      await load();
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  const field = "w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-fuchsia-900/30 bg-gradient-to-b from-fuchsia-950/20 to-[#111] p-5 space-y-4">
        <div>
          <p className="text-sm text-neutral-100 font-medium">Admin press</p>
          <p className="text-xs text-neutral-500 mt-1">
            You skip credits. Phone-ready + 3-up is on by default so the board fills with sharp walls.
          </p>
        </div>
        <textarea value={want} onChange={(e) => setWant(e.target.value)} rows={3} className={field} placeholder="What you want" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-xs text-neutral-500 space-y-1">
            Look
            <select value={styleId} onChange={(e) => setStyleId(e.target.value)} className={field}>
              {LOOKS.map((l) => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-neutral-500 space-y-1">
            Style search
            <input value={styleSearch} onChange={(e) => setStyleSearch(e.target.value)} className={field} placeholder="Makoto Shinkai, oil portrait…" />
          </label>
          <label className="text-xs text-neutral-500 space-y-1">
            Heat
            <select value={heat} onChange={(e) => setHeat(e.target.value)} className={field}>
              {HEATS.map((h) => (
                <option key={h.id} value={h.id}>{h.label}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-neutral-500 space-y-1">
            Phone
            <select value={phoneId} onChange={(e) => setPhoneId(e.target.value)} className={field}>
              {PHONES.map((p) => (
                <option key={p.id} value={p.id}>{p.brand} · {p.name}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-neutral-500 space-y-1">
            Subject
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className={field} />
          </label>
          <label className="text-xs text-neutral-500 space-y-1">
            Clothes
            <input value={clothes} onChange={(e) => setClothes(e.target.value)} className={field} />
          </label>
          <label className="text-xs text-neutral-500 space-y-1">
            Light
            <select value={lighting} onChange={(e) => setLighting(e.target.value)} className={field}>
              {LIGHTS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-neutral-500 space-y-1">
            Place
            <select value={place} onChange={(e) => setPlace(e.target.value)} className={field}>
              {PLACES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
        </div>
        <input value={overlay} onChange={(e) => setOverlay(e.target.value)} className={field} placeholder="Tiny text in the art (optional)" />
        <input value={extra} onChange={(e) => setExtra(e.target.value)} className={field} placeholder="Extra notes" />
        <textarea value={rawPrompt} onChange={(e) => setRawPrompt(e.target.value)} rows={3} className={field} placeholder="Raw prompt override — skips the builder if filled" />
        <div className="flex flex-wrap gap-4 text-sm text-neutral-300">
          <label className="flex items-center gap-2"><input type="checkbox" checked={safeZone} onChange={(e) => setSafeZone(e.target.checked)} /> Clock space</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={threeUp} onChange={(e) => setThreeUp(e.target.checked)} /> 3 versions</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} /> Show on board</label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={finish === "phone"} onChange={(e) => setFinish(e.target.checked ? "phone" : "preview")} />
            Phone-ready
          </label>
        </div>
        <button onClick={print} disabled={busy} className="w-full py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 via-rose-500 to-amber-400 text-black font-semibold disabled:opacity-50">
          {busy ? "Printing…" : threeUp ? "Print 3 versions" : "Print"}
        </button>
        {msg && <p className="text-xs text-fuchsia-200">{msg}</p>}
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-3">
        <p className="text-xs uppercase tracking-wide text-neutral-500">Give credits</p>
        <div className="flex flex-wrap gap-2">
          <input value={grantUser} onChange={(e) => setGrantUser(e.target.value)} className={field + " sm:max-w-xs"} placeholder="User UUID" />
          <input type="number" value={grantAmt} onChange={(e) => setGrantAmt(Number(e.target.value))} className={field + " w-24"} />
          <button
            onClick={async () => {
              const res = await fetch("/api/admin/afterimage", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "credits", userId: grantUser, add: grantAmt }),
              });
              const data = await res.json();
              setMsg(data.error || `Credits now ${data.credits}`);
            }}
            className="px-4 py-2 rounded-lg border border-neutral-700 text-sm"
          >
            Add
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} className={field} placeholder="Search user or want" />
        <button onClick={() => load(q)} className="px-4 rounded-lg border border-neutral-700 text-sm">Search</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {prints.map((p) => (
          <div key={p.id} className="rounded-xl overflow-hidden border border-neutral-800 bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.image_url} alt="" className="w-full aspect-[9/16] object-cover" />
            <div className="p-2 space-y-1">
              <p className="text-[10px] text-neutral-500 truncate">{p.username} · {p.finish}</p>
              <div className="flex gap-1">
                <button
                  onClick={async () => {
                    await fetch("/api/admin/afterimage", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: p.id, is_public: !p.is_public }),
                    });
                    load();
                  }}
                  className="text-[10px] text-fuchsia-300"
                >
                  {p.is_public ? "Hide" : "Board"}
                </button>
                <button
                  onClick={async () => {
                    if (!confirm("Delete?")) return;
                    await fetch("/api/admin/afterimage", {
                      method: "DELETE",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: p.id }),
                    });
                    load();
                  }}
                  className="text-[10px] text-red-400"
                >
                  Del
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
