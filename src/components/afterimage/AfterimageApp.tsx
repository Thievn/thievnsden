"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { HEATS, LIGHTS, LOOKS, PHONES, PLACES, POSES, SERIES, phoneById } from "@/lib/afterimage";
import { runPrintJob } from "@/lib/afterimage-print";
import { AfterimageBoard } from "@/components/afterimage/AfterimageBoard";
import { AfterimagePeek, PeekThumb } from "@/components/afterimage/AfterimagePeek";
import { isAdmin } from "@/lib/admin";

type Print = {
  id: string;
  image_url: string;
  want?: string;
  style_id?: string;
  username?: string;
};

export function AfterimageApp() {
  const [userId, setUserId] = useState<string | null>(null);
  const [admin, setAdmin] = useState(false);
  const [want, setWant] = useState("");
  const [styleId, setStyleId] = useState("anime");
  const [styleSearch, setStyleSearch] = useState("");
  const [series, setSeries] = useState("One Piece");
  const [pose, setPose] = useState(POSES[0]);
  const [heat, setHeat] = useState("flirty");
  const [phoneId, setPhoneId] = useState("classic");
  const [more, setMore] = useState(false);
  const [subject, setSubject] = useState("");
  const [clothes, setClothes] = useState("");
  const [lighting, setLighting] = useState("neon night");
  const [place, setPlace] = useState("city rooftop");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [board, setBoard] = useState<Print[]>([]);
  const [mine, setMine] = useState<Print[]>([]);
  const [picked, setPicked] = useState<Print[]>([]);
  const [peek, setPeek] = useState<string | null>(null);
  const [saveAs, setSaveAs] = useState("");

  const phone = useMemo(() => phoneById(phoneId), [phoneId]);
  const animeLook = ["anime", "90s-cel", "manhwa", "manga"].includes(styleId);

  useEffect(() => {
    fetch("/api/afterimage/board")
      .then((r) => r.json())
      .then((d) => setBoard(d.prints || []))
      .catch(() => {});
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user;
      setUserId(user?.id || null);
      setAdmin(isAdmin(user));
      if (user?.id) {
        fetch(`/api/afterimage/me?userId=${user.id}`)
          .then((r) => r.json())
          .then((d) => setMine(d.prints || []))
          .catch(() => {});
      }
    });
  }, []);

  const print = async () => {
    if (!admin) {
      setMsg("Coming soon. You can look around.");
      return;
    }
    if (!userId) return;
    setBusy(true);
    setMsg("Printing… stay on this page.");
    try {
      const res = await fetch("/api/afterimage/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          want,
          styleId,
          styleSearch,
          series: animeLook ? series : "",
          pose,
          heat,
          phoneId,
          subject,
          clothes,
          lighting,
          place,
          finish: "print",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Print failed");
      const done = await runPrintJob(data.jobId);
      const rows = done.prints || (done.image_url ? [{ id: done.print_id, image_url: done.image_url }] : []);
      setPicked(rows);
      setMsg("Printed.");
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  const download = (url: string) => {
    const name = (saveAs || "afterimage").replace(/[^a-z0-9-_ ]/gi, "").slice(0, 40) || "afterimage";
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}.jpg`;
    a.click();
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
          <p className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full border border-fuchsia-500/30 bg-black/40 text-[10px] uppercase tracking-[0.28em] text-fuchsia-200">Afterimage</p>
          <h1 className="ai-title text-4xl sm:text-6xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 via-rose-200 to-amber-200">Print a wallpaper</h1>
          <p className="mt-3 text-neutral-300 max-w-lg mx-auto">
            {admin ? "Your press. Public print is closed while this gets sharp." : "Coming soon. Peek the board. The maker is here so you can see what’s coming."}
          </p>
        </div>
        <div className="grid lg:grid-cols-[minmax(0,1fr)_280px] gap-8 items-start">
          <div className="space-y-5">
            <div className="rounded-3xl border border-fuchsia-500/20 bg-black/50 backdrop-blur-md p-5 sm:p-6 space-y-5 shadow-[0_0_80px_-24px_rgba(217,70,239,0.55)]">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-fuchsia-300/80 mb-2">Size</p>
                <div className="flex gap-2">
                  {PHONES.map((p) => (
                    <button key={p.id} type="button" onClick={() => setPhoneId(p.id)} className={`flex-1 px-3 py-2 rounded-xl border text-xs ${
                      phoneId === p.id ? "border-fuchsia-400/60 bg-fuchsia-950/40 text-white" : "border-neutral-800 text-neutral-400"
                    }`}>{p.name}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-rose-300/80 mb-2">Look</p>
                <input value={styleSearch} onChange={(e) => setStyleSearch(e.target.value)} placeholder="Vibe search" className="w-full mb-3 px-4 py-3 rounded-2xl bg-[#0b0b0b] border border-neutral-800 text-sm" />
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {LOOKS.map((l) => (
                    <button key={l.id} type="button" onClick={() => setStyleId(l.id)} className={`rounded-2xl border px-2 py-3 text-left ai-chip ${
                      styleId === l.id ? "border-amber-300/50 bg-gradient-to-br from-fuchsia-900/50 to-amber-900/20" : "border-neutral-800"
                    }`}>
                      <div className="text-xs font-medium text-neutral-100">{l.label}</div>
                      <div className="text-[10px] text-neutral-500">{l.hint}</div>
                    </button>
                  ))}
                </div>
              </div>
              {animeLook && (
                <div className="flex flex-wrap gap-2">
                  {SERIES.map((s) => (
                    <button key={s} type="button" onClick={() => setSeries(s)} className={`px-3 py-1.5 rounded-full border text-xs ${
                      series === s ? "border-fuchsia-400/50 text-white" : "border-neutral-800 text-neutral-500"
                    }`}>{s}</button>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {POSES.map((p) => (
                  <button key={p} type="button" onClick={() => setPose(p)} className={`px-3 py-1.5 rounded-full border text-[11px] ${
                    pose === p ? "border-rose-400/40 text-rose-100" : "border-neutral-800 text-neutral-500"
                  }`}>{p}</button>
                ))}
              </div>
              <div className="flex gap-2">
                {HEATS.map((h) => (
                  <button key={h.id} type="button" onClick={() => setHeat(h.id)} className={`flex-1 py-2.5 rounded-xl border text-sm ${
                    heat === h.id ? "border-rose-400/50 text-rose-100 bg-rose-950/30" : "border-neutral-800 text-neutral-400"
                  }`}>{h.label}</button>
                ))}
              </div>
              <textarea value={want} onChange={(e) => setWant(e.target.value)} rows={3} placeholder="Nami on a rainy rooftop…" className="w-full px-4 py-3 rounded-2xl bg-[#0b0b0b] border border-neutral-800 text-sm" />
              <button type="button" onClick={() => setMore((v) => !v)} className="text-xs text-neutral-500">{more ? "Hide extras" : "More options"}</button>
              {more && (
                <div className="grid sm:grid-cols-2 gap-3">
                  <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="px-3 py-2 rounded-xl bg-[#0b0b0b] border border-neutral-800 text-sm" />
                  <input value={clothes} onChange={(e) => setClothes(e.target.value)} placeholder="Clothes" className="px-3 py-2 rounded-xl bg-[#0b0b0b] border border-neutral-800 text-sm" />
                  <select value={lighting} onChange={(e) => setLighting(e.target.value)} className="px-3 py-2 rounded-xl bg-[#0b0b0b] border border-neutral-800 text-sm">{LIGHTS.map((l) => <option key={l}>{l}</option>)}</select>
                  <select value={place} onChange={(e) => setPlace(e.target.value)} className="px-3 py-2 rounded-xl bg-[#0b0b0b] border border-neutral-800 text-sm">{PLACES.map((p) => <option key={p}>{p}</option>)}</select>
                </div>
              )}
              <button type="button" disabled={busy || !admin} onClick={print} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-rose-500 to-amber-400 text-black font-semibold disabled:opacity-50 ai-print">
                {admin ? (busy ? "Printing…" : "Print wallpaper") : "Coming soon"}
              </button>
              {!admin && <p className="text-xs text-neutral-500">Board below is live. Printing opens later.</p>}
              {msg && <p className="text-sm text-amber-100">{msg}</p>}
            </div>
            {picked.length > 0 && (
              <div className="space-y-3">
                <input value={saveAs} onChange={(e) => setSaveAs(e.target.value)} placeholder="Name before save" className="w-full px-3 py-2 rounded-xl bg-[#0b0b0b] border border-neutral-800 text-sm" />
                <div className="grid grid-cols-3 gap-3">
                  {picked.map((p) => (
                    <div key={p.id} className="ai-card rounded-2xl overflow-hidden border border-fuchsia-500/30 bg-black">
                      <PeekThumb src={p.image_url} onOpen={() => setPeek(p.image_url)} imgClass="w-full aspect-[9/16] object-cover" />
                      <button type="button" onClick={() => download(p.image_url)} className="w-full py-2 text-[11px] text-amber-200">Save</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="hidden lg:block">
            <button type="button" disabled={!picked[0]} onClick={() => picked[0] && setPeek(picked[0].image_url)} className={`ai-phone mx-auto block ${picked[0] ? "ai-peek" : ""}`}>
              <div className="ai-phone-notch" />
              {picked[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={picked[0].image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-b from-fuchsia-700/40 via-transparent to-amber-700/30" />
              )}
              {picked[0] && <span className="ai-peek-glow" />}
            </button>
            <p className="text-center text-[11px] text-neutral-500 mt-3">Preview</p>
          </div>
        </div>
        <AfterimageBoard board={board} />
        {mine.length > 0 && admin && (
          <section className="mt-10">
            <h2 className="text-xl font-semibold mb-4">Yours</h2>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {mine.map((p) => (
                <div key={p.id} className="shrink-0 w-[140px] rounded-2xl overflow-hidden border border-neutral-800">
                  <PeekThumb src={p.image_url} onOpen={() => setPeek(p.image_url)} imgClass="w-full aspect-[9/16] object-cover" />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
      <AfterimagePeek src={peek} onClose={() => setPeek(null)} />
    </div>
  );
}
