"use client";

import { useEffect, useRef } from "react";

export const LAB_LINKS = [
  ["/attic", "Create"],
  ["/edit", "Edit"],
  ["/gallery", "Gallery"],
] as const;

export function Switcher({ current }: { current: string }) {
  return (
    <nav className="switch" aria-label="Lab">
      {LAB_LINKS.map(([href, label]) => (
        <a key={href} href={href} className={current === label ? "on" : ""} aria-current={current === label ? "page" : undefined}>
          {label}
        </a>
      ))}
    </nav>
  );
}

export function Chips({
  options,
  value,
  multi,
  onPick,
}: {
  options: string[];
  value: string | string[];
  multi?: boolean;
  onPick: (option: string) => void;
}) {
  return (
    <div className="chips">
      {options.map((option) => {
        const on = multi ? (value as string[]).includes(option) : value === option;
        return (
          <button key={option} type="button" className={on ? "chip on" : "chip"} aria-pressed={on} onClick={() => onPick(option)}>
            {option}
          </button>
        );
      })}
    </div>
  );
}

export function Section({
  id,
  openId,
  setOpenId,
  title,
  summary,
  children,
}: {
  id: string;
  openId: string | null;
  setOpenId: (id: string | null) => void;
  title: string;
  summary?: string;
  children: React.ReactNode;
}) {
  const open = openId === id;
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open && ref.current && window.innerWidth < 860) {
      window.setTimeout(() => ref.current?.scrollIntoView({ block: "start", behavior: "smooth" }), 40);
    }
  }, [open]);
  return (
    <div ref={ref} className={open ? "card acc open" : "card acc"}>
      <button type="button" className="acchead" aria-expanded={open} onClick={() => setOpenId(open ? null : id)}>
        <span>{title}</span>
        <span className="sum">{summary}</span>
        <span aria-hidden="true">{open ? "–" : "+"}</span>
      </button>
      {open ? <div className="accbody">{children}</div> : null}
    </div>
  );
}
