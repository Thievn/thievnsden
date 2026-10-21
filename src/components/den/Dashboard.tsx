"use client";

import { useState } from "react";
import { AlertSettings } from "./AlertSettings";
import { VaultDesk } from "./VaultDesk";

const ROOMS = [
  {
    id: "vault",
    label: "Vault",
    short: "Vault",
    kicker: "Empty",
    body: "Nothing here yet.",
  },
  {
    id: "ledger",
    label: "Ledger",
    short: "Ledger",
    kicker: "Empty",
    body: "Nothing here yet.",
  },
  {
    id: "notes",
    label: "Notes",
    short: "Notes",
    kicker: "Empty",
    body: "No notes yet.",
  },
  {
    id: "settings",
    label: "Settings",
    short: "Alerts",
    kicker: "Alerts",
    body: "",
  },
] as const;

type RoomId = (typeof ROOMS)[number]["id"];

export function Dashboard({ ownerName }: { ownerName: string | null }) {
  const [room, setRoom] = useState<RoomId>("vault");

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const current = ROOMS.findIndex((item) => item.id === room);
    let next = current;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (current + 1) % ROOMS.length;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (current - 1 + ROOMS.length) % ROOMS.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = ROOMS.length - 1;
    const id = ROOMS[next].id;
    setRoom(id);
    document.getElementById(`tab-${id}`)?.focus();
  }

  return (
    <div className="den-shell" data-den-app="">
      <header className="den-top">
        <p className="welcome">
          Welcome back{ownerName ? <>, <span className="signed-name">{ownerName}</span></> : null}
        </p>
      </header>

      <nav className="den-nav" aria-label="Sections">
        <a className="rail-mark" href="/">
          Thievn&apos;s Den
        </a>
        <div className="tablist" role="tablist" aria-label="Sections" onKeyDown={onKeyDown}>
          {ROOMS.map((item) => (
            <button
              key={item.id}
              id={`tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={room === item.id}
              aria-controls={`panel-${item.id}`}
              tabIndex={room === item.id ? 0 : -1}
              className={room === item.id ? "is-selected" : undefined}
              onClick={() => setRoom(item.id)}
            >
              <span className="tab-full">{item.label}</span>
              <span className="tab-short">{item.short}</span>
            </button>
          ))}
        </div>
        <form method="post" action="/api/auth">
          <input type="hidden" name="intent" value="logout" />
          <button className="logout" type="submit">
            Sign out
          </button>
        </form>
      </nav>

      <div className={room === "vault" ? "den-stage is-desk" : "den-stage"}>
        {ROOMS.map((item) => (
          <section
            key={item.id}
            id={`panel-${item.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${item.id}`}
            hidden={room !== item.id}
            className={item.id === "vault" ? "vault-hold" : "room"}
          >
            {item.id === "vault" ? <VaultDesk /> : null}
            {item.id === "settings" ? <AlertSettings /> : null}
            {item.id !== "vault" && item.id !== "settings" ? (
              <>
                <p className="eyebrow">{item.kicker}</p>
                <h1>{item.label}</h1>
                <p>{item.body}</p>
              </>
            ) : null}
            {item.id === "ledger" ? (
              <div className="ruled" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
            ) : null}
          </section>
        ))}
      </div>
    </div>
  );
}
