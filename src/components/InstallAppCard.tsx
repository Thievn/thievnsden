"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallAppCard() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS
      window.navigator.standalone === true;

    if (standalone) {
      setInstalled(true);
      return;
    }

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isIos && isSafari) setIosHint(true);

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setDeferred(null);
    });

    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  const install = async () => {
    if (!deferred) return;
    setBusy(true);
    setMsg(null);
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") {
        setInstalled(true);
        setMsg("Installed. Open it from your home screen.");
      } else {
        setMsg("Install dismissed. You can try again anytime.");
      }
      setDeferred(null);
    } catch {
      setMsg("Could not start install. Try your browser menu → Install app.");
    } finally {
      setBusy(false);
    }
  };

  if (installed) {
    return (
      <div className="rounded-2xl border border-purple-900/40 bg-gradient-to-b from-purple-950/20 to-[#111] p-5 sm:p-6">
        <p className="text-xs uppercase tracking-wide text-purple-300/80 mb-1">App</p>
        <p className="text-sm text-neutral-200 font-medium">Running as installed app</p>
        <p className="text-xs text-neutral-500 mt-1">The Den is on your home screen.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5 sm:p-6 space-y-3">
      <div>
        <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Install</p>
        <p className="text-sm text-neutral-200 font-medium">Add The Den to your home screen</p>
        <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
          Opens full-screen with the boot animation. Faster return trips. Works on phone and desktop
          browsers that support PWAs.
        </p>
      </div>

      {deferred ? (
        <button
          onClick={install}
          disabled={busy}
          className="w-full py-2.5 rounded-xl bg-gradient-to-b from-red-700 via-red-800 to-purple-900 text-white text-sm font-medium disabled:opacity-50"
        >
          {busy ? "Opening…" : "Install as app"}
        </button>
      ) : iosHint ? (
        <div className="rounded-xl border border-neutral-800 bg-[#0a0a0a] p-3 text-xs text-neutral-400 leading-relaxed">
          On iPhone: tap <span className="text-neutral-200">Share</span> →{" "}
          <span className="text-neutral-200">Add to Home Screen</span>.
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-800 bg-[#0a0a0a] p-3 text-xs text-neutral-500 leading-relaxed">
          If the install button doesn&apos;t appear, use your browser menu →{" "}
          <span className="text-neutral-300">Install app</span> /{" "}
          <span className="text-neutral-300">Add to Home screen</span>. Chrome on Android and desktop
          usually shows a native prompt after a visit or two.
        </div>
      )}

      {msg && <p className="text-xs text-neutral-400">{msg}</p>}
    </div>
  );
}
