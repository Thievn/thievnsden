"use client";

import { useState, useRef, useEffect } from "react";

type Intensity = "mild" | "nuclear" | "existential" | "petty" | "deadpan";
type Stage = "idle" | "ready" | "roasting" | "result" | "profile";

const INTENSITY_CONFIG: Record<
  Intensity,
  { label: string; desc: string; color: string }
> = {
  mild: {
    label: "Mild",
    desc: "Sharp but survivable",
    color: "from-neutral-600 to-neutral-700",
  },
  nuclear: {
    label: "Nuclear",
    desc: "Maximum damage",
    color: "from-red-700 via-red-800 to-purple-900",
  },
  existential: {
    label: "Existential",
    desc: "Questions everything",
    color: "from-purple-900 via-red-950 to-black",
  },
  petty: {
    label: "Petty",
    desc: "Low stakes, high shade",
    color: "from-rose-800 to-red-900",
  },
  deadpan: {
    label: "Deadpan",
    desc: "Flat. Final. Cold.",
    color: "from-zinc-700 to-zinc-900",
  },
};

const FOLLOW_UP_PROMPTS = [
  "Go harder",
  "Make it personal",
  "One more shot",
];

const PROFILE_SNIPPETS = [
  "Pattern detected: You seek intensity but retreat the moment it becomes real.",
  "You keep offering pieces of yourself to the void and acting surprised when it keeps them.",
  "There’s a version of you that stopped performing. It’s still in there. It’s just tired.",
  "You don’t fear failure. You fear the version of yourself that would succeed and then have to keep going.",
];

