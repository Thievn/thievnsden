"use client";

import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/desk", label: "Desks", exact: true },
  { href: "/desk/solana", label: "Solana", exact: false },
  { href: "/desk/binanceus", label: "Binance", exact: false },
  { href: "/desk/coinbase", label: "Coinbase", exact: false },
  { href: "/den", label: "Den", exact: true },
];

function isCurrent(pathname: string, href: string, exact: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DeskNav() {
  const pathname = usePathname() ?? "/desk";
  return (
    <nav className="desk-bar" aria-label="Desks">
      {LINKS.map((link) => {
        const current = isCurrent(pathname, link.href, link.exact);
        return (
          <a key={link.href} href={link.href} aria-current={current ? "page" : undefined}>
            {link.label}
          </a>
        );
      })}
      <form method="post" action="/api/auth">
        <input type="hidden" name="intent" value="logout" />
        <button type="submit">Sign out</button>
      </form>
    </nav>
  );
}
