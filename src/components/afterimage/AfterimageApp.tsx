"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { pickOpt, LOOKS } from "@/lib/afterimage";
import { runPrintJob } from "@/lib/afterimage-print";
import { AfterimageBoard } from "@/components/afterimage/AfterimageBoard";
import { AfterimagePeek, PeekThumb } from "@/components/afterimage/AfterimagePeek";
import { AfterimageStudio } from "@/components/afterimage/AfterimageStudio";
import { isAdmin } from "@/lib/admin";
import { DenHero } from "@/components/den/DenHero";
import {
  applyPreset,
  draftToPrintBody,
  EMPTY_DRAFT,
  PRESETS,
  recipeChips,
  surpriseDraft,
  type StudioDraft,
  type StudioPanel,
} from "@/lib/afterimage-presets";

type Print = { id: string; image_url: string; want?: string; style_id?: string; username?: string };

export function AfterimageApp() {
  const [userId, setUserId] = useState<string | null>(null);
  const [admin, setAdmin] = useState(false);
  const [draft, setDraft] = useState<StudioDraft>(EMPTY_DRAFT);
  const [panel, setPanel] = useState<StudioPanel>("look");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [board, setBoard] = useState<Print[]>([]);
  const [mine, setMine] = useState<Print[]>([]);
  const [picked, setPicked] = useState<Print[]>([]);
  const [peek, setPeek] = useState<string | null>(null);
  const [saveAs, setSaveAs] = useState("");
  const [shaking, setShaking] = useState(false);

  const look = pickOpt(LOOKS, draft.styleId);
  const chips = useMemo(() => recipeChips(draft), [draft]);

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
        body: JSON.stringify(draftToPrintBody(draft, userId)),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Print failed");
      const done = await runPrintJob(data.jobId);
      const rows = done.prints || (done.image_url ? [{ id: done.print_id, image_url: done.image_url }] : []);
      setPicked(rows);
      setMsg("Printed.");
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Print failed");
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

  const surprise = () => {
    setShaking(true);
    setDraft((d) => surpriseDraft(d.phoneId));
    setPanel("look");
    setTimeout(() => setShaking(false), 420);
  };

  const printButton = (
    <button
      type="button"
      disabled={busy || !admin}
      onClick={print}
      className="w-full py-3 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-rose-500 to-amber-400 text-black font-semibold disabled:opacity-50 ai-print"
    >
      {admin ? (busy ? "Printing…" : "Print wallpaper") : "Coming soon"}
    </button>
  );

  return (
    <div className="relative overflow-hidden min-h-[calc(100vh-8rem)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="ai-orb ai-orb-a" />
        <div className="ai-orb ai-orb-b" />
        <div className="ai-orb ai-orb-c" />
        <div className="den-grain" />
      </div>
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <DenHero
          tone="fuchsia"
          kicker="Afterimage"
          title="Print a lock screen."
          accent="Tap it into existence."
          body="Start from a vibe, then play. Empty choices stay out of the prompt. Type only if you want something the chips don’t cover."
        />

        <div className="flex flex-wrap items-center gap-2 mb-5">
          <button type="button" onClick={surprise} className={`ai-dice px-4 py-2 rounded-full border border-amber-300/40 bg-amber-950/30 text-[13px] text-amber-100 ${shaking ? "ai-dice-go" : ""}`}>
            Surprise me
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(EMPTY_DRAFT);
              setPanel("look");
            }}
            className="px-4 py-2 rounded-full border border-white/10 text-[13px] text-neutral-400 hover:text-white"
          >
            Start over
          </button>
        </div>

        <div className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500 mb-3">Quick starts</p>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setDraft((d) => applyPreset(d, p));
                  setPanel("look");
                }}
                className={`ai-preset snap-start shrink-0 w-[11.5rem] rounded-2xl border border-white/10 bg-gradient-to-br ${p.wash} p-3 text-left`}
              >
                <span className="text-lg">{p.emoji}</span>
                <span className="mt-1 block text-[13px] font-medium text-white">{p.label}</span>
                <span className="mt-0.5 block text-[11px] text-white/65 leading-snug">{p.blurb}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="max-w-[42rem] mx-auto space-y-4">
            <AfterimageStudio draft={draft} panel={panel} onPanel={setPanel} onDraft={setDraft} />
            <div className="xl:hidden space-y-3">
              {printButton}
              {msg ? <p className="text-sm text-amber-100">{msg}</p> : null}
            </div>
            {picked.length > 0 && (
              <div className="space-y-3">
                <input
                  value={saveAs}
                  onChange={(e) => setSaveAs(e.target.value)}
                  placeholder="Name before save"
                  className="w-full px-3 py-2 rounded-xl bg-[#0b0b0b] border border-neutral-800 text-sm"
                />
                <div className="grid grid-cols-3 gap-3">
                  {picked.map((p) => (
                    <div key={p.id} className="ai-card rounded-2xl overflow-hidden border border-fuchsia-500/30 bg-black">
                      <PeekThumb src={p.image_url} onOpen={() => setPeek(p.image_url)} imgClass="w-full aspect-[9/16] object-cover" />
                      <button type="button" onClick={() => download(p.image_url)} className="w-full py-2 text-[11px] text-amber-200">
                        Save
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <aside className="hidden xl:flex flex-col items-center absolute top-0 right-0 w-[220px] space-y-4">
            <button
              type="button"
              disabled={!picked[0]}
              onClick={() => picked[0] && setPeek(picked[0].image_url)}
              className={`ai-phone mx-auto block ${picked[0] ? "ai-peek" : ""}`}
            >
              <div className="ai-phone-notch" />
              {picked[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={picked[0].image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${look?.wash || "from-fuchsia-700/30 to-amber-700/20"}`}>
                  <div className="absolute inset-x-4 bottom-8 text-left">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Preview</p>
                    <p className="text-sm font-medium text-white mt-1">{look?.label || "Photo"}</p>
                    <p className="text-[11px] text-white/60 mt-1 line-clamp-3">
                      {chips.slice(1, 5).map((c) => c.label).join(" · ") || "Tap a look to start"}
                    </p>
                  </div>
                </div>
              )}
              {picked[0] && <span className="ai-peek-glow" />}
            </button>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {chips.slice(0, 10).map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setPanel(c.panel)}
                  className="px-2 py-0.5 rounded-full bg-fuchsia-950/40 border border-fuchsia-900/40 text-[10px] text-fuchsia-100"
                >
                  {c.label}
                </button>
              ))}
            </div>
            {printButton}
            {msg ? <p className="text-sm text-amber-100 text-center">{msg}</p> : null}
          </aside>
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
