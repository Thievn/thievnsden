"use client";

import { useState, useRef, useEffect } from "react";

type Style = "honest" | "unhinged" | "filthy" | "petty" | "deadpan";
type Focus = "overall" | "face" | "body" | "tits" | "ass" | "vibe";
type FilthyMode = "degrade" | "worship" | "mixed";
type Stage = "idle" | "setup" | "judging" | "result";

const STYLES: { id: Style; label: string; desc: string }[] = [
  { id: "honest", label: "Honest", desc: "Direct and real" },
  { id: "unhinged", label: "Unhinged", desc: "No filter" },
  { id: "filthy", label: "Filthy", desc: "Explicit & sexual" },
  { id: "petty", label: "Petty", desc: "Small and mean" },
  { id: "deadpan", label: "Deadpan", desc: "Cold and flat" },
];

const FOCUSES: { id: Focus; label: string }[] = [
  { id: "overall", label: "Overall" },
  { id: "face", label: "Face" },
  { id: "body", label: "Body" },
  { id: "tits", label: "Tits" },
  { id: "ass", label: "Ass" },
  { id: "vibe", label: "Vibe" },
];

const FILTHY_MODES: { id: FilthyMode; label: string }[] = [
  { id: "degrade", label: "Degrade me" },
  { id: "worship", label: "Worship me" },
  { id: "mixed", label: "Mixed" },
];

function getRarity(score: number) {
  if (score >= 9.6) return { name: "Legendary", border: "border-amber-400/80 shadow-[0_0_28px_-4px_rgba(251,191,36,0.45)]", text: "text-amber-300" };
  if (score >= 9.0) return { name: "Epic", border: "border-red-500/70 shadow-[0_0_24px_-4px_rgba(239,68,68,0.4)]", text: "text-red-300" };
  if (score >= 8.0) return { name: "Rare", border: "border-rose-600/60 shadow-[0_0_18px_-6px_rgba(225,29,72,0.35)]", text: "text-rose-300" };
  if (score >= 6.0) return { name: "Uncommon", border: "border-purple-600/50 shadow-[0_0_14px_-6px_rgba(147,51,234,0.3)]", text: "text-purple-300" };
  if (score >= 4.0) return { name: "Common", border: "border-neutral-600/60", text: "text-neutral-400" };
  return { name: "Trash", border: "border-neutral-700/50", text: "text-neutral-500" };
}

