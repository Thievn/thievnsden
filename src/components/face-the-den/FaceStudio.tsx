"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import {
  ANGLES,
  FILTHY_MODES,
  FOCUSES,
  HEATS,
  INTENSITIES,
  LENGTHS,
  PRESETS,
  STYLES,
  TARGETS,
  applyPreset,
  getRarity,
  needsFilth,
  recipeChips,
  surpriseDraft,
  type Heat,
  type RoastDraft,
  type Stage,
  type Style,
} from "@/lib/face-the-den";
import { DenChips, DenField } from "@/components/face-the-den/DenChips";
import { RarityFrame } from "@/components/RarityFrame";

type Panel = "voice" | "heat" | "target";

const PANELS: { id: Panel; label: string }[] = [
  { id: "voice", label: "Voice" },
  { id: "heat", label: "Heat" },
  { id: "target", label: "Target" },
];

const LOGIN = "/login?next=/playground/face-the-den";
const JOIN = "/join?next=/playground/face-the-den";

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function toDataUrl(src: string): Promise<string> {
  if (src.startsWith("data:")) return src;
  const response = await fetch(src);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 1024;
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(result);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => resolve(result);
      img.src = result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function FaceStudio({
  userId,
  draft,
  onDraft,
}: {
  userId: string | null;
  draft: RoastDraft;
  onDraft: (next: RoastDraft | ((prev: RoastDraft) => RoastDraft)) => void;
}) {
  const [stage, setStage] = useState<Stage>("idle");
  const [panel, setPanel] = useState<Panel>("voice");
  const [image, setImage] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [previous, setPrevious] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [saving, setSaving] = useState<"private" | "public" | null>(null);
  const [saved, setSaved] = useState<"private" | "public" | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shaking, setShaking] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraActive]);

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const set = <K extends keyof RoastDraft>(key: K, value: RoastDraft[K]) => {
    onDraft((d) => ({ ...d, [key]: value }));
  };

  const locked = !userId;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(URL.createObjectURL(file));
    setStage("setup");
    setVerdict(null);
    setScore(null);
    setPrevious([]);
    setError(null);
    setSaved(null);
    setSavedId(null);
  };

  const startCamera = async () => {
    if (locked) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
    } catch {
      setError("Camera access denied or unavailable.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  };

  const captureSelfie = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    setImage(canvas.toDataURL("image/jpeg", 0.85));
    stopCamera();
    setStage("setup");
    setVerdict(null);
    setScore(null);
    setPrevious([]);
    setError(null);
    setSaved(null);
    setSavedId(null);
  };

  const judge = async (isFollowUp = false) => {
    if (!image || locked) return;
    setLoading(true);
    setError(null);
    setStage("judging");
    setSaved(null);
    setSavedId(null);
    try {
      const dataUrl = await toDataUrl(image);
      const res = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({
          ...draft,
          filthyMode: needsFilth(draft) ? draft.filthyMode : undefined,
          followUp: isFollowUp,
          previous: isFollowUp ? previous : [],
          image: dataUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setVerdict(data.verdict);
      setScore(data.score);
      setPrevious((p) => [...p, data.verdict]);
      setStage("result");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "The Den did not answer. Try again.");
      setStage("setup");
    } finally {
      setLoading(false);
    }
  };

  const saveJudgment = async (isPublic: boolean) => {
    if (!verdict || score === null || !userId || !image) return;
    const rarity = getRarity(score);
    setSaving(isPublic ? "public" : "private");
    try {
      const dataUrl = await toDataUrl(image);
      const up = await fetch("/api/face-the-den/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ image: dataUrl }),
      });
      const uploaded = await up.json();
      if (!up.ok) throw new Error(uploaded.error || "Could not store the photo.");

      const res = await fetch("/api/judgments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          style: draft.style,
          focus: draft.focus,
          filthyMode: needsFilth(draft) ? draft.filthyMode : null,
          score,
          rarity: rarity.name,
          verdict,
          isPublic,
          userId,
          imageUrl: uploaded.url,
          intensity: draft.intensity,
          roastLength: draft.length,
          heat: draft.heat,
          angle: draft.angle,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSaved(isPublic ? "public" : "private");
      setSavedId(data.judgment?.id || null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(null);
    }
  };

  const reset = () => {
    setImage(null);
    setStage("idle");
    setVerdict(null);
    setScore(null);
    setPrevious([]);
    setError(null);
    setSaved(null);
    setSavedId(null);
    stopCamera();
    if (fileRef.current) fileRef.current.value = "";
  };

  const surprise = () => {
    setShaking(true);
    onDraft((d) => surpriseDraft({ target: d.target }));
    setPanel("voice");
    setTimeout(() => setShaking(false), 420);
  };

  const copyVerdict = async () => {
    if (!verdict) return;
    try {
      await navigator.clipboard.writeText(verdict);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      prompt("Copy roast:", verdict);
    }
  };

  const rarity = score !== null ? getRarity(score) : null;
  const chips = recipeChips(draft);
  const showFilth = needsFilth(draft);

  return (
    <div className="ftd-studio grid grid-cols-1 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] gap-5 lg:gap-7 items-start">
      <div className={`relative w-full min-w-0 rounded-[1.6rem] p-[1px] ${stage === "judging" ? "den-panel-judging" : "den-panel"}`}>
        <div className="absolute inset-0 rounded-[1.6rem] den-border-glow opacity-55" />
        <div className="relative rounded-[1.55rem] bg-[#0d0d0d]/95 overflow-hidden border border-neutral-800/70 min-h-[380px] sm:min-h-[420px] flex flex-col">
          {locked && !cameraActive && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0a0708]/88 backdrop-blur-[2px] p-5 sm:p-6 text-center">
              <p className="text-sm font-medium text-neutral-100">The Den wants a face.</p>
              <p className="text-[12px] text-neutral-500 mt-2 max-w-xs leading-relaxed">
                Drop a photo, pick a voice, get notes. Then Mark who stays and Cut who doesn't.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Link href={LOGIN} className="ftd-tap px-4 py-2.5 rounded-xl bg-gradient-to-b from-red-700 via-red-800 to-purple-900 text-white text-sm font-medium">
                  Log in
                </Link>
                <Link href={JOIN} className="ftd-tap px-4 py-2.5 rounded-xl border border-white/15 text-neutral-200 text-sm">
                  Join
                </Link>
              </div>
            </div>
          )}

          {cameraActive && (
            <div className="p-4 sm:p-5 flex-1">
              <div className="relative aspect-square rounded-2xl overflow-hidden border border-neutral-800 bg-black">
                <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
              </div>
              <div className="flex flex-wrap gap-3 mt-4 justify-center">
                <button type="button" onClick={captureSelfie} className="ftd-tap px-6 py-3 rounded-xl bg-gradient-to-b from-red-700 via-red-800 to-purple-900 text-white text-sm font-medium">
                  Capture
                </button>
                <button type="button" onClick={stopCamera} className="ftd-tap px-6 py-3 rounded-xl border border-neutral-700 text-neutral-400 text-sm">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!cameraActive && (stage === "idle" || !image) && (
            <div className="p-4 sm:p-6 flex-1 flex flex-col min-w-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 min-w-0">
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => fileRef.current?.click()}
                  className="ftd-drop ftd-tap group flex flex-col items-center justify-center gap-2 min-h-[132px] sm:min-h-[150px] w-full min-w-0 p-4 rounded-2xl border border-dashed border-neutral-700 hover:border-red-800/60 hover:bg-red-950/15 disabled:opacity-40"
                >
                  <span className="ftd-drop-icon w-10 h-10 rounded-full border border-neutral-700 group-hover:border-red-800/50 flex items-center justify-center text-neutral-500 group-hover:text-red-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <span className="text-sm text-neutral-200 font-semibold">Drop a photo</span>
                  <span className="text-[11px] text-neutral-600">From your library</span>
                </button>
                <button
                  type="button"
                  disabled={locked}
                  onClick={startCamera}
                  className="ftd-drop ftd-tap group flex flex-col items-center justify-center gap-2 min-h-[132px] sm:min-h-[150px] w-full min-w-0 p-4 rounded-2xl border border-dashed border-neutral-700 hover:border-purple-800/60 hover:bg-purple-950/15 disabled:opacity-40 ftd-delay-2"
                >
                  <span className="ftd-drop-icon w-10 h-10 rounded-full border border-neutral-700 group-hover:border-purple-800/50 flex items-center justify-center text-neutral-500 group-hover:text-purple-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </span>
                  <span className="text-sm text-neutral-200 font-semibold">Take a selfie</span>
                  <span className="text-[11px] text-neutral-600">Use the camera</span>
                </button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
              <div className="mt-4 sm:mt-5 grid grid-cols-3 gap-1.5 sm:gap-2 min-w-0">
                {[
                  { n: "1", t: "Photo", d: "Drop or shoot" },
                  { n: "2", t: "Voice", d: "How it talks" },
                  { n: "3", t: "Face it", d: "Read + climb" },
                ].map((s, i) => (
                  <div
                    key={s.n}
                    className={`ftd-pop min-w-0 rounded-xl border border-neutral-800/80 bg-black/40 px-1.5 sm:px-2 py-3 text-center ${
                      i === 1 ? "ftd-delay-3" : i === 2 ? "ftd-delay-4" : "ftd-delay-2"
                    }`}
                  >
                    <div className="text-[11px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400">{s.n}</div>
                    <div className="text-[11px] sm:text-xs font-medium text-neutral-200">{s.t}</div>
                    <div className="text-[9px] sm:text-[10px] text-neutral-600 mt-0.5 leading-tight">{s.d}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!cameraActive && stage === "setup" && image && (
            <div className="p-4 sm:p-5 flex-1 flex flex-col">
              <div className="relative aspect-[4/5] max-h-[380px] mx-auto w-full rounded-2xl overflow-hidden border border-neutral-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="" className="w-full h-full object-cover object-[center_20%]" />
              </div>
              {error ? <p className="text-center text-sm text-red-400 mt-3">{error}</p> : null}
              <button
                type="button"
                onClick={() => judge(false)}
                disabled={loading || locked}
                className="ftd-tap mt-4 w-full py-3.5 rounded-2xl bg-gradient-to-b from-red-700 via-red-800 to-purple-900 text-white font-semibold text-sm disabled:opacity-60 shadow-[0_0_32px_-8px_rgba(244,63,94,0.65)]"
              >
                Face The Den
              </button>
              <button type="button" onClick={reset} className="mt-2 w-full py-2 text-xs text-neutral-600">
                Different photo
              </button>
            </div>
          )}

          {stage === "judging" && image && (
            <div className="p-4 sm:p-5 flex-1">
              <div className="relative aspect-[4/5] max-h-[420px] mx-auto w-full rounded-2xl overflow-hidden border border-rose-800/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="" className="w-full h-full object-cover object-[center_20%] ftd-scan-glow" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/40" />
                <div className="ftd-scan" />
                <p className="absolute inset-x-0 bottom-5 text-center text-sm text-rose-100 tracking-wide">The Den is looking…</p>
              </div>
            </div>
          )}

          {stage === "result" && verdict && score !== null && rarity && image && (
            <div className="p-3.5 sm:p-4 flex-1 space-y-3">
              <div className={`rounded-2xl border-2 ${rarity.border} ${rarity.glow} bg-gradient-to-b ${rarity.bg} overflow-hidden`}>
                <div className="flex items-center justify-between px-3 pt-3 pb-2">
                  <span className={`text-[10px] font-semibold uppercase tracking-[0.15em] ${rarity.text}`}>{rarity.name}</span>
                  <span className={`text-sm font-bold tabular-nums ${rarity.text}`}>{score.toFixed(1)}/10</span>
                </div>
                <div className="px-3">
                  <RarityFrame slug={rarity.slug} className="relative aspect-[3/4] w-full rounded-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover object-[center_18%]" />
                  </RarityFrame>
                </div>
                <div className="px-3 pt-2.5 pb-4">
                  <p className="text-[13px] text-neutral-200 leading-relaxed whitespace-pre-wrap">{verdict}</p>
                </div>
                <div className={`h-1 w-full bg-gradient-to-r ${rarity.bar} opacity-80`} />
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                <button type="button" onClick={() => judge(true)} disabled={loading} className="ftd-tap px-3 py-1.5 rounded-lg border border-neutral-800 text-xs text-neutral-300">
                  Go harder
                </button>
                <button type="button" onClick={() => judge(false)} disabled={loading} className="ftd-tap px-3 py-1.5 rounded-lg border border-neutral-800 text-xs text-neutral-300">
                  Reroll
                </button>
                <button type="button" onClick={copyVerdict} className="ftd-tap px-3 py-1.5 rounded-lg border border-neutral-800 text-xs text-neutral-300">
                  {copied ? "Copied" : "Copy roast"}
                </button>
              </div>

              {saved ? (
                <p className="text-center text-sm text-green-400/90">
                  {saved === "public" ? "Posted to the stack" : "Saved private"}
                  {savedId && saved === "public" ? (
                    <>
                      {" · "}
                      <Link href={`/g/${savedId}`} className="underline">
                        Open card
                      </Link>
                    </>
                  ) : (
                    <>
                      {" · "}
                      <Link href="/account/judgments" className="underline">
                        My judgments
                      </Link>
                    </>
                  )}
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => saveJudgment(false)}
                    disabled={!!saving}
                    className="ftd-tap py-2.5 rounded-xl border border-neutral-800 text-neutral-300 text-sm disabled:opacity-60"
                  >
                    {saving === "private" ? "Saving…" : "Keep private"}
                  </button>
                  <button
                    type="button"
                    onClick={() => saveJudgment(true)}
                    disabled={!!saving}
                    className="ftd-tap py-2.5 rounded-xl border border-purple-800/50 text-purple-200 text-sm disabled:opacity-60"
                  >
                    {saving === "public" ? "Posting…" : "Post to stack"}
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStage("setup");
                    setVerdict(null);
                    setScore(null);
                    setSaved(null);
                    setSavedId(null);
                  }}
                  className="ftd-tap flex-1 min-w-0 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 text-sm"
                >
                  Change options
                </button>
                <button type="button" onClick={reset} className="ftd-tap flex-1 min-w-0 py-2.5 rounded-xl text-neutral-500 text-sm">
                  New photo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4 w-full min-w-0">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={surprise}
            className={`ftd-tap px-4 py-2 rounded-full border border-amber-300/40 bg-amber-950/30 text-[13px] text-amber-100 ${shaking ? "ftd-dice-go" : ""}`}
          >
            Surprise me
          </button>
          {PANELS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPanel(p.id)}
              className={`ftd-tap px-3.5 py-2 rounded-full border text-[13px] ${
                panel === p.id
                  ? "border-rose-300/70 bg-rose-950/60 text-white"
                  : "border-white/10 bg-black/30 text-neutral-400 hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="ftd-rail flex gap-3 pb-1 snap-x snap-mandatory">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onDraft((d) => applyPreset(d, p));
                setPanel("voice");
              }}
              className={`ftd-tap snap-start shrink-0 w-[9.5rem] sm:w-[10.5rem] rounded-2xl border border-white/10 bg-gradient-to-br ${p.wash} p-3 text-left`}
            >
              <span className="text-lg">{p.emoji}</span>
              <span className="mt-1 block text-[13px] font-medium text-white">{p.label}</span>
              <span className="mt-0.5 block text-[11px] text-white/65 leading-snug">{p.blurb}</span>
            </button>
          ))}
        </div>

        <div className="rounded-[1.6rem] border border-white/10 bg-black/45 backdrop-blur-sm p-3.5 sm:p-5 space-y-5 ftd-card w-full min-w-0">
          {panel === "voice" && (
            <>
              <DenChips label="Voice" hint="How the Den talks." options={STYLES} value={draft.style} onChange={(id) => set("style", id as Style)} variant="card" />
              <DenChips label="Angle" hint="Roast, hype, or a blade in the compliment." options={ANGLES} value={draft.angle} onChange={(id) => set("angle", id as RoastDraft["angle"])} variant="card" />
              <DenChips label="Intensity" options={INTENSITIES} value={draft.intensity} onChange={(id) => set("intensity", id as RoastDraft["intensity"])} variant="heat" />
            </>
          )}
          {panel === "heat" && (
            <>
              <DenChips label="Heat" hint="From rude to fully filthy." options={HEATS} value={draft.heat} onChange={(id) => set("heat", id as Heat)} variant="heat" />
              {showFilth ? (
                <DenChips label="Filth" options={FILTHY_MODES} value={draft.filthyMode} onChange={(id) => set("filthyMode", id as RoastDraft["filthyMode"])} variant="heat" />
              ) : null}
              <DenChips label="Length" options={LENGTHS} value={draft.length} onChange={(id) => set("length", id as RoastDraft["length"])} variant="heat" />
            </>
          )}
          {panel === "target" && (
            <>
              <DenChips label="Look at" hint="What it should clock first." options={FOCUSES} value={draft.focus} onChange={(id) => set("focus", id as RoastDraft["focus"])} />
              <DenChips label="Talk like" options={TARGETS} value={draft.target} onChange={(id) => set("target", id as RoastDraft["target"])} />
              <div>
                <DenField label="Note" hint="Optional. A nudge, not a script." />
                <input
                  value={draft.note}
                  onChange={(e) => set("note", e.target.value.slice(0, 160))}
                  placeholder="Go after the hair. Don’t mention the room."
                  className="w-full min-w-0 px-3 py-2.5 rounded-xl bg-[#0b0b0b] border border-neutral-800 text-sm text-neutral-200 placeholder:text-neutral-600"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 min-w-0">
          {chips.map((c) => (
            <span key={c} className="px-2 py-0.5 rounded-full bg-rose-950/40 border border-rose-900/40 text-[10px] text-rose-100">
              {c}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
