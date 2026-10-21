"use client";

import { useEffect, useId, useRef, useState } from "react";

const RIVETS = Array.from({ length: 12 }, (_, index) => {
  const angle = (Math.PI * 2 * index) / 12 - Math.PI / 2;
  const radius = 124;
  return {
    cx: 240 + Math.cos(angle) * radius,
    cy: 280 + Math.sin(angle) * radius,
  };
});

export function VaultDoor() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const keyholeRef = useRef<HTMLButtonElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const emailId = useId();
  const passwordId = useId();
  const titleId = useId();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  function openLock() {
    dialogRef.current?.showModal();
    emailRef.current?.focus();
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onClose = () => {
      setPending(false);
      keyholeRef.current?.focus();
    };
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("lock") !== "1") return;
    if (params.get("err") === "1") setError("Hmm, wrong name or password");
    if (params.get("err") === "unset") setError("Sign-in isn't set up yet.");
    openLock();
    const url = new URL(window.location.href);
    url.search = "lock=1";
    window.history.replaceState(null, "", url);
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });
      const data = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !data?.ok) {
        setError(data?.error || "Hmm, wrong name or password");
        setPending(false);
        return;
      }
      window.location.assign("/den");
    } catch {
      setError("Couldn't reach the server. Try again.");
      setPending(false);
    }
  }

  return (
    <section className="vault-section" id="the-vault">
      <div className="vault-copy">
        <p className="eyebrow">Access</p>
        <h2>Sign in</h2>
        <p className="prose-lead">Name or email, then your password.</p>
      </div>

      <div className="door-wrap">
        <svg className="door" viewBox="0 0 480 560" aria-hidden="true">
          <defs>
            <radialGradient id="iron" cx="38%" cy="32%" r="70%">
              <stop offset="0%" stopColor="#3c4454" />
              <stop offset="42%" stopColor="#222733" />
              <stop offset="100%" stopColor="#10131a" />
            </radialGradient>
            <linearGradient id="strap" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#2a3140" />
              <stop offset="100%" stopColor="#161a22" />
            </linearGradient>
          </defs>
          <rect x="78" y="96" width="324" height="368" rx="36" fill="#141820" stroke="#D4A24C" strokeOpacity="0.22" />
          <path d="M118 168h46v14h-46zM118 390h58v12h-58z" fill="url(#strap)" />
          <circle cx="240" cy="280" r="158" fill="#0c0e14" />
          <circle cx="240" cy="280" r="150" fill="url(#iron)" />
          <ellipse cx="196" cy="214" rx="70" ry="36" fill="#F2E6C9" opacity="0.06" />
          <circle cx="240" cy="280" r="150" fill="none" stroke="#D4A24C" strokeOpacity="0.38" strokeWidth="2" />
          <circle cx="240" cy="280" r="112" fill="none" stroke="#F2E6C9" strokeOpacity="0.12" />
          {RIVETS.map((rivet) => (
            <g key={`${rivet.cx}-${rivet.cy}`}>
              <circle cx={rivet.cx} cy={rivet.cy} r="6.5" fill="#1a1e28" stroke="#D4A24C" strokeOpacity="0.45" />
              <circle cx={rivet.cx - 1.2} cy={rivet.cy - 1.4} r="1.6" fill="#F2E6C9" opacity="0.35" />
            </g>
          ))}
          <path
            d="M150 360c20 28 48 36 90 34"
            fill="none"
            stroke="#3E7C6B"
            strokeOpacity="0.55"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <circle cx="240" cy="280" r="46" fill="#12151c" stroke="#D4A24C" strokeOpacity="0.3" />
        </svg>
        <button
          ref={keyholeRef}
          className="keyhole"
          type="button"
          aria-haspopup="dialog"
          aria-controls="sign-in"
          onClick={openLock}
        >
          <span className="sr-only">Sign in</span>
          <svg viewBox="0 0 40 64" aria-hidden="true">
            <circle cx="20" cy="16" r="9" />
            <path d="M16 24h8l-2 28h-4z" />
          </svg>
        </button>
      </div>
      <p className="whisper">Tap the keyhole to sign in.</p>

      <dialog
        ref={dialogRef}
        id="sign-in"
        className="lock-dialog"
        aria-labelledby={titleId}
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
      >
        <div className="lock-panel">
          <button className="lock-close" type="button" onClick={() => dialogRef.current?.close()}>
            Close
          </button>
          <h2 id={titleId}>Sign in</h2>
          <form method="post" action="/api/auth" onSubmit={onSubmit}>
            <label htmlFor={emailId}>Name or email</label>
            <input
              ref={emailRef}
              id={emailId}
              name="email"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              required
              spellCheck={false}
              disabled={pending}
            />
            <label htmlFor={passwordId}>Password</label>
            <input
              id={passwordId}
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={pending}
            />
            {error ? (
              <p className="lock-error" role="alert">
                {error}
              </p>
            ) : null}
            <button className="turn" type="submit" disabled={pending} aria-busy={pending}>
              {pending ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </dialog>
    </section>
  );
}
