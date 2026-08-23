"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { HEATS, LIGHTS, LOOKS, PHONES, PLACES, phoneById } from "@/lib/afterimage";

type Print = {
  id: string;
  image_url: string;
  want?: string;
  style_id?: string;
  heat?: string;
  finish?: string;
  username?: string;
  is_public?: boolean;
  created_at?: string;
};

export function AfterimageApp() {
  const [userId, setUserId] = useState<string | null>(null);
  const [want, setWant] = useState("");
  const [styleId, setStyleId] = useState("anime");
  const [styleSearch, setStyleSearch] = useState("");
  const [heat, setHeat] = useState("flirty");
  const [phoneId, setPhoneId] = useState("iphone-16");
  const [more, setMore] = useState(false);
  const [subject, setSubject] = useState("");
  const [clothes, setClothes] = useState("");
  const [lighting, setLighting] = useState("neon night");
  const [place, setPlace] = useState("city rooftop");
  const [overlay, setOverlay] = useState("");
  const [safeZone, setSafeZone] = useState(true);
  const [threeUp, setThreeUp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [board, setBoard] = useState<Print[]>([]);
  const [mine, setMine] = useState<Print[]>([]);
  const [credits, setCredits] = useState(0);
  const [previewUsed, setPreviewUsed] = useState(false);
  const [picked, setPicked] = useState<Print[]>([]);

  const phone = useMemo(() => phoneById(phoneId), [phoneId]);
  const brands = [...new Set(PHONES.map((p) => p.brand))];

  useEffect(() => {
    fetch("/api/afterimage/board")
      .then((r) => r.json())
      .then((d) => setBoard(d.prints || []))
      .catch(() => {});
    supabase.auth.getSession().then(({ data: { session } }) => {
      const id = session?.user?.id || null;
      setUserId(id);
      if (id) loadMe(id);
    });
  }, []);

  const loadMe = async (id: string) => {
    const res = await fetch(`/api/afterimage/me?userId=${id}`);
    const data = await res.json();
    setCredits(data.wallet?.credits || 0);
    setPreviewUsed(!!data.wallet?.preview_used);
    setMine(data.prints || []);
  };

  const print = async (finish: "preview" | "phone") => {
    if (!userId) {
      setMsg("Make an account first.");
      return;
    }
    setBusy(true);
    setMsg(finish === "preview" ? "Previewing…" : "Printing phone-ready…");
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
          safeZone,
          threeUp: finish === "phone" && threeUp,
          finish,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setPicked(data.prints || []);
      setMsg(data.threeUp ? "Pick a keeper from the three." : "Printed.");
      await loadMe(userId);
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  const share = async (p: Print) => {
    const url = `https://thievnsden.com/afterimage`;
    const text = `Afterimage · ${p.want || "a lock screen"}\n${url}`;
    try {
      if (navigator.share) await navigator.share({ title: "Afterimage", text, url });
      else {
        await navigator.clipboard.writeText(text);
        setMsg("Copied share text");
      }
    } catch {}
  };

  return (
    <div className="relative overflow-hidden min-h-[calc(100vh-8rem)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="ai-orb ai-orb-a" />
        <div className="ai-orb ai-orb-b" />
        <div className="ai-orb ai-orb-c" />
        <div className="den-grain" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-20">
        <div className="text-center mb-10">
          <p className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full border border-fuchsia-500/30 bg-black/40 text-[10px] uppercase tracking-[0.28em] text-fuchsia-200">
            Afterimage
          </p>
          <h1 className="ai-title text-4xl sm:text-6xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 via-rose-200 to-amber-200">
            Print a lock screen
          </h1>
          <p className="mt-3 text-neutral-300 max-w-lg mx-auto">
            Type what you want. Pick a look. One free preview per account. Phone-ready is the sharp one.
          </p>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_280px] gap-8 items-start">
          <div className="space-y-5">
            <div className="rounded-3xl border border-fuchsia-500/20 bg-black/50 backdrop-blur-md p-5 sm:p-6 space-y-5 shadow-[0_0_80px_-24px_rgba(217,70,239,0.55)]">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-fuchsia-300/80 mb-2">Phone</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {brands.map((b) => (
                    <span key={b} className="text-[11px] text-neutral-500">{b}</span>
                  ))}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {PHONES.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPhoneId(p.id)}
                      className={`shrink-0 px-3 py-2 rounded-xl border text-xs ${
                        phoneId === p.id
                          ? "border-fuchsia-400/60 bg-fuchsia-950/40 text-white"
                          : "border-neutral-800 text-neutral-400"
                      }`}
                    >
                      {p.brand} {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-rose-300/80 mb-2">Look</p>
                <input
                  value={styleSearch}
                  onChange={(e) => setStyleSearch(e.target.value)}
                  placeholder="Search a vibe — Shinkai, oil paint, goth club…"
                  className="w-full mb-3 px-4 py-3 rounded-2xl bg-[#0b0b0b] border border-neutral-800 text-sm"
                />
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {LOOKS.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setStyleId(l.id)}
                      className={`rounded-2xl border px-2 py-3 text-left ai-chip ${
                        styleId === l.id
                          ? "border-amber-300/50 bg-gradient-to-br from-fuchsia-900/50 to-amber-900/20"
                          : "border-neutral-800"
                      }`}
                    >
                      <div className="text-xs font-medium text-neutral-100">{l.label}</div>
                      <div className="text-[10px] text-neutral-500">{l.hint}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                {HEATS.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setHeat(h.id)}
                    className={`flex-1 py-2.5 rounded-xl border text-sm ${
                      heat === h.id ? "border-rose-400/50 text-rose-100 bg-rose-950/30" : "border-neutral-800 text-neutral-400"
                    }`}
                  >
                    {h.label}
                  </button>
                ))}
              </div>

              <textarea
                value={want}
                onChange={(e) => setWant(e.target.value)}
                rows={3}
                placeholder="A girl on a rainy rooftop looking back at you…"
                className="w-full px-4 py-3 rounded-2xl bg-[#0b0b0b] border border-neutral-800 text-sm"
              />

              <button type="button" onClick={() => setMore((v) => !v)} className="text-xs text-neutral-500">
                {more ? "Hide extras" : "More options"}
              </button>
              {more && (
                <div className="grid sm:grid-cols-2 gap-3">
                  <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="px-3 py-2 rounded-xl bg-[#0b0b0b] border border-neutral-800 text-sm" />
                  <input value={clothes} onChange={(e) => setClothes(e.target.value)} placeholder="Clothes" className="px-3 py-2 rounded-xl bg-[#0b0b0b] border border-neutral-800 text-sm" />
                  <select value={lighting} onChange={(e) => setLighting(e.target.value)} className="px-3 py-2 rounded-xl bg-[#0b0b0b] border border-neutral-800 text-sm">
                    {LIGHTS.map((l) => <option key={l}>{l}</option>)}
                  </select>
                  <select value={place} onChange={(e) => setPlace(e.target.value)} className="px-3 py-2 rounded-xl bg-[#0b0b0b] border border-neutral-800 text-sm">
                    {PLACES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                  <input value={overlay} onChange={(e) => setOverlay(e.target.value)} placeholder="Tiny words in the art" className="sm:col-span-2 px-3 py-2 rounded-xl bg-[#0b0b0b] border border-neutral-800 text-sm" />
                  <label className="flex items-center gap-2 text-sm text-neutral-400">
                    <input type="checkbox" checked={safeZone} onChange={(e) => setSafeZone(e.target.checked)} />
                    Leave room for the clock
                  </label>
                  <label className="flex items-center gap-2 text-sm text-neutral-400">
                    <input type="checkbox" checked={threeUp} onChange={(e) => setThreeUp(e.target.checked)} />
                    3 versions (3 credits)
                  </label>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={busy || (!!userId && previewUsed)}
                  onClick={() => print("preview")}
                  className="py-3.5 rounded-2xl border border-neutral-700 text-sm font-medium disabled:opacity-40"
                >
                  {previewUsed ? "Preview used" : "Free preview"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => print("phone")}
                  className="py-3.5 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-rose-500 to-amber-400 text-black font-semibold disabled:opacity-50 ai-print"
                >
                  Phone-ready{threeUp ? " ×3" : ""}
                </button>
              </div>
              {!userId && (
                <p className="text-xs text-neutral-500">
                  <Link href="/join" className="text-fuchsia-300">Join</Link> or <Link href="/login" className="text-fuchsia-300">log in</Link> to print.
                </p>
              )}
              {userId && (
                <p className="text-xs text-neutral-500">Credits {credits} · Preview {previewUsed ? "spent" : "ready"}</p>
              )}
              {msg && <p className="text-sm text-amber-100">{msg}</p>}
            </div>

            {picked.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {picked.map((p) => (
                  <div key={p.id} className="ai-card rounded-2xl overflow-hidden border border-fuchsia-500/30 bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image_url} alt="" className="w-full aspect-[9/16] object-cover" />
                    <div className="p-2 flex justify-between text-[10px]">
                      <a href={p.image_url} download className="text-amber-200">Save</a>
                      <button type="button" onClick={() => share(p)} className="text-fuchsia-300">Share</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="hidden lg:block">
            <div className="ai-phone mx-auto">
              <div className="ai-phone-notch" />
              {picked[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={picked[0].image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-b from-fuchsia-700/40 via-transparent to-amber-700/30" />
              )}
              <div className="absolute top-10 left-0 right-0 text-center text-white/80 text-xs tracking-[0.3em]">9:41</div>
            </div>
            <p className="text-center text-[11px] text-neutral-500 mt-3">{phone.brand} {phone.name}</p>
          </div>
        </div>

        <section className="mt-16">
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-200 to-amber-200">The board</h2>
            <p className="text-xs text-neutral-500">Scroll sideways</p>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
            {board.length === 0 && (
              <p className="text-sm text-neutral-500">Nothing public yet. Admin can print the first walls.</p>
            )}
            {board.map((p) => (
              <div key={p.id} className="ai-card snap-start shrink-0 w-[160px] rounded-2xl overflow-hidden border border-white/10 bg-black/60">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image_url} alt="" className="w-full aspect-[9/16] object-cover" />
                <p className="p-2 text-[10px] text-neutral-400 line-clamp-2">{p.want || p.style_id}</p>
              </div>
            ))}
          </div>
        </section>

        {mine.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-semibold mb-4">Yours</h2>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {mine.map((p) => (
                <div key={p.id} className="shrink-0 w-[140px] rounded-2xl overflow-hidden border border-neutral-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image_url} alt="" className="w-full aspect-[9/16] object-cover" />
                  <div className="p-2 flex justify-between text-[10px] text-neutral-500">
                    <span>{p.finish}</span>
                    <a href={p.image_url} download>Save</a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
