"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState(""); // email OR username
  const [password, setPassword] = useState("");
  const [capsOn, setCapsOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setLoading(true);

    try {
      let email = identifier.trim();

      // If it doesn't look like an email, treat it as a username (case-insensitive)
      if (!email.includes("@")) {
        const { data: profile, error: lookupError } = await supabase
          .from("profiles")
          .select("id, username")
          .ilike("username", email)
          .maybeSingle();

        if (lookupError || !profile) {
          throw new Error("No account found with that username.");
        }

        // We need the email to sign in. Fetch it via a lightweight approach:
        // Store email on profiles going forward. For now, fall back to asking
        // the user to use email if we can't resolve it.
        // Better path: use an RPC or store email on profile.
        // Temporary: look up auth user is not possible from client with anon key.
        // So we'll use a server route for username → email resolution.

        const res = await fetch("/api/auth/resolve-username", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: email }),
        });

        const resolved = await res.json();
        if (!res.ok || !resolved.email) {
          throw new Error(resolved.error || "Could not find that username.");
        }

        email = resolved.email;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      router.push("/playground");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not log in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-16 sm:py-20">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-50 mb-3">
          Log in
        </h1>
        <p className="text-neutral-500 text-sm leading-relaxed">
          Use your username or email.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-neutral-800/80 bg-[#111] p-6 sm:p-7 space-y-4">
        {error && (
          <div className="px-3 py-2.5 rounded-lg bg-red-950/40 border border-red-900/50 text-red-300 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm text-neutral-500 mb-1.5">Username or email</label>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Thieven or you@example.com"
            autoComplete="username"
            className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-500 mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
          />
          {capsOn && (
            <p className="mt-1.5 text-xs text-amber-400/90">Caps Lock is on</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-b from-red-700 via-red-800 to-purple-900 text-white font-medium text-sm transition-all active:scale-[0.98] disabled:opacity-60 shadow-lg"
        >
          {loading ? "Logging in…" : "Log in"}
        </button>

        <p className="text-xs text-neutral-600 text-center pt-1">
          No account yet?{" "}
          <Link href="/join" className="text-neutral-400 hover:text-neutral-200 underline underline-offset-2">
            Create one
          </Link>
        </p>
      </form>
    </div>
  );
}
