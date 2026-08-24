"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { isAdmin } from "@/lib/admin";

type Phase = "menu" | "play" | "score";
type Power = "repair" | "rapid" | "shield" | "oil" | "missile" | "nitro" | "star";

type Ent = {
  x: number;
  y: number;
  w: number;
  h: number;
  vy: number;
  kind: "hostile" | "civ" | "truck" | "bike" | "pickup";
  hp: number;
  lane: number;
};

type Bullet = { x: number; y: number; vy: number; dmg: number };
type Slick = { x: number; y: number; life: number };
type Pickup = { x: number; y: number; kind: Power; vy: number };

type Score = {
  score: number;
  grade: string;
  title: string;
  line: string;
  distance: number;
  kills: number;
  civHits: number;
  comboMax: number;
};

function gradeOf(s: number, kills: number, civ: number) {
  const clean = civ === 0 ? 1.15 : civ === 1 ? 0.95 : 0.75;
  const v = s * clean + kills * 40;
  if (v > 12000) return { grade: "S", title: "Ghost on the interstate", line: "Clean, loud, gone." };
  if (v > 8000) return { grade: "A", title: "Night runner", line: "Hostiles felt that." };
  if (v > 4500) return { grade: "B", title: "Paid passenger", line: "Solid shift." };
  if (v > 2000) return { grade: "C", title: "On-ramp heat", line: "You made noise." };
  return { grade: "D", title: "Still learning the lanes", line: "One more. Always one more." };
}

