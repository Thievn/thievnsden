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
    <header className="sticky top-0 z-50 border-b border-neutral-900 bg-[#0a0a0a]/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-lg font-semibold tracking-tight text-neutral-100 group-hover:text-red-400 transition-colors">
              Thievn&apos;s Den
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  pathname === link.href
                    ? "text-red-400 bg-red-950/30"
                    : "text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/join"
              className="ml-2 px-3 py-1.5 rounded-lg text-sm border border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700 transition-colors"
            >
              Join
            </Link>
          </nav>

          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {open && (
          <nav className="md:hidden pb-4 space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm ${
                  pathname === link.href
                    ? "text-red-400 bg-red-950/30"
                    : "text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/join"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm text-neutral-400 hover:text-neutral-100"
            >
              Join the Den
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