export default function PlaygroundPage() {
  const [stage, setStage] = useState<Stage>("idle");
  const [image, setImage] = useState<string | null>(null);
  const [intensity, setIntensity] = useState<Intensity>("nuclear");
  const [currentRoast, setCurrentRoast] = useState<string | null>(null);
  const [previousRoasts, setPreviousRoasts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraActive]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImage(url);
    setStage("ready");
    setCurrentRoast(null);
    setPreviousRoasts([]);
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

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setImage(dataUrl);
    stopCamera();
    setStage("ready");
    setCurrentRoast(null);
    setPreviousRoasts([]);
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

  const generateRoast = async (isFollowUp = false) => {
    if (!image) return;
    setLoading(true);
    setError(null);
    setStage("roasting");

    try {
      const res = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intensity,
          followUp: isFollowUp,
          previousRoasts: isFollowUp ? previousRoasts : [],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate roast");

      const roast = data.roast as string;
      setCurrentRoast(roast);
      setPreviousRoasts((prev) => [...prev, roast]);
      setStage("result");
    } catch (err) {
      console.error(err);
      setError("The void did not respond. Try again.");
      setStage("ready");
    } finally {
      setLoading(false);
    }
  };

  const showProfile = () => setStage("profile");

  const reset = () => {
    setImage(null);
    setStage("idle");
    setCurrentRoast(null);
    setPreviousRoasts([]);
    setError(null);
    stopCamera();
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      {/* Header */}
      <div className="mb-8 sm:mb-10 text-center">
        <p className="text-[11px] uppercase tracking-[0.22em] text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 mb-2 font-medium">
          The Void Mirror
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-50 mb-2">
          Face The Den
        </h1>
        <p className="text-neutral-500 text-sm max-w-md mx-auto">
          Offer a photo. Choose how it hits. See what comes back.
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
                <span className="text-2xl opacity-50 group-hover:opacity-80 transition-opacity">↑</span>
                <span className="text-sm text-neutral-300 font-medium">Upload photo</span>
                <span className="text-xs text-neutral-600">From gallery</span>
              </button>

              <button
                onClick={startCamera}
                className="group flex flex-col items-center justify-center gap-2 p-8 rounded-xl border border-dashed border-neutral-700 hover:border-purple-900/50 hover:bg-purple-950/10 transition-all duration-300 active:scale-[0.98]"
              >
                <span className="text-2xl opacity-50 group-hover:opacity-80 transition-opacity">▣</span>
                <span className="text-sm text-neutral-300 font-medium">Take a selfie</span>
                <span className="text-xs text-neutral-600">Use camera</span>
              </button>
            </div>

            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

            <p className="mt-6 text-xs text-neutral-600 text-center">
              Photos stay in your browser.
            </p>
          </div>
        )}

        {/* CAMERA */}
        {cameraActive && (
          <div className="p-4 sm:p-6">
            <div className="relative aspect-square max-w-sm mx-auto rounded-xl overflow-hidden border border-neutral-800 bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
              />
            </div>
            <div className="flex gap-3 mt-4 justify-center">
              <button
                onClick={captureSelfie}
                className="px-6 py-3 rounded-xl bg-gradient-to-b from-red-700 via-red-800 to-purple-900 text-white text-sm font-medium active:scale-[0.98] transition-transform"
              >
                Capture
              </button>
              <button
                onClick={stopCamera}
                className="px-6 py-3 rounded-xl border border-neutral-700 text-neutral-400 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* READY */}
        {stage === "ready" && image && (
          <div className="p-5 sm:p-7 space-y-6 animate-fade-in-up">
            <div className="relative aspect-square max-w-[200px] mx-auto rounded-xl overflow-hidden border border-neutral-800 shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="Your offering" className="w-full h-full object-cover" />
            </div>

            {error && <p className="text-center text-sm text-red-400">{error}</p>}

            <div>
              <p className="text-xs text-neutral-500 mb-3 text-center uppercase tracking-wide">
                Choose your fate
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(INTENSITY_CONFIG) as Intensity[]).map((key) => {
                  const config = INTENSITY_CONFIG[key];
                  const active = intensity === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setIntensity(key)}
                      className={`py-3 px-2 rounded-xl border text-center transition-all duration-200 ${
                        active
                          ? "border-red-800/70 bg-red-950/25 shadow-[0_0_20px_-8px_rgba(185,28,92,0.4)]"
                          : "border-neutral-800 hover:border-neutral-700"
                      }`}
                    >
                      <div className={`text-xs font-medium ${active ? "text-red-300" : "text-neutral-300"}`}>
                        {config.label}
                      </div>
                      <div className="text-[10px] text-neutral-600 mt-0.5 leading-tight">{config.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => generateRoast(false)}
              disabled={loading}
              className={`w-full py-3.5 rounded-xl bg-gradient-to-b ${INTENSITY_CONFIG[intensity].color} text-white font-medium text-sm transition-all active:scale-[0.98] disabled:opacity-60 shadow-lg`}
            >
              Face The Den
            </button>

            <button onClick={reset} className="w-full py-2 text-xs text-neutral-600 hover:text-neutral-400">
              Different photo
            </button>
          </div>
        )}

        {/* ROASTING */}
        {stage === "roasting" && (
          <div className="p-12 sm:p-16 text-center">
            <div className="relative w-14 h-14 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border border-purple-900/40 animate-ping opacity-40" />
              <div className="relative w-14 h-14 rounded-full border border-purple-900/50 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-red-500 to-purple-500 animate-pulse" />
              </div>
            </div>
            <p className="text-neutral-400 text-sm">The Den is looking…</p>
            <p className="text-neutral-600 text-xs mt-2">This won’t take long.</p>
          </div>
        )}

        {/* RESULT */}
        {stage === "result" && currentRoast && image && (
          <div className="p-5 sm:p-7 space-y-5 animate-fade-in-up">
            <div className="relative aspect-square max-w-[160px] mx-auto rounded-xl overflow-hidden border border-neutral-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="Your offering" className="w-full h-full object-cover" />
            </div>

            <div className="p-5 rounded-xl bg-gradient-to-br from-red-950/25 to-purple-950/20 border border-purple-900/30 shadow-[0_0_30px_-10px_rgba(124,58,237,0.2)]">
              <p className="text-[10px] uppercase tracking-wider text-purple-400/80 mb-2">
                {INTENSITY_CONFIG[intensity].label}
              </p>
              <p className="text-neutral-100 leading-relaxed text-[15px] sm:text-base">
                {currentRoast}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-neutral-600 text-center">Push further</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {FOLLOW_UP_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => generateRoast(true)}
                    disabled={loading}
                    className="px-3.5 py-1.5 rounded-lg border border-neutral-800 text-xs text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 transition-all disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {previousRoasts.length >= 3 && (
              <button
                onClick={showProfile}
                className="w-full py-3 rounded-xl border border-purple-900/50 text-purple-300 text-sm hover:bg-purple-950/20 transition-all"
              >
                Request Psychological Profile
              </button>
            )}

            <div className="pt-1 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => generateRoast(false)}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 text-sm hover:border-neutral-700 disabled:opacity-50"
              >
                Roast again
              </button>
              <button
                onClick={reset}
                className="flex-1 py-2.5 rounded-xl text-neutral-500 text-sm hover:text-neutral-300"
              >
                New photo
              </button>
            </div>
          </div>
        )}

        {/* PROFILE */}
        {stage === "profile" && (
          <div className="p-6 sm:p-8 space-y-5 animate-fade-in-up">
            <div className="text-center">
              <p className="text-[11px] uppercase tracking-[0.2em] text-purple-400/80 mb-2">From the Den</p>
              <h2 className="text-lg font-medium text-neutral-100">Psychological Profile</h2>
            </div>

            <div className="p-5 rounded-xl bg-[#0d0d0d] border border-neutral-800/80">
              <p className="text-neutral-300 text-sm leading-relaxed">
                {PROFILE_SNIPPETS[Math.floor(Math.random() * PROFILE_SNIPPETS.length)]}
              </p>
            </div>

            <p className="text-xs text-neutral-600 text-center">
              Based on {previousRoasts.length} observations this session.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setStage("result")}
                className="flex-1 py-2.5 rounded-xl border border-neutral-800 text-neutral-400 text-sm"
              >
                Back
              </button>
              <button
                onClick={reset}
                className="flex-1 py-2.5 rounded-xl bg-neutral-900 text-neutral-300 text-sm"
              >
                End session
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
