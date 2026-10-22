"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./landing.module.css";

export function SignInForm() {
  const emailRef = useRef<HTMLInputElement>(null);
  const emailId = useId();
  const passwordId = useId();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("lock") !== "1") return;
    if (params.get("err") === "1") setError("Hmm, wrong name or password");
    if (params.get("err") === "unset") setError("Sign-in isn't set up yet.");
    emailRef.current?.focus();
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
    <form id="sign-in" className={styles.panel} method="post" action="/api/auth" onSubmit={onSubmit}>
      <h2>Sign in</h2>
      <p className={styles.panelNote}>Name or email, then your password.</p>
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
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      <button className={styles.submit} type="submit" disabled={pending} aria-busy={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
