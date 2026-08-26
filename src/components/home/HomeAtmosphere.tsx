"use client";

import { useCallback, useRef, type ReactNode } from "react";

export function HomeAtmosphere({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = root.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - box.left}px`);
    el.style.setProperty("--my", `${e.clientY - box.top}px`);
  }, []);

  return (
    <div ref={root} onMouseMove={onMove} className="home-den relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="home-spot absolute inset-0 transition-[background] duration-300" />
        <div className="absolute -top-24 left-1/2 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(185,28,92,0.16),transparent_68%)] den-ember" />
        <div className="absolute top-32 right-[-10%] h-[380px] w-[380px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.12),transparent_70%)] void-orb-b" />
        <div className="absolute top-[48%] left-[-8%] h-[300px] w-[300px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(244,63,94,0.08),transparent_70%)] void-orb-c" />
        <div className="den-grain opacity-[0.055]" />
        {[18, 32, 48, 62, 74, 28, 55, 81].map((left, i) => (
          <span
            key={i}
            className="home-ember hidden sm:block"
            style={{
              left: `${left}%`,
              top: `${12 + (i % 4) * 9}%`,
              animationDelay: `${i * 1.1}s`,
              animationDuration: `${9 + (i % 3) * 2}s`,
            }}
          />
        ))}
      </div>
      {children}
    </div>
  );
}