export function HighwayHunter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [admin, setAdmin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("menu");
  const [score, setScore] = useState<Score | null>(null);
  const [board, setBoard] = useState<{ username: string; score: number; grade: string }[]>([]);
  const [msg, setMsg] = useState("");
  const keys = useRef<Record<string, boolean>>({});
  const touchX = useRef<number | null>(null);
  const fireHeld = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
      setAdmin(isAdmin(session?.user));
    });
    fetch("/api/highway/score")
      .then((r) => r.json())
      .then((d) => setBoard(d.rows || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (phase !== "play" || !admin) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 360;
    let h = 640;
    const resize = () => {
      const parent = canvas.parentElement;
      const maxW = Math.min(420, parent?.clientWidth || 360);
      w = maxW;
      h = Math.min(720, Math.floor(maxW * 1.75));
      canvas.width = w;
      canvas.height = h;
    };
    resize();

    const roadL = w * 0.12;
    const roadR = w * 0.88;
    const lanes = [0.28, 0.5, 0.72].map((t) => roadL + (roadR - roadL) * t);

    const player = {
      x: lanes[1],
      y: h * 0.78,
      w: 28,
      h: 46,
      armor: 3,
      inv: 0,
      rapid: 0,
      shield: 0,
      nitro: 0,
      missiles: 0,
      oil: 0,
    };

    let scroll = 0;
    let speed = 4.2;
    let tick = 0;
    let spawnT = 0;
    let pickupT = 0;
    let scoreN = 0;
    let distance = 0;
    let kills = 0;
    let civHits = 0;
    let combo = 0;
    let comboMax = 0;
    let shootCd = 0;
    let usedContinue = false;
    let alive = true;

    const ents: Ent[] = [];
    const bullets: Bullet[] = [];
    const slicks: Slick[] = [];
    const pickups: Pickup[] = [];
    const particles: { x: number; y: number; vx: number; vy: number; life: number; c: string }[] = [];

    const onKey = (e: KeyboardEvent, down: boolean) => {
      keys.current[e.key.toLowerCase()] = down;
      if (["arrowleft", "arrowright", "arrowup", "arrowdown", " "].includes(e.key.toLowerCase())) e.preventDefault();
    };
    const kd = (e: KeyboardEvent) => onKey(e, true);
    const ku = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);

    const onTouch = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      if (!t) {
        touchX.current = null;
        fireHeld.current = false;
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const x = ((t.clientX - rect.left) / rect.width) * w;
      const y = ((t.clientY - rect.top) / rect.height) * h;
      touchX.current = x;
      fireHeld.current = y < h * 0.72;
    };
    canvas.addEventListener("touchstart", onTouch, { passive: false });
    canvas.addEventListener("touchmove", onTouch, { passive: false });
    canvas.addEventListener("touchend", () => {
      touchX.current = null;
      fireHeld.current = false;
    });

    const boom = (x: number, y: number, c: string) => {
      for (let i = 0; i < 10; i++) {
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          life: 20 + Math.random() * 15,
          c,
        });
      }
    };

    const endRun = () => {
      alive = false;
      const g = gradeOf(scoreN, kills, civHits);
      setScore({
        score: Math.floor(scoreN),
        grade: g.grade,
        title: g.title,
        line: g.line,
        distance: Math.floor(distance),
        kills,
        civHits,
        comboMax,
      });
      setPhase("score");
    };

    let raf = 0;
    const loop = () => {
      if (!alive) return;
      tick += 1;
      speed = 4.2 + Math.min(5, distance / 4000) + (player.nitro > 0 ? 2.4 : 0);
      scroll = (scroll + speed) % 40;
      distance += speed * 0.35;
      scoreN += speed * 0.15 + combo * 0.05;

      if (player.inv > 0) player.inv -= 1;
      if (player.rapid > 0) player.rapid -= 1;
      if (player.shield > 0) player.shield -= 1;
      if (player.nitro > 0) player.nitro -= 1;
      if (shootCd > 0) shootCd -= 1;

      // steer
      let dx = 0;
      if (keys.current["arrowleft"] || keys.current["a"]) dx -= 1;
      if (keys.current["arrowright"] || keys.current["d"]) dx += 1;
      if (touchX.current != null) {
        const target = touchX.current;
        dx = target < player.x - 6 ? -1 : target > player.x + 6 ? 1 : 0;
      }
      player.x += dx * (player.nitro > 0 ? 6.5 : 5.2);
      player.x = Math.max(roadL + 20, Math.min(roadR - 20, player.x));

      const wantFire = keys.current[" "] || keys.current["z"] || fireHeld.current;
      if (wantFire && shootCd <= 0) {
        const dmg = player.rapid > 0 ? 2 : 1;
        bullets.push({ x: player.x - 8, y: player.y - 20, vy: -11, dmg });
        bullets.push({ x: player.x + 8, y: player.y - 20, vy: -11, dmg });
        shootCd = player.rapid > 0 ? 6 : 12;
        if (player.missiles > 0 && tick % 18 === 0) {
          bullets.push({ x: player.x, y: player.y - 24, vy: -14, dmg: 4 });
          player.missiles -= 1;
        }
      }
      if ((keys.current["x"] || keys.current["shift"]) && player.oil > 0 && tick % 15 === 0) {
        slicks.push({ x: player.x, y: player.y + 30, life: 90 });
        player.oil -= 1;
      }

      // spawn
      spawnT -= 1;
      if (spawnT <= 0) {
        const lane = lanes[Math.floor(Math.random() * lanes.length)];
        const roll = Math.random();
        let kind: Ent["kind"] = "hostile";
        if (roll < 0.28) kind = "civ";
        else if (roll < 0.4) kind = "bike";
        else if (roll < 0.52) kind = "truck";
        const hp = kind === "truck" ? 5 : kind === "bike" ? 1 : kind === "civ" ? 1 : 2;
        ents.push({
          x: lane,
          y: -60,
          w: kind === "truck" ? 36 : kind === "bike" ? 18 : 26,
          h: kind === "truck" ? 56 : kind === "bike" ? 34 : 44,
          vy: speed * (0.35 + Math.random() * 0.35),
          kind,
          hp,
          lane,
        });
        spawnT = Math.max(22, 48 - distance / 800);
      }

      pickupT -= 1;
      if (pickupT <= 0) {
        const kinds: Power[] = ["repair", "rapid", "shield", "oil", "missile", "nitro", "star"];
        const kind = kinds[Math.floor(Math.random() * kinds.length)];
        pickups.push({
          x: lanes[Math.floor(Math.random() * lanes.length)],
          y: -30,
          kind,
          vy: speed * 0.5,
        });
        pickupT = 160 + Math.random() * 80;
      }

      // move ents
      for (const e of ents) {
        e.y += e.vy + speed * 0.25;
        if (e.kind === "hostile" || e.kind === "truck") {
          e.x += Math.sin(tick / 25 + e.lane) * 0.4;
        }
      }
      for (const b of bullets) b.y += b.vy;
      for (const s of slicks) {
        s.y += speed * 0.6;
        s.life -= 1;
      }
      for (const p of pickups) p.y += p.vy + speed * 0.2;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
      }

      // bullets vs ents
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if (b.y < -20) {
          bullets.splice(i, 1);
          continue;
        }
        for (let j = ents.length - 1; j >= 0; j--) {
          const e = ents[j];
          if (Math.abs(b.x - e.x) < e.w * 0.55 && Math.abs(b.y - e.y) < e.h * 0.55) {
            e.hp -= b.dmg;
            bullets.splice(i, 1);
            boom(e.x, e.y, e.kind === "civ" ? "#94a3b8" : "#f97316");
            if (e.hp <= 0) {
              if (e.kind === "civ") {
                civHits += 1;
                combo = 0;
                scoreN = Math.max(0, scoreN - 120);
              } else {
                kills += 1;
                combo += 1;
                comboMax = Math.max(comboMax, combo);
                scoreN += 80 + combo * 12 + (e.kind === "truck" ? 60 : 0);
              }
              ents.splice(j, 1);
            }
            break;
          }
        }
      }

      // slicks
      for (const s of slicks) {
        for (let j = ents.length - 1; j >= 0; j--) {
          const e = ents[j];
          if (e.kind === "civ") continue;
          if (Math.abs(s.x - e.x) < 30 && Math.abs(s.y - e.y) < 30) {
            e.hp = 0;
            kills += 1;
            combo += 1;
            comboMax = Math.max(comboMax, combo);
            scoreN += 100;
            boom(e.x, e.y, "#a3e635");
            ents.splice(j, 1);
          }
        }
      }

      // pickups
      for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        if (Math.abs(p.x - player.x) < 28 && Math.abs(p.y - player.y) < 36) {
          if (p.kind === "repair") player.armor = Math.min(3, player.armor + 1);
          if (p.kind === "rapid") player.rapid = 240;
          if (p.kind === "shield") player.shield = 200;
          if (p.kind === "oil") player.oil += 3;
          if (p.kind === "missile") player.missiles += 4;
          if (p.kind === "nitro") player.nitro = 160;
          if (p.kind === "star") scoreN += 250;
          pickups.splice(i, 1);
          boom(p.x, p.y, "#e879f9");
        } else if (p.y > h + 40) pickups.splice(i, 1);
      }

      // collide player
      for (let j = ents.length - 1; j >= 0; j--) {
        const e = ents[j];
        if (Math.abs(e.x - player.x) < (e.w + player.w) * 0.38 && Math.abs(e.y - player.y) < (e.h + player.h) * 0.38) {
          if (player.inv > 0 || player.shield > 0) {
            if (e.kind !== "civ") {
              ents.splice(j, 1);
              kills += 1;
              scoreN += 40;
              boom(e.x, e.y, "#38bdf8");
            }
            continue;
          }
          player.armor -= 1;
          player.inv = 50;
          combo = 0;
          boom(player.x, player.y, "#ef4444");
          if (e.kind === "civ") civHits += 1;
          else {
            ents.splice(j, 1);
          }
          if (player.armor < 0) {
            if (!usedContinue) {
              usedContinue = true;
              player.armor = 1;
              player.inv = 90;
              player.shield = 60;
              scoreN = Math.floor(scoreN * 0.85);
              setMsg("Second wind — armor back, small score tax");
              setTimeout(() => setMsg(""), 2000);
            } else {
              endRun();
              return;
            }
          }
        }
      }

      // cleanup
      for (let i = ents.length - 1; i >= 0; i--) if (ents[i].y > h + 80) ents.splice(i, 1);
      for (let i = slicks.length - 1; i >= 0; i--) if (slicks[i].life <= 0 || slicks[i].y > h + 40) slicks.splice(i, 1);
      for (let i = particles.length - 1; i >= 0; i--) if (particles[i].life <= 0) particles.splice(i, 1);

      // draw
      ctx.fillStyle = "#050508";
      ctx.fillRect(0, 0, w, h);
      // shoulders
      ctx.fillStyle = "#0a0a12";
      ctx.fillRect(0, 0, roadL, h);
      ctx.fillRect(roadR, 0, w - roadR, h);
      // road
      const grad = ctx.createLinearGradient(roadL, 0, roadR, 0);
      grad.addColorStop(0, "#12121a");
      grad.addColorStop(0.5, "#1a1a28");
      grad.addColorStop(1, "#12121a");
      ctx.fillStyle = grad;
      ctx.fillRect(roadL, 0, roadR - roadL, h);
      // lines
      ctx.strokeStyle = "rgba(251,191,36,0.35)";
      ctx.setLineDash([18, 16]);
      ctx.lineDashOffset = -scroll;
      ctx.beginPath();
      ctx.moveTo(w * 0.5, 0);
      ctx.lineTo(w * 0.5, h);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(244,114,182,0.25)";
      ctx.strokeRect(roadL + 2, 0, roadR - roadL - 4, h);

      // neon city glow
      ctx.fillStyle = "rgba(168,85,247,0.06)";
      ctx.fillRect(0, 0, roadL, h);
      ctx.fillStyle = "rgba(244,63,94,0.05)";
      ctx.fillRect(roadR, 0, w - roadR, h);

      for (const s of slicks) {
        ctx.fillStyle = "rgba(163,230,53,0.35)";
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, 22, 10, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const p of pickups) {
        ctx.fillStyle = "#e879f9";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "9px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(p.kind[0].toUpperCase(), p.x, p.y + 3);
      }

      for (const e of ents) {
        if (e.kind === "civ") ctx.fillStyle = "#64748b";
        else if (e.kind === "truck") ctx.fillStyle = "#dc2626";
        else if (e.kind === "bike") ctx.fillStyle = "#f59e0b";
        else ctx.fillStyle = "#ef4444";
        roundRect(ctx, e.x - e.w / 2, e.y - e.h / 2, e.w, e.h, 6);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fillRect(e.x - e.w * 0.3, e.y - e.h * 0.35, e.w * 0.6, e.h * 0.2);
      }

      for (const b of bullets) {
        ctx.fillStyle = "#fde68a";
        ctx.fillRect(b.x - 2, b.y - 8, 4, 12);
      }

      // player
      if (player.inv <= 0 || tick % 4 < 2) {
        ctx.fillStyle = player.shield > 0 ? "#38bdf8" : "#f472b6";
        roundRect(ctx, player.x - player.w / 2, player.y - player.h / 2, player.w, player.h, 7);
        ctx.fill();
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(player.x - 8, player.y - 8, 16, 10);
        if (player.nitro > 0) {
          ctx.fillStyle = "rgba(251,191,36,0.5)";
          ctx.beginPath();
          ctx.moveTo(player.x - 6, player.y + player.h / 2);
          ctx.lineTo(player.x, player.y + player.h / 2 + 16);
          ctx.lineTo(player.x + 6, player.y + player.h / 2);
          ctx.fill();
        }
      }

      for (const p of particles) {
        ctx.globalAlpha = Math.max(0, p.life / 30);
        ctx.fillStyle = p.c;
        ctx.fillRect(p.x, p.y, 3, 3);
        ctx.globalAlpha = 1;
      }

      // HUD
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, 0, w, 52);
      ctx.fillStyle = "#fde68a";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`${Math.floor(scoreN)}`, 12, 22);
      ctx.fillStyle = "#a3a3a3";
      ctx.font = "11px sans-serif";
      ctx.fillText(`${Math.floor(distance)}m · x${combo}`, 12, 40);
      ctx.textAlign = "right";
      ctx.fillStyle = "#fda4af";
      ctx.fillText("♥".repeat(Math.max(0, player.armor)) + "♡".repeat(Math.max(0, 3 - player.armor)), w - 12, 22);
      const kit = [];
      if (player.rapid > 0) kit.push("RF");
      if (player.shield > 0) kit.push("SH");
      if (player.nitro > 0) kit.push("N2");
      if (player.missiles > 0) kit.push(`M${player.missiles}`);
      if (player.oil > 0) kit.push(`O${player.oil}`);
      ctx.fillStyle = "#e9d5ff";
      ctx.fillText(kit.join(" "), w - 12, 40);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
    };
  }, [phase, admin]);

  const submit = async () => {
    if (!userId || !score) return;
    const res = await fetch("/api/highway/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        score: score.score,
        grade: score.grade,
        distance: score.distance,
        kills: score.kills,
        civHits: score.civHits,
        comboMax: score.comboMax,
      }),
    });
    const data = await res.json();
    if (!res.ok) setMsg(data.error || "Score save failed — run the SQL?");
    else {
      setMsg("On the board");
      const r = await fetch("/api/highway/score");
      const d = await r.json();
      setBoard(d.rows || []);
    }
  };

  return (
    <div className="relative overflow-hidden min-h-[calc(100vh-8rem)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="pg-orb pg-orb-a" />
        <div className="pg-orb pg-orb-b" />
        <div className="den-grain" />
      </div>
      <div className="relative max-w-lg mx-auto px-4 pt-8 pb-16">
        <Link href="/playground" className="text-sm text-neutral-500 hover:text-neutral-300">
          ← Playground
        </Link>
        <div className="text-center mt-4 mb-6">
          <p className="text-[10px] uppercase tracking-[0.28em] text-amber-200/80 mb-2">Highway Hunter</p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-rose-200 to-fuchsia-300">
            Night interstate
          </h1>
        </div>

        {!admin && (
          <div className="rounded-3xl border border-amber-500/20 bg-black/50 p-6 text-center space-y-3">
            <p className="text-neutral-200 font-medium">Coming soon</p>
            <p className="text-sm text-neutral-400">
              Weaponized coupe. Hostiles. Kits. Soft wrecks and a loud scorecard. Preview is open for the house only.
            </p>
            {board.length > 0 && (
              <div className="pt-4 text-left space-y-1">
                <p className="text-[10px] uppercase tracking-wide text-neutral-500">Early board</p>
                {board.slice(0, 5).map((r, i) => (
                  <p key={i} className="text-xs text-neutral-400 flex justify-between">
                    <span>{r.username}</span>
                    <span className="text-amber-200">{r.score} · {r.grade}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {admin && phase === "menu" && (
          <div className="rounded-3xl border border-amber-500/25 bg-black/55 p-6 space-y-4">
            <p className="text-sm text-neutral-300 leading-relaxed">
              Steer with arrows / A D or drag left-right. Hold top half or space to fire. X / shift dumps oil when you have it.
              Grey cars are civilians — try not to light them up.
            </p>
            <ul className="text-xs text-neutral-500 space-y-1">
              <li>3 armor. One free second wind. Death is a scorecard, not a wall.</li>
              <li>Kits: repair, rapid, shield, oil, missiles, nitro, star.</li>
              <li>Combo pays. Civ hits tax the run.</li>
            </ul>
            <button
              type="button"
              onClick={() => {
                setScore(null);
                setPhase("play");
              }}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-rose-400 to-fuchsia-500 text-black font-semibold"
            >
              Start run
            </button>
          </div>
        )}

        {admin && phase === "play" && (
          <div className="space-y-3">
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-black shadow-[0_0_60px_-20px_rgba(251,191,36,0.4)]">
              <canvas ref={canvasRef} className="w-full touch-none block" />
            </div>
            {msg && <p className="text-center text-xs text-amber-200">{msg}</p>}
            <p className="text-center text-[11px] text-neutral-500">Tap upper road to shoot · drag to steer</p>
          </div>
        )}

        {admin && phase === "score" && score && (
          <div className="rounded-3xl border border-fuchsia-500/25 bg-black/60 p-6 space-y-4">
            <div className="text-center">
              <p className="text-5xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-rose-300">
                {score.grade}
              </p>
              <p className="mt-2 text-lg text-neutral-100">{score.title}</p>
              <p className="text-sm text-neutral-400">{score.line}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl bg-white/5 p-3"><p className="text-[10px] text-neutral-500">Score</p><p className="text-amber-100">{score.score}</p></div>
              <div className="rounded-xl bg-white/5 p-3"><p className="text-[10px] text-neutral-500">Distance</p><p className="text-amber-100">{score.distance}m</p></div>
              <div className="rounded-xl bg-white/5 p-3"><p className="text-[10px] text-neutral-500">Hostiles</p><p className="text-amber-100">{score.kills}</p></div>
              <div className="rounded-xl bg-white/5 p-3"><p className="text-[10px] text-neutral-500">Max combo</p><p className="text-amber-100">{score.comboMax}</p></div>
            </div>
            {score.civHits > 0 && (
              <p className="text-xs text-rose-300/80 text-center">Civilians hit: {score.civHits}</p>
            )}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setScore(null);
                  setPhase("play");
                }}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-rose-400 to-fuchsia-500 text-black font-semibold"
              >
                Run again
              </button>
              <button
                type="button"
                onClick={submit}
                className="w-full py-2.5 rounded-2xl border border-neutral-700 text-sm text-neutral-200"
              >
                Post to board
              </button>
              <button type="button" onClick={() => setPhase("menu")} className="text-xs text-neutral-500">
                Menu
              </button>
            </div>
            {msg && <p className="text-xs text-center text-fuchsia-200">{msg}</p>}
          </div>
        )}

        {admin && board.length > 0 && phase !== "play" && (
          <div className="mt-8 rounded-2xl border border-neutral-800 bg-black/40 p-4">
            <p className="text-[10px] uppercase tracking-wide text-neutral-500 mb-2">Board</p>
            <div className="space-y-1">
              {board.slice(0, 8).map((r, i) => (
                <p key={i} className="text-xs text-neutral-400 flex justify-between">
                  <span>{r.username}</span>
                  <span className="text-amber-200/90">{r.score} · {r.grade}</span>
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
