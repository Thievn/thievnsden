"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { DESK_IDS, DESKS, isDeskId } from "@/lib/desks/ids";

export function DeskNav() {
  const pathname = usePathname() ?? "/desk";
  const [open, setOpen] = useState(false);
  const parts = pathname.split("/").filter(Boolean);
  const deskId = parts[0] === "desk" && isDeskId(parts[1]) ? parts[1] : null;
  const onSettings = parts[2] === "settings";
  const settingsHref = `/desk/${deskId ?? "solana"}/settings`;

  return (
    <nav className="desk-bar" aria-label="Desks">
      <a href="/desk" aria-current={pathname === "/desk" ? "page" : undefined}>Hub</a>
      <div className="desk-menu">
        <button
          type="button"
          aria-expanded={open}
          aria-current={deskId && !onSettings ? "page" : undefined}
          onClick={() => setOpen((value) => !value)}
        >
          Desks
        </button>
        {open ? (
          <div className="desk-pop" role="group" aria-label="Choose a desk">
            {DESK_IDS.map((id) => {
              const href = `/desk/${id}`;
              const current = deskId === id && !onSettings;
              return (
                <a key={id} href={href} aria-current={current ? "page" : undefined} onClick={() => setOpen(false)}>
                  {DESKS[id].name}
                </a>
              );
            })}
          </div>
        ) : null}
      </div>
      <a href={settingsHref} aria-current={onSettings ? "page" : undefined}>Settings</a>
    </nav>
  );
}
