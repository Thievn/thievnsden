"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
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
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
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
          Welcome back to the Den.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-neutral-800/80 bg-[#111] p-6 sm:p-7 space-y-4">
        {error && (
          <div className="px-3 py-2.5 rounded-lg bg-red-950/40 border border-red-900/50 text-red-300 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm text-neutral-500 mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
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