export default function PlaygroundPage() {
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

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(URL.createObjectURL(file));
    setStage("setup");
    setVerdict(null);
    setScore(null);
    setPrevious([]);
    setError(null);
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

    try {
      const res = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          style,
          focus,
          filthyMode: style === "filthy" ? filthyMode : undefined,
          followUp: isFollowUp,
          previous: isFollowUp ? previous : [],
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

  const reset = () => {
    setImage(null);
    setStage("idle");
    setVerdict(null);
    setScore(null);
    setPrevious([]);
    setError(null);
    stopCamera();
    if (fileRef.current) fileRef.current.value = "";
  };

  const rarity = score !== null ? getRarity(score) : null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <div className="mb-8 sm:mb-10 text-center">
        <p className="text-[11px] uppercase tracking-[0.22em] text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 mb-2 font-medium">
          The Void Mirror
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-50 mb-2">
          Face The Den
        </h1>
        <p className="text-neutral-500 text-sm max-w-md mx-auto">
          Upload. Choose how you want to be judged. Get scored.
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-800/80 bg-[#111] overflow-hidden shadow-[0_0_40px_-12px_rgba(185,28,92,0.15)]">
        {/* IDLE */}
        {stage === "idle" && !cameraActive && (
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => fileRef.current?.click()}
                className="group flex flex-col items-center justify-center gap-2 p-8 rounded-xl border border-dashed border-neutral-700 hover:border-red-900/50 hover:bg-red-950/10 transition-all duration-300 active:scale-[0.98]"
              >
                <span className="text-2xl opacity-50 group-hover:opacity-80">↑</span>
                <span className="text-sm text-neutral-300 font-medium">Upload photo</span>
                <span className="text-xs text-neutral-600">From gallery</span>
              </button>
              <button
                onClick={startCamera}
                className="group flex flex-col items-center justify-center gap-2 p-8 rounded-xl border border-dashed border-neutral-700 hover:border-purple-900/50 hover:bg-purple-950/10 transition-all duration-300 active:scale-[0.98]"
              >
                <span className="text-2xl opacity-50 group-hover:opacity-80">▣</span>
                <span className="text-sm text-neutral-300 font-medium">Take a selfie</span>
                <span className="text-xs text-neutral-600">Use camera</span>
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
            <p className="mt-6 text-xs text-neutral-600 text-center">Photos stay in your browser.</p>
          </div>
        )}

        {/* CAMERA */}
        {cameraActive && (
          <div className="p-4 sm:p-6">
            <div className="relative aspect-square max-w-sm mx-auto rounded-xl overflow-hidden border border-neutral-800 bg-black">
              <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
            </div>
            <div className="flex gap-3 mt-4 justify-center">
              <button onClick={captureSelfie} className="px-6 py-3 rounded-xl bg-gradient-to-b from-red-700 via-red-800 to-purple-900 text-white text-sm font-medium active:scale-[0.98]">
                Capture
              </button>
              <button onClick={stopCamera} className="px-6 py-3 rounded-xl border border-neutral-700 text-neutral-400 text-sm">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* SETUP */}
        {stage === "setup" && image && (
          <div className="p-5 sm:p-7 space-y-6">
            <div className="relative aspect-square max-w-[180px] mx-auto rounded-xl overflow-hidden border border-neutral-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="Subject" className="w-full h-full object-cover" />
            </div>

            {error && <p className="text-center text-sm text-red-400">{error}</p>}

            {/* Style */}
            <div>
              <p className="text-xs text-neutral-500 mb-2.5 text-center uppercase tracking-wide">Judgment style</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {STYLES.map((s) => {
                  const active = style === s.id;
                  const isFilthy = s.id === "filthy";
                  return (
                    <button
                      key={s.id}
                      onClick={() => setStyle(s.id)}
                      className={`py-3 px-2 rounded-xl border text-center transition-all duration-300 ${
                        active
                          ? isFilthy
                            ? "border-red-700/70 bg-red-950/30 shadow-[0_0_20px_-6px_rgba(220,38,38,0.45)]"
                            : "border-red-800/60 bg-red-950/20"
                          : isFilthy
                            ? "border-red-900/40 hover:border-red-800/50 hover:shadow-[0_0_12px_-6px_rgba(220,38,38,0.25)]"
                            : "border-neutral-800 hover:border-neutral-700"
                      }`}
                    >
                      <div className={`text-xs font-medium ${active ? "text-red-300" : "text-neutral-300"}`}>{s.label}</div>
                      <div className="text-[10px] text-neutral-600 mt-0.5">{s.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filthy sub-mode */}
            {style === "filthy" && (
              <div className="animate-fade-in-up">
                <p className="text-xs text-neutral-500 mb-2.5 text-center uppercase tracking-wide">Filthy direction</p>
                <div className="grid grid-cols-3 gap-2">
                  {FILTHY_MODES.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setFilthyMode(m.id)}
                      className={`py-2.5 rounded-xl border text-xs font-medium transition-all ${
                        filthyMode === m.id
                          ? "border-red-700/70 bg-red-950/30 text-red-300"
                          : "border-neutral-800 text-neutral-400 hover:border-neutral-700"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Focus */}
            <div>
              <p className="text-xs text-neutral-500 mb-2.5 text-center uppercase tracking-wide">Focus</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {FOCUSES.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFocus(f.id)}
                    className={`px-3.5 py-1.5 rounded-lg border text-xs transition-all ${
                      focus === f.id
                        ? "border-purple-700/60 bg-purple-950/25 text-purple-300"
                        : "border-neutral-800 text-neutral-400 hover:border-neutral-700"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => judge(false)}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-b from-red-700 via-red-800 to-purple-900 text-white font-medium text-sm transition-all active:scale-[0.98] disabled:opacity-60 shadow-lg"
            >
              Face The Den
            </button>

            <button onClick={reset} className="w-full py-2 text-xs text-neutral-600 hover:text-neutral-400">
              Different photo
            </button>
          </div>
        )}

        {/* JUDGING */}
        {stage === "judging" && (
          <div className="p-12 sm:p-16 text-center">
            <div className="relative w-14 h-14 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border border-purple-900/40 animate-ping opacity-40" />
              <div className="relative w-14 h-14 rounded-full border border-purple-900/50 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-red-500 to-purple-500 animate-pulse" />
              </div>
            </div>
            <p className="text-neutral-400 text-sm">The Den is looking…</p>
          </div>
        )}

        {/* RESULT */}
        {stage === "result" && verdict && score !== null && rarity && image && (
          <div className="p-5 sm:p-7 space-y-5">
            <div className={`relative aspect-square max-w-[150px] mx-auto rounded-xl overflow-hidden border-2 ${rarity.border} transition-all duration-500`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="Subject" className="w-full h-full object-cover" />
            </div>

            <div className="text-center">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${rarity.border} mb-3`}>
                <span className={`text-lg font-semibold tabular-nums ${rarity.text}`}>{score.toFixed(1)}</span>
                <span className="text-[10px] uppercase tracking-wider text-neutral-500">{rarity.name}</span>
              </div>
            </div>

            <div className={`p-5 rounded-xl bg-gradient-to-br from-red-950/20 to-purple-950/15 border ${rarity.border}`}>
              <p className="text-[10px] uppercase tracking-wider text-purple-400/70 mb-2">
                {STYLES.find((s) => s.id === style)?.label}
                {style === "filthy" ? ` · ${FILTHY_MODES.find((m) => m.id === filthyMode)?.label}` : ""}
                {" · "}
                {FOCUSES.find((f) => f.id === focus)?.label}
              </p>
              <p className="text-neutral-100 leading-relaxed text-[15px]">{verdict}</p>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => judge(true)}
                disabled={loading}
                className="px-3.5 py-1.5 rounded-lg border border-neutral-800 text-xs text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 transition-all disabled:opacity-50"
              >
                Go harder
              </button>
              <button
                onClick={() => judge(false)}
                disabled={loading}
                className="px-3.5 py-1.5 rounded-lg border border-neutral-800 text-xs text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 transition-all disabled:opacity-50"
              >
                Judge again
              </button>
            </div>

            <div className="pt-1 flex gap-2">
              <button
                onClick={() => {
                  setStage("setup");
                  setVerdict(null);
                  setScore(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 text-sm"
              >
                Change options
              </button>
              <button onClick={reset} className="flex-1 py-2.5 rounded-xl text-neutral-500 text-sm hover:text-neutral-300">
                New photo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
