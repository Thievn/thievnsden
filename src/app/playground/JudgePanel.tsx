"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import {
  STYLES,
  FOCUSES,
  FILTHY_MODES,
  getRarity,
  type Style,
  type Focus,
  type FilthyMode,
  type Stage,
} from "@/lib/face-the-den";

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
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = () => resolve(result);
      img.src = result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function JudgePanel() {
  const [stage, setStage] = useState<Stage>("idle");
  const [image, setImage] = useState<string | null>(null);
  const [style, setStyle] = useState<Style>("unhinged");
  const [focus, setFocus] = useState<Focus>("overall");
  const [filthyMode, setFilthyMode] = useState<FilthyMode>("mixed");
  const [verdict, setVerdict] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [previous, setPrevious] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

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

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(URL.createObjectURL(file));
    setStage("setup");
    setVerdict(null);
    setScore(null);
    setPrevious([]);
    setError(null);
    setSaved(false);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
    } catch {
      alert("Camera access denied or unavailable.");
    }
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
    setSaved(false);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  };

  const judge = async (isFollowUp = false) => {
    if (!image) return;
    setLoading(true);
    setError(null);
    setStage("judging");
    setSaved(false);
    try {
      const dataUrl = await toDataUrl(image);
      const res = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          style,
          focus,
          filthyMode: style === "filthy" ? filthyMode : undefined,
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
      setError("The Den did not answer. Try again.");
      setStage("setup");
    } finally {
      setLoading(false);
    }
  };

  const saveJudgment = async () => {
    if (!verdict || score === null || !rarity) return;
    if (!userId) {
      alert("Log in or join to save results to your account.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/judgments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          style,
          focus,
          filthyMode: style === "filthy" ? filthyMode : null,
          score,
          rarity: rarity.name,
          verdict,
          isPublic: false,
          userId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSaved(true);
    } catch (err: any) {
      alert(err.message || "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setImage(null);
    setStage("idle");
    setVerdict(null);
    setScore(null);
    setPrevious([]);
    setError(null);
    setSaved(false);
    stopCamera();
    if (fileRef.current) fileRef.current.value = "";
  };

  const rarity = score !== null ? getRarity(score) : null;
  const panelClass = stage === "judging" ? "den-panel-judging" : "den-panel";

  return (
    <div className="relative max-w-2xl mx-auto px-4 sm:px-6 pb-20">
      <div className={`relative rounded-2xl p-[1px] ${panelClass}`}>
        <div className="absolute inset-0 rounded-2xl den-border-glow opacity-60" />
        <div className="relative rounded-2xl bg-[#0d0d0d]/95 overflow-hidden border border-neutral-800/70 backdrop-blur-sm">
          {stage === "idle" && !cameraActive && (
            <div className="p-5 sm:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="invite-pulse group flex flex-col items-center justify-center gap-3 min-h-[140px] sm:min-h-[160px] p-8 rounded-2xl border border-dashed border-neutral-700 hover:border-red-800/60 hover:bg-red-950/15 transition-all"
                >
                  <span className="w-10 h-10 rounded-full border border-neutral-700 group-hover:border-red-800/50 flex items-center justify-center text-neutral-500 group-hover:text-red-300 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <span className="text-sm text-neutral-200 font-semibold tracking-wide">Upload photo</span>
                  <span className="text-xs text-neutral-600">From gallery</span>
                </button>
                <button
                  onClick={startCamera}
                  className="invite-pulse group flex flex-col items-center justify-center gap-3 min-h-[140px] sm:min-h-[160px] p-8 rounded-2xl border border-dashed border-neutral-700 hover:border-purple-800/60 hover:bg-purple-950/15 transition-all"
                >
                  <span className="w-10 h-10 rounded-full border border-neutral-700 group-hover:border-purple-800/50 flex items-center justify-center text-neutral-500 group-hover:text-purple-300 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </span>
                  <span className="text-sm text-neutral-200 font-semibold tracking-wide">Take a selfie</span>
                  <span className="text-xs text-neutral-600">Use camera</span>
                </button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

              {/* How it works — fills dead space */}
              <div className="mt-8 pt-6 border-t border-neutral-800/70">
                <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-600 text-center mb-4">
                  How it works
                </p>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {[
                    { n: "1", t: "Upload", d: "Photo or selfie" },
                    { n: "2", t: "Get scored", d: "Honest → filthy" },
                    { n: "3", t: "Climb", d: "Gallery & ranks" },
                  ].map((s) => (
                    <div
                      key={s.n}
                      className="rounded-xl border border-neutral-800/80 bg-black/40 px-2 py-3.5 text-center"
                    >
                      <div className="text-[11px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 mb-1">
                        {s.n}
                      </div>
                      <div className="text-xs font-medium text-neutral-200">{s.t}</div>
                      <div className="text-[10px] text-neutral-600 mt-0.5">{s.d}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {cameraActive && (
            <div className="p-4 sm:p-6">
              <div className="relative aspect-square max-w-sm mx-auto rounded-xl overflow-hidden border border-neutral-800 bg-black">
                <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
              </div>
              <div className="flex gap-3 mt-4 justify-center">
                <button onClick={captureSelfie} className="px-6 py-3 rounded-xl bg-gradient-to-b from-red-700 via-red-800 to-purple-900 text-white text-sm font-medium">
                  Capture
                </button>
                <button onClick={stopCamera} className="px-6 py-3 rounded-xl border border-neutral-700 text-neutral-400 text-sm">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {stage === "setup" && image && (
            <div className="p-5 sm:p-7 space-y-6">
              <div className="relative aspect-square max-w-[200px] mx-auto rounded-xl overflow-hidden border border-neutral-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="" className="w-full h-full object-cover" />
              </div>
              {error && <p className="text-center text-sm text-red-400">{error}</p>}

              <div>
                <p className="text-xs text-neutral-500 mb-2.5 text-center uppercase tracking-wide">Judgment style</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {STYLES.map((s) => {
                    const active = style === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setStyle(s.id)}
                        className={`py-3 px-2 rounded-xl border text-center ${
                          active ? "border-red-800/60 bg-red-950/20" : "border-neutral-800"
                        }`}
                      >
                        <div className={`text-xs font-medium ${active ? "text-red-300" : "text-neutral-300"}`}>{s.label}</div>
                        <div className="text-[10px] text-neutral-600 mt-0.5">{s.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {style === "filthy" && (
                <div className="grid grid-cols-3 gap-2">
                  {FILTHY_MODES.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setFilthyMode(m.id)}
                      className={`py-2.5 rounded-xl border text-xs font-medium ${
                        filthyMode === m.id
                          ? "border-red-700/70 bg-red-950/30 text-red-300"
                          : "border-neutral-800 text-neutral-400"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2 justify-center">
                {FOCUSES.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFocus(f.id)}
                    className={`px-3.5 py-1.5 rounded-lg border text-xs ${
                      focus === f.id
                        ? "border-purple-700/60 bg-purple-950/25 text-purple-300"
                        : "border-neutral-800 text-neutral-400"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => judge(false)}
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-b from-red-700 via-red-800 to-purple-900 text-white font-medium text-sm disabled:opacity-60"
              >
                Face The Den
              </button>
              <button onClick={reset} className="w-full py-2 text-xs text-neutral-600">
                Different photo
              </button>
            </div>
          )}

          {stage === "judging" && (
            <div className="p-12 text-center">
              <p className="text-neutral-400 text-sm">The Den is looking…</p>
            </div>
          )}

          {stage === "result" && verdict && score !== null && rarity && image && (
            <div className="p-4 sm:p-6 space-y-5">
              <div className={`relative mx-auto w-full max-w-[320px] rounded-2xl border-2 ${rarity.border} ${rarity.glow} bg-gradient-to-b ${rarity.bg} overflow-hidden`}>
                <div className="flex items-center justify-between px-3 pt-3 pb-2">
                  <span className={`text-[10px] font-semibold uppercase tracking-[0.15em] ${rarity.text}`}>{rarity.name}</span>
                  <span className={`text-sm font-bold tabular-nums ${rarity.text}`}>{score.toFixed(1)}/10</span>
                </div>
                <div className="px-3">
                  <div className={`relative aspect-[3/4] w-full rounded-xl overflow-hidden border ${rarity.border} bg-black`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  </div>
                </div>
                <div className="px-3 pt-2.5 pb-4">
                  <p className="text-[13px] text-neutral-200 leading-relaxed">{verdict}</p>
                </div>
                <div className={`h-1 w-full bg-gradient-to-r ${rarity.bar} opacity-80`} />
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                <button onClick={() => judge(true)} disabled={loading} className="px-3.5 py-1.5 rounded-lg border border-neutral-800 text-xs text-neutral-400">
                  Go harder
                </button>
                <button onClick={() => judge(false)} disabled={loading} className="px-3.5 py-1.5 rounded-lg border border-neutral-800 text-xs text-neutral-400">
                  Judge again
                </button>
              </div>

              {saved ? (
                <p className="text-center text-sm text-green-400/90">Saved · <Link href="/account/judgments" className="underline">View</Link></p>
              ) : userId ? (
                <button onClick={saveJudgment} disabled={saving} className="w-full py-2.5 rounded-xl border border-purple-800/50 text-purple-300 text-sm">
                  {saving ? "Saving…" : "Save this result"}
                </button>
              ) : (
                <p className="text-center text-xs text-neutral-500">
                  <Link href="/login" className="text-neutral-300">Log in</Link> to save
                </p>
              )}

              <div className="flex gap-2">
                <button onClick={() => { setStage("setup"); setVerdict(null); setScore(null); setSaved(false); }} className="flex-1 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 text-sm">
                  Change options
                </button>
                <button onClick={reset} className="flex-1 py-2.5 rounded-xl text-neutral-500 text-sm">
                  New photo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
