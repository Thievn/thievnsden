"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { AccountMenu } from "@/components/AccountMenu";
import type { User } from "@supabase/supabase-js";

const links = [
  { href: "/", label: "Home" },
  { href: "/thoughts", label: "Thoughts" },
  { href: "/loot", label: "Loot" },
  { href: "/playground", label: "Playground" },
  { href: "/gaming", label: "Gaming" },
  { href: "/about", label: "About" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const name =
          session.user.user_metadata?.username ||
          session.user.email?.split("@")[0] ||
          null;
        setUsername(name);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const name =
          session.user.user_metadata?.username ||
          session.user.email?.split("@")[0] ||
          null;
        setUsername(name);
      } else {
        setUsername(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-900/80 bg-[#070707]/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <Link href="/" className="flex items-center gap-2 group" onClick={() => setOpen(false)}>
            <div className="w-2 h-2 rounded-full bg-gradient-to-br from-red-500 to-purple-500 group-hover:from-red-400 group-hover:to-purple-400 transition-all shadow-[0_0_10px_rgba(185,28,92,0.5)]" />
            <span className="text-base sm:text-[17px] font-semibold tracking-tight text-neutral-100 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-red-300 group-hover:to-purple-300 transition-all duration-200">
              Thievn&apos;s Den
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-0.5">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                  pathname === link.href
                    ? "text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400"
                    : "text-neutral-500 hover:text-neutral-200 hover:bg-neutral-900/60"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {user && username ? (
              <div className="ml-2">
                <AccountMenu user={user} username={username} />
              </div>
            ) : (
              <div className="ml-2 flex items-center gap-1">
                <Link
                  href="/login"
                  className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                    pathname === "/login"
                      ? "text-neutral-200"
                      : "text-neutral-500 hover:text-neutral-200 hover:bg-neutral-900/60"
                  }`}
                >
                  Log in
                </Link>
                <Link
                  href="/join"
                  className={`px-3 py-1.5 rounded-lg text-[13px] font-medium border transition-all duration-200 ${
                    pathname === "/join"
                      ? "border-neutral-600 text-neutral-200 bg-neutral-900/40"
                      : "border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 hover:bg-neutral-900/40"
                  }`}
                >
                  Join
                </Link>
              </div>
            )}
          </nav>

          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 -mr-2 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900 transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {open && (
          <nav className="md:hidden pb-4 space-y-1 border-t border-neutral-900/60 pt-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium ${
                  pathname === link.href
                    ? "text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 bg-red-950/20"
                    : "text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {user && username ? (
              <>
                <div className="px-3 py-2 text-sm text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 font-medium">
                  {username}
                </div>
                <Link
                  href="/account"
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm text-neutral-400 hover:text-neutral-100"
                >
                  Account settings
                </Link>
                <Link
                  href="/account/judgments"
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm text-neutral-400 hover:text-neutral-100"
                >
                  My judgments
                </Link>
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm text-red-400/90 hover:text-red-300"
                >
                  Admin panel
                </Link>
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    setOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2.5 rounded-lg text-sm text-neutral-500 hover:text-neutral-200"
                >
                  Log out
                </button>
              </>
            ) : (
              <div className="pt-1 space-y-1">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900"
                >
                  Log in
                </Link>
                <Link
                  href="/join"
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-300 hover:text-neutral-100 hover:bg-neutral-900"
                >
                  Join the Den
                </Link>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
