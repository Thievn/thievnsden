"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { InstallAppCard } from "@/components/InstallAppCard";
import type { User } from "@supabase/supabase-js";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [capsOn, setCapsOn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        router.push("/login");
        return;
      }
      setUser(session.user);
      const name = session.user.user_metadata?.username || "";
      setUsername(name);
      setNewUsername(name);
    });
  }, [router]);

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

  const updateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setMsg(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/update-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, username: newUsername }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      setUsername(data.username);
      setMsg("Username updated.");
      await supabase.auth.refreshSession();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMsg(null);

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
      const { error: pwError } = await supabase.auth.updateUser({ password });
      if (pwError) throw pwError;
      setPassword("");
      setConfirm("");
      setMsg("Password updated.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center text-neutral-500 text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <h1 className="text-2xl font-semibold text-neutral-50 mb-2">Account</h1>
      <p className="text-neutral-500 text-sm mb-8">Manage your Den profile.</p>

      {(msg || error) && (
        <div
          className={`mb-5 px-3 py-2.5 rounded-lg text-sm border ${
            error
              ? "bg-red-950/40 border-red-900/50 text-red-300"
              : "bg-green-950/30 border-green-900/40 text-green-400"
          }`}
        >
          {error || msg}
        </div>
      )}

      <div className="mb-5">
        <InstallAppCard />
      </div>

      <div className="mb-5 rounded-2xl border border-neutral-800/80 bg-[#111] divide-y divide-neutral-800/60">
        <Link
          href="/account/judgments"
          className="p-4 text-sm text-neutral-300 hover:text-neutral-100 flex items-center justify-between"
        >
          <span>My judgments</span>
          <span className="text-neutral-600">→</span>
        </Link>
        <Link
          href="/account/afterimage"
          className="p-4 text-sm text-neutral-300 hover:text-neutral-100 flex items-center justify-between"
        >
          <span>My Afterimage prints</span>
          <span className="text-neutral-600">→</span>
        </Link>
      </div>

      <form onSubmit={updateUsername} className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5 sm:p-6 space-y-4 mb-5">
        <p className="text-xs uppercase tracking-wide text-neutral-500">Username</p>
        <input
          type="text"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
          placeholder="Username"
          className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600"
        />
        <p className="text-[11px] text-neutral-600">Must be unique. Case does not matter for uniqueness.</p>
        <button
          type="submit"
          disabled={loading || newUsername.trim() === username}
          className="w-full py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 text-sm hover:border-neutral-600 disabled:opacity-50"
        >
          Save username
        </button>
      </form>

      <form onSubmit={updatePassword} className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5 sm:p-6 space-y-4">
        <p className="text-xs uppercase tracking-wide text-neutral-500">Change password</p>
        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600"
          />
          {capsOn && <p className="mt-1.5 text-xs text-amber-400/90">Caps Lock is on</p>}
        </div>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm new password"
          className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600"
        />
        <button
          type="submit"
          disabled={loading || !password}
          className="w-full py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 text-sm hover:border-neutral-600 disabled:opacity-50"
        >
          Update password
        </button>
      </form>
    </div>
  );
}
