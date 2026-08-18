"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

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

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-900/80 bg-[#070707]/75 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-2 h-2 rounded-full bg-red-600 group-hover:bg-red-500 transition-colors shadow-[0_0_8px_rgba(196,30,58,0.6)]" />
            <span className="text-[17px] font-semibold tracking-tight text-neutral-100 group-hover:text-red-400 transition-colors duration-200">
              Thievn&apos;s Den
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-0.5">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                  pathname === link.href
                    ? "text-red-400 bg-red-950/40"
                    : "text-neutral-500 hover:text-neutral-200 hover:bg-neutral-900/60"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/join"
              className="ml-3 px-3.5 py-1.5 rounded-lg text-[13px] font-medium border border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 hover:bg-neutral-900/40 transition-all duration-200"
            >
              Join
            </Link>
          </nav>

          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900 transition-colors"
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
          <nav className="md:hidden pb-4 space-y-0.5 animate-fade-in-up">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`block px-3.5 py-2.5 rounded-lg text-sm font-medium ${
                  pathname === link.href
                    ? "text-red-400 bg-red-950/40"
                    : "text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/join"
              onClick={() => setOpen(false)}
              className="block px-3.5 py-2.5 rounded-lg text-sm font-medium text-neutral-400 hover:text-neutral-100"
            >
              Join the Den
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
