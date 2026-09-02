"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { createNightGrabAudio } from "@/lib/night-grab-audio";
import {
  BADGES,
  LOADOUTS,
  LOOT,
  boardRank,
  pickFloor,
  pickLoadoutTrio,
  shareText,
  type BadgeId,
  type FloorId,
  type LoadoutId,
} from "@/lib/night-grab";
import { TILE } from "@/lib/night-grab-floors";
import { createRun, scorecard, stepRun, type Scorecard } from "@/lib/night-grab-engine";

type Phase = "menu" | "loadout" | "play" | "score";
type BoardRow = {
  username: string;
  score: number;
  extracted: number;
  clocked: number;
  combo: number;
  floor: string;
  loadout: string;
  badges?: BadgeId[];
};

const LAST_FLOOR = "ng-last-floor";

function haptic(ms: number) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* ignore */
  }
}

function lootColor(kind: string) {
  if (kind === "ember") return "#f97316";
  if (kind === "jewelry") return "#67e8f9";
  if (kind === "watch") return "#fde68a";
  if (kind === "phone") return "#a3a3a3";
  if (kind === "keycard") return "#5eead4";
  return "#86efac";
}

export function NightGrab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("menu");
  const [card, setCard] = useState<Scorecard | null>(null);
  const [best, setBest] = useState(0);
  const [metaBadges, setMetaBadges] = useState<BadgeId[]>([]);
  const [board, setBoard] = useState<BoardRow[]>([]);
  const [msg, setMsg] = useState("");
  const [muted, setMuted] = useState(false);
  const [picks, setPicks] = useState<LoadoutId[]>(() => pickLoadoutTrio());
  const [loadout, setLoadout] = useState<LoadoutId | null>(null);
  const [hud, setHud] = useState({ t: 60, combo: 1, bag: 0, bank: 0, alert: false });
  const audio = useMemo(() => createNightGrabAudio(), []);
  const keys = useRef<Record<string, boolean>>({});
  const stick = useRef({ ax: 0, ay: 0, id: -1 });
  const sneakHeld = useRef(false);
  const grabOnce = useRef(false);
  const dumpOnce = useRef(false);
  const smokeOnce = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const id = session?.user?.id || null;
      setUserId(id);
      if (id) {
        fetch(`/api/night-grab/score?userId=${id}`)
          .then((r) => r.json())
          .then((d) => {
            if (d.meta?.best_score) setBest(d.meta.best_score);
            if (d.meta?.badges) setMetaBadges(d.meta.badges);
          })
          .catch(() => {});
      }
    });
    fetch("/api/night-grab/score")
      .then((r) => r.json())
      .then((d) => setBoard(d.rows || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    audio.setMuted(muted);
  }, [audio, muted]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true;
      if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(e.key.toLowerCase())) e.preventDefault();
      if (e.repeat) return;
      if (e.key.toLowerCase() === "q") dumpOnce.current = true;
      if (e.key === " " || e.key.toLowerCase() === "e") grabOnce.current = true;
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    if (phase !== "play") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    audio.unlock();

    const last = (typeof sessionStorage !== "undefined" ? sessionStorage.getItem(LAST_FLOOR) : null) as FloorId | null;
    const floorId = pickFloor(last);
    try {
      sessionStorage.setItem(LAST_FLOOR, floorId);
    } catch {
      /* ignore */
    }
    const run = createRun(floorId, loadout || "fast-hands");
    let camX = run.x;
    let camY = run.y;
    let w = 360;
    let h = 640;
    let lastTs = performance.now();
    let raf = 0;
    let hudAcc = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      const maxW = Math.min(460, parent?.clientWidth || 360);
      const portrait = window.innerHeight >= window.innerWidth;
      w = maxW;
      h = Math.min(portrait ? 780 : 560, Math.floor(window.innerHeight * (portrait ? 0.72 : 0.62)));
      canvas.width = w;
      canvas.height = h;
    };
    resize();
    window.addEventListener("resize", resize);

    const prevent = (e: TouchEvent) => {
      if (wrapRef.current?.contains(e.target as Node)) e.preventDefault();
    };
    document.addEventListener("touchmove", prevent, { passive: false });

    const loop = (ts: number) => {
      const dt = Math.min(0.033, (ts - lastTs) / 1000);
      lastTs = ts;
      const k = keys.current;
      let ax = stick.current.ax;
      let ay = stick.current.ay;
      if (k["a"] || k["arrowleft"]) ax -= 1;
      if (k["d"] || k["arrowright"]) ax += 1;
      if (k["w"] || k["arrowup"]) ay -= 1;
      if (k["s"] || k["arrowdown"]) ay += 1;
      const sneak = sneakHeld.current || k["shift"];
      const grab = grabOnce.current;
      const dump = dumpOnce.current;
      const smoke = smokeOnce.current;
      grabOnce.current = false;
      dumpOnce.current = false;
      smokeOnce.current = false;
      stepRun(run, dt, { ax, ay, sneak, grab, dump, smoke });

      for (const ev of run.events) {
        if (ev === "grab") audio.grab();
        if (ev === "ember") {
          audio.ember();
          haptic(18);
        }
        if (ev === "extract") {
          audio.extract();
          haptic(22);
        }
        if (ev === "clocked" || ev === "warn") {
          audio.clocked();
          haptic(40);
        }
        if (ev === "ten") audio.ten();
        if (ev === "noise") audio.noise();
      }

      camX += (run.x - camX) * Math.min(1, dt * 6.2);
      camY += (run.y - camY) * Math.min(1, dt * 6.2);
      const shake = run.shake > 0 ? (Math.random() - 0.5) * 5 : 0;
      const ox = camX - w / 2 + shake;
      const oy = camY - h / 2 + shake;

      ctx.fillStyle = "#07090b";
      ctx.fillRect(0, 0, w, h);

      const def = run.floor;
      for (let ty = 0; ty < def.h; ty++) {
        for (let tx = 0; tx < def.w; tx++) {
          const kind = def.tiles[ty][tx];
          const x = tx * TILE - ox;
          const y = ty * TILE - oy;
          if (x < -TILE || y < -TILE || x > w || y > h) continue;
          if (kind === "wall") ctx.fillStyle = "#12161c";
          else if (kind === "glass") ctx.fillStyle = "#14303a";
          else if (kind === "noise") ctx.fillStyle = "#1a1710";
          else if (kind === "extract") ctx.fillStyle = "#0f3d3a";
          else if (kind === "vent") ctx.fillStyle = "#1b2430";
          else ctx.fillStyle = "#0c1116";
          ctx.fillRect(x, y, TILE - 1, TILE - 1);
          if (kind === "noise") {
            ctx.fillStyle = "rgba(180,140,60,0.18)";
            ctx.fillRect(x + 4, y + 4, TILE - 10, 3);
            ctx.fillRect(x + 4, y + 14, TILE - 10, 3);
          }
        }
      }

      const ex = def.extract.x - ox;
      const ey = def.extract.y - oy;
      ctx.save();
      ctx.shadowColor = "rgba(45,212,191,0.7)";
      ctx.shadowBlur = 16;
      ctx.fillStyle = "#2dd4bf";
      ctx.fillRect(ex - 10, ey - 16, 20, 32);
      ctx.restore();
      ctx.fillStyle = "#042f2e";
      ctx.font = "8px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("OUT", ex, ey + 3);

      if (def.powerBox && !run.powerUsed) {
        ctx.fillStyle = "#64748b";
        ctx.fillRect(def.powerBox.x - ox - 6, def.powerBox.y - oy - 8, 12, 16);
      }
      if (def.vent) {
        ctx.strokeStyle = "rgba(148,163,184,0.45)";
        ctx.strokeRect(def.vent.x - ox - 8, def.vent.y - oy - 8, 16, 16);
      }

      for (const item of run.loot) {
        if (item.taken || (item.locked && !run.unlocked)) continue;
        ctx.fillStyle = lootColor(item.kind);
        ctx.beginPath();
        ctx.arc(item.x - ox, item.y - oy, item.kind === "ember" ? 5.5 : 4, 0, Math.PI * 2);
        ctx.fill();
      }
      if (run.dropped) {
        ctx.fillStyle = "#5eead4";
        ctx.fillRect(run.dropped.x - ox - 7, run.dropped.y - oy - 5, 14, 10);
      }

      const drawCone = (x: number, y: number, ang: number, half: number, len: number, color: string) => {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.arc(x, y, len, ang - half, ang + half);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
      };
      const alert = run.alert > 0;
      for (const g of run.guards) {
        const gx = g.x - ox;
        const gy = g.y - oy;
        if (run.smoke <= 0) {
          drawCone(gx, gy, g.heading, alert ? 0.5 : 0.42, alert ? 102 : 88, "rgba(251,191,36,0.16)");
        }
        ctx.fillStyle = g.coffee ? "#78716c" : "#e7e5e4";
        ctx.beginPath();
        ctx.arc(gx, gy, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(251,191,36,0.7)";
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.lineTo(gx + Math.cos(g.heading) * 12, gy + Math.sin(g.heading) * 12);
        ctx.stroke();
      }
      for (const cam of run.cams) {
        const cx = cam.x - ox;
        const cy = cam.y - oy;
        ctx.fillStyle = run.camerasDead > 0 || !cam.awake ? "#334155" : cam.windup > 0 ? "#f87171" : "#94a3b8";
        ctx.fillRect(cx - 5, cy - 5, 10, 10);
        if (cam.awake && run.camerasDead <= 0 && run.smoke <= 0) {
          drawCone(cx, cy, cam.angle, alert ? 0.38 : 0.3, alert ? 120 : 108, "rgba(248,113,113,0.12)");
        }
      }

      ctx.fillStyle = "#99f6e4";
      ctx.beginPath();
      ctx.arc(run.x - ox, run.y - oy, sneak ? 7 : 8, 0, Math.PI * 2);
      ctx.fill();
      if (run.bag.length) {
        ctx.fillStyle = "#134e4a";
        ctx.fillRect(run.x - ox + 6, run.y - oy - 4, 7 + run.bag.length, 8);
      }

      ctx.fillStyle = run.t <= 3 ? "#fb7185" : run.t <= 10 ? "#fbbf24" : "#ccfbf1";
      ctx.font = "700 22px ui-sans-serif, system-ui";
      ctx.textAlign = "left";
      ctx.fillText(run.t.toFixed(1), 12, 28);
      ctx.font = "600 13px ui-sans-serif";
      ctx.fillStyle = "#5eead4";
      ctx.fillText(`${run.combo}x`, 12, 48);
      ctx.fillStyle = "#a8a29e";
      ctx.font = "11px ui-sans-serif";
      ctx.fillText(`bag ${run.bag.length} · bank ${run.extractedValue}`, 12, 64);
      ctx.textAlign = "right";
      ctx.fillStyle = "#99f6e4";
      ctx.fillText(def.name, w - 12, 24);

      if (run.alert > 0) {
        ctx.strokeStyle = `rgba(45,212,191,${0.25 + Math.sin(ts / 90) * 0.2})`;
        ctx.lineWidth = 8;
        ctx.strokeRect(3, 3, w - 6, h - 6);
      }
      if (run.stamp > 0) {
        ctx.save();
        ctx.translate(w * 0.62, h * 0.28);
        ctx.rotate(-0.2);
        ctx.strokeStyle = "rgba(251,113,133,0.85)";
        ctx.lineWidth = 3;
        ctx.strokeRect(-48, -16, 96, 32);
        ctx.fillStyle = "rgba(254,205,211,0.9)";
        ctx.font = "700 16px ui-sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("clocked", 0, 6);
        ctx.restore();
      }
      if (run.flash > 0) {
        ctx.fillStyle = `rgba(45,212,191,${run.flash})`;
        ctx.fillRect(0, 0, w, h);
      }

      hudAcc += dt;
      if (hudAcc > 0.12) {
        hudAcc = 0;
        setHud({ t: run.t, combo: run.combo, bag: run.bag.length, bank: run.extractedValue, alert: run.alert > 0 });
      }

      if (run.ended) {
        const sc = scorecard(run);
        setCard(sc);
        setPhase("score");
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("touchmove", prevent);
    };
  }, [phase, loadout, audio]);

  const goLoadout = () => {
    audio.unlock();
    setPicks(pickLoadoutTrio());
    setLoadout(null);
    setCard(null);
    setMsg("");
    setPhase("loadout");
  };

  const playWith = (id: LoadoutId) => {
    setLoadout(id);
    setPhase("play");
  };

  const submit = async () => {
    if (!userId || !card) {
      setMsg("Join to keep the board and badges.");
      return;
    }
    const res = await fetch("/api/night-grab/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        score: card.total,
        extracted: card.extracted,
        clocked: card.clocked,
        combo: card.combo,
        floor: card.floor,
        loadout: card.loadout,
        badges: card.badges,
      }),
    });
    const data = await res.json();
    if (!res.ok) setMsg(data.error || "Couldn’t save");
    else {
      setMsg("On the board.");
      if (data.meta?.best_score) setBest(data.meta.best_score);
      if (data.meta?.badges) setMetaBadges(data.meta.badges);
      const r = await fetch("/api/night-grab/score");
      const d = await r.json();
      setBoard(d.rows || []);
    }
  };

  const share = async () => {
    if (!card) return;
    const text = shareText(card.total, card.roast);
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        setMsg("Copied.");
      }
    } catch {
      /* ignore */
    }
  };

  const isNew = !!card && card.total > 0 && card.total > best;
  const rank = card ? boardRank(card.total, board) : 0;

  const onStick = (e: React.PointerEvent) => {
    const el = e.currentTarget.getBoundingClientRect();
    const cx = el.left + el.width / 2;
    const cy = el.top + el.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const max = el.width * 0.42;
    const mag = Math.hypot(dx, dy);
    const dead = max * 0.22;
    if (mag < dead) {
      stick.current.ax = 0;
      stick.current.ay = 0;
      return;
    }
    const nx = dx / max;
    const ny = dy / max;
    const m = Math.min(1, Math.hypot(nx, ny));
    stick.current.ax = (nx / (m || 1)) * m;
    stick.current.ay = (ny / (m || 1)) * m;
  };

  const endStick = () => {
    stick.current.ax = 0;
    stick.current.ay = 0;
    stick.current.id = -1;
  };

  return (
    <div className="home-den relative overflow-hidden min-h-[calc(100vh-8rem)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-16 top-[18%] h-72 w-72 rounded-full bg-teal-500/20 blur-3xl" />
        <div className="absolute -right-10 top-[32%] h-80 w-80 rounded-full bg-emerald-700/15 blur-3xl" />
        <div className="den-grain" />
      </div>
      <div className="relative max-w-lg mx-auto px-4 pt-8 pb-24">
        <div className="flex items-center justify-between gap-3">
          <Link href="/playground" className="text-sm text-neutral-500 hover:text-neutral-300">
            ← Playground
          </Link>
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            className="text-[11px] uppercase tracking-wide text-neutral-500 border border-neutral-800 rounded-full px-3 py-1"
          >
            {muted ? "Sound off" : "Sound on"}
          </button>
        </div>
        <div className="text-center mt-4 mb-6">
          <p className="text-[10px] uppercase tracking-[0.28em] text-teal-300/80 mb-2">Night Grab</p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-teal-100 via-white to-emerald-200">
            Sixty seconds
          </h1>
          <p className="mt-2 text-sm text-neutral-500">Grab the bag. Don’t get clocked.</p>
        </div>

        {phase === "menu" && (
          <div className="rounded-3xl border border-teal-900/40 bg-black/55 p-6 space-y-4">
            <p className="text-sm text-neutral-300 leading-relaxed">
              Dark building. One minute. Steal, jam it through the teal door, don’t get seen. Clocked dumps the bag, not the run.
            </p>
            <ul className="text-xs text-neutral-500 space-y-1">
              <li>Left thumb moves. GRAB takes. Sneak is a hold on the lower-right rim.</li>
              <li>Q dumps the bag. Shift sneaks. Space / E grabs.</li>
              <li>One loadout a run. Credits for a second slot later.</li>
            </ul>
            <button
              type="button"
              onClick={goLoadout}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-b from-teal-400 via-teal-700 to-emerald-950 text-white font-semibold"
            >
              PLAY
            </button>
            {!userId && (
              <Link href="/join" className="block text-center text-sm text-teal-200">
                Join to keep scores and badges →
              </Link>
            )}
            {metaBadges.length > 0 && (
              <p className="text-center text-[11px] text-teal-200/80 tracking-wide">
                {metaBadges.map((b) => BADGES[b].mark).join("  ")}
              </p>
            )}
          </div>
        )}

        {phase === "loadout" && (
          <div className="rounded-3xl border border-teal-900/40 bg-black/55 p-5 space-y-3">
            <p className="text-sm text-neutral-200">One pick. That’s the run.</p>
            {picks.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => playWith(id)}
                className="w-full text-left rounded-2xl border border-teal-800/50 bg-black/40 px-4 py-4 min-h-[4.5rem]"
              >
                <p className="text-base text-teal-50 font-medium">{LOADOUTS[id].label}</p>
                <p className="text-xs text-neutral-500 mt-1">{LOADOUTS[id].line}</p>
              </button>
            ))}
            <div className="rounded-2xl border border-neutral-800 px-4 py-3 opacity-50">
              <p className="text-sm text-neutral-400">Second loadout</p>
              <p className="text-xs text-neutral-600">Credits soon</p>
            </div>
            <button type="button" onClick={() => setPhase("menu")} className="w-full text-xs text-neutral-500 pt-1">
              Back
            </button>
          </div>
        )}

        {phase === "play" && (
          <div ref={wrapRef} className="space-y-2 overscroll-none" style={{ touchAction: "none" }}>
            <div
              className="relative rounded-2xl overflow-hidden border border-teal-900/35 bg-black shadow-[0_0_70px_-18px_rgba(45,212,191,0.4)]"
              style={{ touchAction: "none" }}
            >
              <canvas ref={canvasRef} className="w-full block" style={{ touchAction: "none" }} />
              <div
                className="absolute left-3 w-[7.5rem] h-[7.5rem] rounded-full border border-white/15 bg-black/35"
                style={{ bottom: "max(1.1rem, env(safe-area-inset-bottom))" }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.currentTarget.setPointerCapture(e.pointerId);
                  onStick(e);
                }}
                onPointerMove={(e) => {
                  if (e.buttons) onStick(e);
                }}
                onPointerUp={endStick}
                onPointerCancel={endStick}
              />
              <button
                type="button"
                className="absolute right-3 w-[4.6rem] h-[4.6rem] rounded-full border border-teal-300/50 bg-gradient-to-b from-teal-500/90 to-emerald-950 text-white text-xs uppercase tracking-wide"
                style={{ bottom: "max(3.4rem, calc(env(safe-area-inset-bottom) + 2.4rem))" }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  grabOnce.current = true;
                }}
              >
                Grab
              </button>
              <button
                type="button"
                className="absolute right-2 h-12 w-[6.4rem] rounded-full border border-white/20 bg-black/55 text-[10px] uppercase tracking-wide text-teal-100"
                style={{ bottom: "max(0.55rem, env(safe-area-inset-bottom))" }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  sneakHeld.current = true;
                }}
                onPointerUp={() => {
                  sneakHeld.current = false;
                }}
                onPointerLeave={() => {
                  sneakHeld.current = false;
                }}
              >
                Sneak
              </button>
              {hud.bag > 0 && (
                <button
                  type="button"
                  className="absolute right-4 top-3 text-[10px] uppercase tracking-wide text-neutral-300 border border-white/15 rounded-full px-3 py-1 bg-black/50"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    dumpOnce.current = true;
                  }}
                >
                  Dump
                </button>
              )}
              {loadout === "smoke" && (
                <button
                  type="button"
                  className="absolute left-3 top-3 text-[10px] uppercase tracking-wide text-teal-100 border border-teal-700/50 rounded-full px-3 py-1 bg-black/50"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    smokeOnce.current = true;
                  }}
                >
                  Smoke
                </button>
              )}
            </div>
          </div>
        )}

        {phase === "score" && card && (
          <div className="rounded-3xl border border-teal-500/25 bg-black/60 p-6 space-y-4">
            <div className="text-center">
              <p className="text-5xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-teal-100 to-emerald-200">
                {card.total}
              </p>
              {isNew && card.total > 0 && <p className="mt-1 text-xs uppercase tracking-[0.2em] text-teal-200">New best</p>}
              <p className="mt-3 text-sm text-neutral-300">{card.roast}</p>
            </div>
            <div className="text-sm text-neutral-400 space-y-1">
              <p>Extracted {card.extracted} × {card.combo}x = {card.lootLine}</p>
              <p>Time bonus {card.timeBonus}</p>
              <p>Clocked {card.clocked}</p>
              <p>Total {card.total}</p>
            </div>
            {card.badges.length > 0 && (
              <p className="text-center text-[11px] text-teal-200 tracking-widest">
                {card.badges.map((b) => BADGES[b].mark).join("  ")}
              </p>
            )}
            <p className="text-center text-xs text-neutral-500">Board slot #{rank}</p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={goLoadout}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-b from-teal-400 via-teal-700 to-emerald-950 text-white font-semibold"
              >
                PLAY AGAIN
              </button>
              <button
                type="button"
                onClick={() => setPhase("loadout")}
                className="w-full py-2.5 rounded-2xl border border-neutral-700 text-sm text-neutral-200"
              >
                Loadout again
              </button>
              <button type="button" onClick={share} className="w-full py-2 text-sm text-teal-100">
                Share
              </button>
              <button type="button" onClick={submit} className="w-full py-2 text-sm text-neutral-300">
                {userId ? "Save score" : "Join to save score"}
              </button>
              {!userId && (
                <Link href="/join" className="block text-center text-sm text-teal-200">
                  Join to save →
                </Link>
              )}
            </div>
            {msg && <p className="text-xs text-center text-teal-200">{msg}</p>}
          </div>
        )}

        {board.length > 0 && phase !== "play" && (
          <div className="mt-8 rounded-2xl border border-neutral-800 bg-black/40 p-4 max-h-72 overflow-y-auto">
            <p className="text-[10px] uppercase tracking-wide text-neutral-500 mb-2">Tonight’s board</p>
            <div className="space-y-1">
              {board.map((r, i) => (
                <p
                  key={`${r.username}-${i}`}
                  className={`text-xs flex justify-between gap-2 ${i < 10 ? "text-teal-100" : "text-neutral-500"}`}
                >
                  <span className="truncate">
                    {r.username}{" "}
                    <span className="text-[9px] tracking-widest text-teal-500/80">
                      {(r.badges || []).map((b) => BADGES[b]?.mark || "").join(" ")}
                    </span>
                  </span>
                  <span>{r.score}</span>
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
