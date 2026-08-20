"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function JoinPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [capsOn, setCapsOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      setCapsOn(e.getModifierState?.("CapsLock") ?? false);
    };
    window.addEventListener("keydown", handler);
    window.addEventListener("keyup", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("keyup", handler);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || username.trim().length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create account.");

      // Sign them in so the session is active
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        // Account created but auto-login failed — still success, they can log in manually
        console.error("Auto sign-in failed:", signInError);
      }

      setSuccess(true);
      setTimeout(() => router.push("/playground"), 1200);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not create account.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-8">
          <p className="text-green-400 text-sm mb-2">Account created</p>
          <p className="text-neutral-400 text-sm">Taking you into the Den…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-16 sm:py-20">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-50 mb-3">
          Join the Den
        </h1>
        <p className="text-neutral-500 text-sm leading-relaxed">
          Create an account to save judgments and unlock extras later.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-neutral-800/80 bg-[#111] p-6 sm:p-7 space-y-4">
        {error && (
          <div className="px-3 py-2.5 rounded-lg bg-red-950/40 border border-red-900/50 text-red-300 text-sm">
            {error}
          </div>
        )}

        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          autoComplete="username"
          className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
        />

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
        />

        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="new-password"
            className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
          />
          {capsOn && (
            <p className="mt-1.5 text-xs text-amber-400/90">Caps Lock is on</p>
          )}
        </div>

        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm password"
          autoComplete="new-password"
          className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-b from-red-700 via-red-800 to-purple-900 text-white font-medium text-sm transition-all active:scale-[0.98] disabled:opacity-60 shadow-lg"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>

        <p className="text-xs text-neutral-600 text-center pt-1">
          Already have an account?{" "}
          <Link href="/login" className="text-neutral-400 hover:text-neutral-200 underline underline-offset-2">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
