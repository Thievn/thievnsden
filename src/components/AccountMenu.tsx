"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { isAdmin } from "@/lib/admin";
import type { User } from "@supabase/supabase-js";

export function AccountMenu({ user, username }: { user: User; username: string }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const admin = isAdmin(user);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-all text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 hover:from-red-300 hover:to-purple-300"
      >
        <span className="max-w-[90px] truncate">{username}</span>
        <svg
          className={`w-3 h-3 text-neutral-500 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 rounded-xl border border-neutral-800 bg-[#0c0c0c] shadow-2xl shadow-black/50 overflow-hidden z-50">
          <div className="px-3 py-2.5 border-b border-neutral-800/80">
            <p className="text-xs text-neutral-500">Signed in as</p>
            <p className="text-sm font-medium truncate text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400">
              {username}
            </p>
          </div>

          <div className="py-1">
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900/80 transition-colors"
            >
              Account settings
            </Link>
            <Link
              href="/account/judgments"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900/80 transition-colors"
            >
              My judgments
            </Link>

            {admin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors"
              >
                <span className="text-base leading-none">☠</span>
                <span>Admin panel</span>
              </Link>
            )}
          </div>

          <div className="border-t border-neutral-800/80 py-1">
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-sm text-neutral-500 hover:text-neutral-200 hover:bg-neutral-900/80 transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
