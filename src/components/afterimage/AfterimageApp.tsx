"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  AGES, BODIES, ETHNICITIES, EYES, HAIRS, HEATS, HEIGHTS, LIGHTS, LOOKS,
  PHONES, PLACES, POSES, WARDROBES, WHOS, WORLDS,
} from "@/lib/afterimage";
import { runPrintJob } from "@/lib/afterimage-print";
import { AfterimageBoard } from "@/components/afterimage/AfterimageBoard";
import { AfterimagePeek, PeekThumb } from "@/components/afterimage/AfterimagePeek";
import { CatalogPick } from "@/components/afterimage/CatalogPick";
import { SearchSelect } from "@/components/afterimage/SearchSelect";
import { isAdmin } from "@/lib/admin";

type Print = { id: string; image_url: string; want?: string; style_id?: string; username?: string };

export function AfterimageApp() {
  const [userId, setUserId] = useState<string | null>(null);
  const [admin, setAdmin] = useState(false);
  const [phoneId, setPhoneId] = useState("classic");
  const [styleId, setStyleId] = useState("photo");
  const [styleSearch, setStyleSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [want, setWant] = useState("");
  const [series, setSeries] = useState("");
  const [seriesSlug, setSeriesSlug] = useState("");
  const [who, setWho] = useState("woman");
  const [age, setAge] = useState("21-24");
  const [ethnicity, setEthnicity] = useState("");
  const [body, setBody] = useState("");
  const [height, setHeight] = useState("");
  const [hair, setHair] = useState("");
  const [eyes, setEyes] = useState("");
  const [clothes, setClothes] = useState("");
  const [pose, setPose] = useState("");
  const [world, setWorld] = useState("");
  const [place, setPlace] = useState("");
  const [lighting, setLighting] = useState("");
  const [heat, setHeat] = useState("flirty");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [board, setBoard] = useState<Print[]>([]);
  const [mine, setMine] = useState<Print[]>([]);
  const [picked, setPicked] = useState<Print[]>([]);
  const [peek, setPeek] = useState<string | null>(null);
  const [saveAs, setSaveAs] = useState("");

  const animeLook = ["anime", "90s-cel", "manhwa", "manga"].includes(styleId);

  useEffect(() => {
    fetch("/api/afterimage/board").then((r) => r.json()).then((d) => setBoard(d.prints || [])).catch(() => {});
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user;
      setUserId(user?.id || null);
      setAdmin(isAdmin(user));
      if (user?.id) {
        fetch(`/api/afterimage/me?userId=${user.id}`).then((r) => r.json()).then((d) => setMine(d.prints || [])).catch(() => {});
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
          userId, want, styleId, styleSearch, series: animeLook ? series : "",
          pose, heat, phoneId, subject, clothes, lighting, place,
          who, age, ethnicity, body, height, hair, eyes, world, finish: "print",
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

  const recipe = [
    LOOKS.find((x) => x.id === styleId)?.label,
    WHOS.find((x) => x.id === who)?.label,
    world && WORLDS.find((x) => x.id === world)?.label,
    place && PLACES.find((x) => x.id === place)?.label,
    heat && HEATS.find((x) => x.id === heat)?.label,
  ].filter(Boolean);

  return (
    <div className="relative overflow-hidden min-h-[calc(100vh-8rem)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="ai-orb ai-orb-a" />
        <div className="ai-orb ai-orb-b" />
        <div className="ai-orb ai-orb-c" />
        <div className="den-grain" />
      </div>
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-20">
        <div className="text-center mb-8">
          <p className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full border border-fuchsia-500/30 bg-black/40 text-[10px] uppercase tracking-[0.28em] text-fuchsia-200">Afterimage</p>
          <h1 className="ai-title text-4xl sm:text-6xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 via-rose-200 to-amber-200">Print a wallpaper</h1>
          <p className="mt-3 text-neutral-400 max-w-lg mx-auto text-sm">Pick the shot. Empty menus stay out of the prompt. Nothing sneaks in a rooftop.</p>
        </div>
        <div className="grid lg:grid-cols-[minmax(0,1fr)_260px] gap-8 items-start">
          <div className="space-y-4">
            <div className="rounded-3xl border border-fuchsia-500/20 bg-black/55 backdrop-blur-md p-4 sm:p-5 space-y-4 shadow-[0_0_80px_-24px_rgba(217,70,239,0.55)]">
              <div className="flex gap-2">
                {PHONES.map((p) => (
                  <button key={p.id} type="button" onClick={() => setPhoneId(p.id)} className={`flex-1 px-2 py-1.5 rounded-lg border text-[11px] ${
                    phoneId === p.id ? "border-fuchsia-400/60 bg-fuchsia-950/40 text-white" : "border-neutral-800 text-neutral-500"
                  }`}>{p.name}</button>
                ))}
              </div>

              <SearchSelect label="Look" hint="How the picture is drawn. Photo = real camera." value={styleId} options={LOOKS} allowEmpty={false} onChange={setStyleId} />

              <label className="block space-y-1">
                <span className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">Who they are</span>
                <span className="block text-[11px] text-neutral-600">Face, hair, attitude. Not the location.</span>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Red pigtails, freckles, smirk" className="w-full px-3 py-2 rounded-xl bg-[#0b0b0b] border border-neutral-800 text-sm" />
              </label>

              <label className="block space-y-1">
                <span className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">What they’re doing</span>
                <span className="block text-[11px] text-neutral-600">Action only. Daggers, sitting, rain. Place goes in Place below.</span>
                <textarea value={want} onChange={(e) => setWant(e.target.value)} rows={2} placeholder="Holding two daggers" className="w-full px-3 py-2 rounded-xl bg-[#0b0b0b] border border-neutral-800 text-sm" />
              </label>

              {animeLook && (
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 mb-1">Series</p>
                    <p className="text-[11px] text-neutral-600 mb-1">Type a show if you want that design language.</p>
                    <CatalogPick kind="series" value={series} placeholder="Type an anime" onPick={(r) => { setSeries(r.label); setSeriesSlug(r.slug); }} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 mb-1">Character</p>
                    <p className="text-[11px] text-neutral-600 mb-1">Optional. Loads after a series.</p>
                    <CatalogPick kind="character" parent={seriesSlug} value={subject} placeholder="Type a name" onPick={(r) => setSubject(r.label)} />
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-3">
                <SearchSelect label="Who" value={who} options={WHOS} allowEmpty={false} onChange={setWho} />
                <SearchSelect label="Age look" hint="Adult bands only." value={age} options={AGES} onChange={setAge} />
                <SearchSelect label="Ethnicity" value={ethnicity} options={ETHNICITIES} onChange={setEthnicity} />
                <SearchSelect label="Body" value={body} options={BODIES} onChange={setBody} />
                <SearchSelect label="Height" value={height} options={HEIGHTS} onChange={setHeight} />
                <SearchSelect label="Hair" value={hair} options={HAIRS} onChange={setHair} />
                <SearchSelect label="Eyes" value={eyes} options={EYES} onChange={setEyes} />
                <SearchSelect label="Clothes" value={clothes} options={WARDROBES} onChange={setClothes} />
                <SearchSelect label="Pose" value={pose} options={POSES} onChange={setPose} />
                <SearchSelect label="World" hint="Leave empty unless you want a setting. Cyber is the only neon city." value={world} options={WORLDS} onChange={setWorld} />
                <SearchSelect label="Place" hint="Empty = no location baked in." value={place} options={PLACES} onChange={setPlace} />
                <SearchSelect label="Light" value={lighting} options={LIGHTS} onChange={setLighting} />
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 mb-2">Heat</p>
                <div className="flex flex-wrap gap-2">
                  {HEATS.map((h) => (
                    <button key={h.id} type="button" onClick={() => setHeat(h.id)} className={`px-3 py-1.5 rounded-full border text-[11px] ${
                      heat === h.id ? "border-rose-400/50 text-rose-100 bg-rose-950/30" : "border-neutral-800 text-neutral-500"
                    }`}>{h.label}</button>
                  ))}
                </div>
              </div>

              <label className="block space-y-1">
                <span className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">Art note</span>
                <span className="block text-[11px] text-neutral-600">Optional camera/style only. Grain, lens, color. Do not describe the person here.</span>
                <input value={styleSearch} onChange={(e) => setStyleSearch(e.target.value)} placeholder="35mm, wet streets, rim light" className="w-full px-3 py-2 rounded-xl bg-[#0b0b0b] border border-neutral-800 text-sm" />
              </label>

              {recipe.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {recipe.map((r) => (
                    <span key={r} className="px-2 py-0.5 rounded-full bg-fuchsia-950/40 border border-fuchsia-900/40 text-[10px] text-fuchsia-100">{r}</span>
                  ))}
                </div>
              )}

              <button type="button" disabled={busy || !admin} onClick={print} className="w-full py-3 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-rose-500 to-amber-400 text-black font-semibold disabled:opacity-50 ai-print">
                {admin ? (busy ? "Printing…" : "Print wallpaper") : "Coming soon"}
              </button>
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
          <div className="hidden lg:block sticky top-24">
            <button type="button" disabled={!picked[0]} onClick={() => picked[0] && setPeek(picked[0].image_url)} className={`ai-phone mx-auto block ${picked[0] ? "ai-peek" : ""}`}>
              <div className="ai-phone-notch" />
              {picked[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={picked[0].image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-b from-fuchsia-700/30 via-transparent to-amber-700/20" />
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
