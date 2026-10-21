"use client";

import { useEffect, useState } from "react";

const KEY = "den_install_dismissed";

type PromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function alreadyInstalled() {
  const ios = "standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return ios || window.matchMedia("(display-mode: standalone)").matches;
}

export function InstallPrompt() {
  const [event, setEvent] = useState<PromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(KEY) === "1" || alreadyInstalled()) return;
    const show = () => {
      const incoming = (window as Window & { __denInstall?: PromptEvent }).__denInstall;
      if (!incoming) return;
      setEvent(incoming);
      setOpen(true);
    };
    show();
    window.addEventListener("den-install-available", show);
    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
      setIos(true);
      setOpen(true);
    }
    return () => window.removeEventListener("den-install-available", show);
  }, []);

  if (!open) return null;

  function dismiss() {
    localStorage.setItem(KEY, "1");
    setOpen(false);
  }

  async function install() {
    if (!event) return;
    await event.prompt();
    setEvent(null);
    dismiss();
  }

  return (
    <div className="install-bar" role="region" aria-label="Install app">
      <p>{ios ? "Install app from Share, then Add to Home Screen." : "Install app"}</p>
      <div className="install-actions">
        {!ios && event ? (
          <button className="text-btn" type="button" onClick={() => void install()}>
            Install
          </button>
        ) : null}
        <button className="text-btn" type="button" onClick={dismiss}>
          Not now
        </button>
      </div>
    </div>
  );
}
