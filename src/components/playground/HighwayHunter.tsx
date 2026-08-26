"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { createHighwayAudio } from "@/lib/highway-audio";
import {
  EMPTY_GARAGE,
  UPGRADE_KEYS,
  UPGRADE_MAX,
  UPGRADE_META,
  rebirthCost,
  scrapFromRun,
  upgradeCost,
  type HighwayGarage,
  type UpgradeKey,
} from "@/lib/highway-garage";

type Phase = "menu" | "garage" | "play" | "score";
type Power = "repair" | "rapid" | "shield" | "oil" | "missile" | "nitro" | "star";
type Ent = {
  x: number;
  y: number;
  w: number;
  h: number;
  vy: number;
  kind: "hostile" | "civ" | "truck" | "bike" | "boss";
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
  if (v > 14000) return { grade: "S", title: "Ghost on the interstate", line: "Clean, loud, gone." };
  if (v > 9000) return { grade: "A", title: "Night runner", line: "Hostiles felt that." };
  if (v > 5000) return { grade: "B", title: "Paid passenger", line: "Solid shift." };
  if (v > 2200) return { grade: "C", title: "On-ramp heat", line: "You made noise." };
  return { grade: "D", title: "Still learning the lanes", line: "One more. Always one more." };
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  body: string,
  accent: string,
  kind: "player" | "civ" | "truck" | "bike" | "boss" | "hostile" = "hostile"
) {
  ctx.save();
  ctx.shadowColor = kind === "player" ? "rgba(244,63,94,0.55)" : "rgba(0,0,0,0.55)";
  ctx.shadowBlur = kind === "player" ? 18 : 8;
  ctx.fillStyle = "#0a0608";
  roundRect(ctx, x - w / 2 - 3, y - h / 2 + h * 0.12, 7, h * 0.42, 2);
  ctx.fill();
  roundRect(ctx, x + w / 2 - 4, y - h / 2 + h * 0.12, 7, h * 0.42, 2);
  ctx.fill();
  ctx.fillStyle = body;
  roundRect(ctx, x - w / 2, y - h / 2, w, h, kind === "bike" ? 10 : 8);
  ctx.fill();
  const shine = ctx.createLinearGradient(x - w / 2, y, x + w / 2, y);
  shine.addColorStop(0, "rgba(255,255,255,0.08)");
  shine.addColorStop(0.5, "rgba(255,255,255,0)");
  shine.addColorStop(1, "rgba(255,255,255,0.12)");
  ctx.fillStyle = shine;
  roundRect(ctx, x - w / 2, y - h / 2, w, h, 8);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = accent;
  roundRect(ctx, x - w * 0.34, y - h * 0.32, w * 0.68, h * 0.26, 4);
  ctx.fill();
  ctx.fillStyle = "rgba(12,8,16,0.45)";
  roundRect(ctx, x - w * 0.28, y - h * 0.28, w * 0.56, h * 0.16, 3);
  ctx.fill();
  ctx.fillStyle = "rgba(254,240,138,0.95)";
  ctx.fillRect(x - w * 0.3, y - h * 0.46, 7, 5);
  ctx.fillRect(x + w * 0.3 - 7, y - h * 0.46, 7, 5);
  ctx.fillStyle = kind === "civ" ? "rgba(248,250,252,0.75)" : "rgba(251,113,133,0.9)";
  ctx.fillRect(x - w * 0.3, y + h * 0.34, 7, 4);
  ctx.fillRect(x + w * 0.3 - 7, y + h * 0.34, 7, 4);
  if (kind === "boss") {
    ctx.strokeStyle = "rgba(244,63,94,0.7)";
    ctx.lineWidth = 2;
    roundRect(ctx, x - w / 2 - 2, y - h / 2 - 2, w + 4, h + 4, 9);
    ctx.stroke();
  }
  ctx.restore();
}

export function HighwayHunter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("menu");
  const [score, setScore] = useState<Score | null>(null);
  const [board, setBoard] = useState<{ username: string; score: number; grade: string }[]>([]);
  const [msg, setMsg] = useState("");
  const [garage, setGarage] = useState<HighwayGarage>(EMPTY_GARAGE);
  const [muted, setMuted] = useState(false);
  const keys = useRef<Record<string, boolean>>({});
  const touch = useRef<{ x: number; y: number } | null>(null);
  const fireHeld = useRef(false);
  const oilHeld = useRef(false);
  const audio = useMemo(() => createHighwayAudio(), []);
  const garageRef = useRef(garage);
  garageRef.current = garage;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const id = session?.user?.id || null;
      setUserId(id);
      if (id) {
        fetch(`/api/highway/progress?userId=${id}`)
          .then((r) => r.json())
          .then((d) => {
            if (d.garage) setGarage(d.garage);
          })
          .catch(() => {});
      }
    });
    fetch("/api/highway/score")
      .then((r) => r.json())
      .then((d) => setBoard(d.rows || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    audio.setMuted(muted);
  }, [audio, muted]);

  useEffect(() => {
    if (phase !== "play") {
      audio.engine(false);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    audio.unlock();
    audio.engine(true);

    const g = garageRef.current;
    let w = 360;
    let h = 640;
    let roadL = 50;
    let roadR = 310;
    let lanes = [120, 180, 240];
    const resize = () => {
      const parent = canvas.parentElement;
      const maxW = Math.min(440, parent?.clientWidth || 360);
      w = maxW;
      h = Math.min(760, Math.floor(maxW * 1.72));
      canvas.width = w;
      canvas.height = h;
      roadL = w * 0.14;
      roadR = w * 0.86;
      lanes = [0.26, 0.5, 0.74].map((t) => roadL + (roadR - roadL) * t);
    };
    resize();
    window.addEventListener("resize", resize);

    const maxArmor = 3 + g.hull;
    const player = {
      x: lanes[1],
      y: h * 0.78,
      w: 30,
      h: 48,
      armor: maxArmor,
      inv: 0,
      rapid: 0,
      shield: 0,
      nitro: 0,
      missiles: 0,
      oil: 0,
    };

    let scroll = 0;
    let speed = 4.4 + g.turbo * 0.35 + g.rebirths * 0.15;
    let tick = 0;
    let spawnT = 0;
    let pickupT = 40;
    let bossAt = 2200;
    let scoreN = 0;
    let distance = 0;
    let kills = 0;
    let civHits = 0;
    let combo = 0;
    let comboMax = 0;
    let shootCd = 0;
    let usedContinue = false;
    let alive = true;
    let shake = 0;

    const ents: Ent[] = [];
    const bullets: Bullet[] = [];
    const slicks: Slick[] = [];
    const pickups: Pickup[] = [];
    const particles: { x: number; y: number; vx: number; vy: number; life: number; c: string }[] = [];

    const onKey = (e: KeyboardEvent, down: boolean) => {
      keys.current[e.key.toLowerCase()] = down;
      if (["arrowleft", "arrowright", "arrowup", "arrowdown", " "].includes(e.key.toLowerCase()) || e.key === " ") {
        e.preventDefault();
      }
    };
    const kd = (e: KeyboardEvent) => onKey(e, true);
    const ku = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);

    const pointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      touch.current = {
        x: ((e.clientX - rect.left) / rect.width) * w,
        y: ((e.clientY - rect.top) / rect.height) * h,
      };
    };
    const pointerDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      pointer(e);
    };
    canvas.addEventListener("pointerdown", pointerDown);
    canvas.addEventListener("pointermove", pointer);
    const clearTouch = () => {
      touch.current = null;
    };
    canvas.addEventListener("pointerup", clearTouch);
    canvas.addEventListener("pointerleave", clearTouch);

    const boom = (x: number, y: number, c: string, n = 14) => {
      for (let i = 0; i < n; i++) {
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 5,
          life: 18 + Math.random() * 16,
          c,
        });
      }
    };

    const endRun = () => {
      alive = false;
      audio.engine(false);
      const gr = gradeOf(scoreN, kills, civHits);
      setScore({
        score: Math.floor(scoreN),
        grade: gr.grade,
        title: gr.title,
        line: gr.line,
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
      speed = 4.4 + g.turbo * 0.35 + g.rebirths * 0.15 + Math.min(5.2, distance / 3800) + (player.nitro > 0 ? 2.5 : 0);
      scroll = (scroll + speed) % 46;
      distance += speed * 0.38;
      scoreN += speed * 0.16 + combo * 0.06;
      if (player.inv > 0) player.inv -= 1;
      if (player.rapid > 0) player.rapid -= 1;
      if (player.shield > 0) player.shield -= 1;
      if (player.nitro > 0) player.nitro -= 1;
      if (shootCd > 0) shootCd -= 1;
      if (shake > 0) shake -= 1;

      const steer = 5.1 + g.turbo * 0.55 + (player.nitro > 0 ? 1.6 : 0);
      if (keys.current["arrowleft"] || keys.current["a"]) player.x -= steer;
      if (keys.current["arrowright"] || keys.current["d"]) player.x += steer;
      if (keys.current["arrowup"] || keys.current["w"]) player.y -= steer * 0.85;
      if (keys.current["arrowdown"] || keys.current["s"]) player.y += steer * 0.85;
      if (touch.current) {
        player.x += (touch.current.x - player.x) * 0.22;
        player.y += (touch.current.y - player.y) * 0.18;
      }
      player.x = Math.max(roadL + 22, Math.min(roadR - 22, player.x));
      player.y = Math.max(h * 0.42, Math.min(h * 0.88, player.y));

      const wantFire = keys.current[" "] || keys.current["z"] || fireHeld.current;
      const cd = Math.max(5, (player.rapid > 0 ? 5 : 11) - g.coolant);
      if (wantFire && shootCd <= 0) {
        const dmg = 1 + Math.floor(g.cannons / 2) + (player.rapid > 0 ? 1 : 0);
        bullets.push({ x: player.x - 9, y: player.y - 22, vy: -12, dmg });
        bullets.push({ x: player.x + 9, y: player.y - 22, vy: -12, dmg });
        if (g.cannons >= 4) bullets.push({ x: player.x, y: player.y - 26, vy: -13, dmg });
        shootCd = cd;
        audio.shoot();
        if (player.missiles > 0 && tick % 16 === 0) {
          bullets.push({ x: player.x, y: player.y - 28, vy: -15, dmg: 5 + g.cannons });
          player.missiles -= 1;
        }
      }
      if ((keys.current["x"] || keys.current["shift"] || oilHeld.current) && player.oil > 0 && tick % 14 === 0) {
        slicks.push({ x: player.x, y: player.y + 32, life: 96 });
        player.oil -= 1;
      }

      spawnT -= 1;
      if (spawnT <= 0) {
        const lane = lanes[Math.floor(Math.random() * lanes.length)];
        const roll = Math.random();
        let kind: Ent["kind"] = "hostile";
        if (roll < 0.24) kind = "civ";
        else if (roll < 0.36) kind = "bike";
        else if (roll < 0.5) kind = "truck";
        const hp = kind === "truck" ? 5 : kind === "bike" ? 1 : kind === "civ" ? 1 : 2;
        ents.push({
          x: lane,
          y: -70,
          w: kind === "truck" ? 38 : kind === "bike" ? 18 : 28,
          h: kind === "truck" ? 58 : kind === "bike" ? 34 : 46,
          vy: speed * (0.32 + Math.random() * 0.34),
          kind,
          hp,
          lane,
        });
        spawnT = Math.max(18, 46 - distance / 700);
      }
      if (distance > bossAt) {
        ents.push({
          x: lanes[1],
          y: -90,
          w: 52,
          h: 78,
          vy: speed * 0.22,
          kind: "boss",
          hp: 18 + g.rebirths * 2,
          lane: lanes[1],
        });
        bossAt += 2600;
        audio.explode(true);
      }

      pickupT -= 1;
      if (pickupT <= 0) {
        const kinds: Power[] = ["repair", "rapid", "shield", "oil", "missile", "nitro", "star"];
        pickups.push({
          x: lanes[Math.floor(Math.random() * lanes.length)],
          y: -28,
          kind: kinds[Math.floor(Math.random() * kinds.length)],
          vy: speed * 0.48,
        });
        pickupT = 150 + Math.random() * 70;
      }

      for (const e of ents) {
        e.y += e.vy + speed * 0.26;
        if (e.kind === "hostile" || e.kind === "truck" || e.kind === "boss") {
          e.x += Math.sin(tick / 22 + e.lane) * (e.kind === "boss" ? 1.1 : 0.45);
        }
      }
      for (const b of bullets) b.y += b.vy;
      for (const s of slicks) {
        s.y += speed * 0.62;
        s.life -= 1;
      }
      const mag = 10 + g.mag * 9;
      for (const p of pickups) {
        p.y += p.vy + speed * 0.2;
        if (Math.hypot(p.x - player.x, p.y - player.y) < mag + 40) {
          p.x += (player.x - p.x) * 0.04 * (1 + g.mag * 0.2);
        }
      }
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy + speed * 0.1;
        p.life -= 1;
      }

      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if (b.y < -24) {
          bullets.splice(i, 1);
          continue;
        }
        for (let j = ents.length - 1; j >= 0; j--) {
          const e = ents[j];
          if (Math.abs(b.x - e.x) < e.w * 0.55 && Math.abs(b.y - e.y) < e.h * 0.55) {
            e.hp -= b.dmg;
            bullets.splice(i, 1);
            boom(e.x, e.y, e.kind === "civ" ? "#94a3b8" : "#fb7185");
            if (e.hp <= 0) {
              audio.explode(e.kind === "boss");
              if (e.kind === "civ") {
                civHits += 1;
                combo = 0;
                scoreN = Math.max(0, scoreN - 140);
              } else {
                kills += 1;
                combo += 1;
                comboMax = Math.max(comboMax, combo);
                scoreN += 90 + combo * 14 + (e.kind === "truck" ? 70 : 0) + (e.kind === "boss" ? 420 : 0);
              }
              ents.splice(j, 1);
            }
            break;
          }
        }
      }

      for (const s of slicks) {
        for (let j = ents.length - 1; j >= 0; j--) {
          const e = ents[j];
          if (e.kind === "civ") continue;
          if (Math.abs(s.x - e.x) < 32 && Math.abs(s.y - e.y) < 32) {
            e.hp = 0;
            kills += 1;
            combo += 1;
            comboMax = Math.max(comboMax, combo);
            scoreN += 110;
            boom(e.x, e.y, "#a3e635");
            ents.splice(j, 1);
            audio.explode();
          }
        }
      }

      for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        if (Math.abs(p.x - player.x) < 30 + g.mag && Math.abs(p.y - player.y) < 38 + g.mag) {
          if (p.kind === "repair") player.armor = Math.min(maxArmor, player.armor + 1);
          if (p.kind === "rapid") player.rapid = 250;
          if (p.kind === "shield") player.shield = 210;
          if (p.kind === "oil") player.oil += 3;
          if (p.kind === "missile") player.missiles += 4;
          if (p.kind === "nitro") player.nitro = 170;
          if (p.kind === "star") scoreN += 280;
          pickups.splice(i, 1);
          boom(p.x, p.y, "#e879f9");
          audio.pickup();
        } else if (p.y > h + 40) pickups.splice(i, 1);
      }

      for (let j = ents.length - 1; j >= 0; j--) {
        const e = ents[j];
        if (Math.abs(e.x - player.x) < (e.w + player.w) * 0.38 && Math.abs(e.y - player.y) < (e.h + player.h) * 0.38) {
          if (player.inv > 0 || player.shield > 0) {
            if (e.kind !== "civ") {
              ents.splice(j, 1);
              kills += 1;
              scoreN += 45;
              boom(e.x, e.y, "#38bdf8");
            }
            continue;
          }
          player.armor -= 1;
          player.inv = 48;
          combo = 0;
          shake = 10;
          boom(player.x, player.y, "#ef4444");
          audio.hit();
          if (e.kind === "civ") civHits += 1;
          else ents.splice(j, 1);
          if (player.armor < 0) {
            if (!usedContinue) {
              usedContinue = true;
              player.armor = 1;
              player.inv = 90;
              player.shield = 70;
              scoreN = Math.floor(scoreN * 0.85);
              setMsg("Second wind. Score tax.");
              setTimeout(() => setMsg(""), 1800);
            } else {
              endRun();
              return;
            }
          }
        }
      }

      for (let i = ents.length - 1; i >= 0; i--) if (ents[i].y > h + 90) ents.splice(i, 1);
      for (let i = slicks.length - 1; i >= 0; i--) if (slicks[i].life <= 0 || slicks[i].y > h + 40) slicks.splice(i, 1);
      for (let i = particles.length - 1; i >= 0; i--) if (particles[i].life <= 0) particles.splice(i, 1);

      const ox = shake ? (Math.random() - 0.5) * 6 : 0;
      const oy = shake ? (Math.random() - 0.5) * 4 : 0;
      ctx.save();
      ctx.translate(ox, oy);

      const night = ctx.createLinearGradient(0, 0, 0, h);
      night.addColorStop(0, "#1a0a18");
      night.addColorStop(0.35, "#0c0610");
      night.addColorStop(1, "#1c0a12");
      ctx.fillStyle = night;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = "rgba(255,230,240,0.55)";
      for (let i = 0; i < 42; i++) {
        const sx = ((i * 73 + tick * 0.15) % w);
        const sy = (i * 47) % (h * 0.38);
        ctx.fillRect(sx, sy, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1);
      }

      for (let i = 0; i < 18; i++) {
        const left = i % 2 === 0;
        const bx = (left ? 4 : w - 26) + Math.sin(i) * 3;
        const bh = 48 + (i * 17) % 100;
        const by = ((i * 73 + scroll * 3.2) % (h + 140)) - 90;
        const lamp = ctx.createLinearGradient(bx, by, bx + 18, by + bh);
        lamp.addColorStop(0, left ? "rgba(136,19,55,0.45)" : "rgba(88,28,135,0.4)");
        lamp.addColorStop(1, "rgba(12,8,16,0.9)");
        ctx.fillStyle = lamp;
        ctx.fillRect(bx, by, 20, bh);
        ctx.fillStyle = "rgba(251,191,36,0.22)";
        ctx.beginPath();
        ctx.moveTo(left ? bx + 20 : bx, by + 14);
        ctx.lineTo(left ? roadL : roadR, by + 38);
        ctx.lineTo(left ? roadL : roadR, by + 8);
        ctx.closePath();
        ctx.fill();
      }

      ctx.fillStyle = "#0c0c12";
      ctx.fillRect(0, 0, roadL, h);
      ctx.fillRect(roadR, 0, w - roadR, h);
      const road = ctx.createLinearGradient(roadL, 0, roadR, 0);
      road.addColorStop(0, "#161018");
      road.addColorStop(0.5, "#241824");
      road.addColorStop(1, "#161018");
      ctx.fillStyle = road;
      ctx.fillRect(roadL, 0, roadR - roadL, h);

      ctx.strokeStyle = "rgba(251,191,36,0.35)";
      ctx.lineWidth = 2;
      ctx.setLineDash([14, 22]);
      ctx.lineDashOffset = -scroll;
      ctx.beginPath();
      ctx.moveTo(w * 0.38, 0);
      ctx.lineTo(w * 0.38, h);
      ctx.moveTo(w * 0.62, 0);
      ctx.lineTo(w * 0.62, h);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(244,114,182,0.35)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(roadL + 4, 0);
      ctx.lineTo(roadL + 4, h);
      ctx.moveTo(roadR - 4, 0);
      ctx.lineTo(roadR - 4, h);
      ctx.stroke();

      if (distance > 4000) {
        ctx.strokeStyle = "rgba(226,232,240,0.12)";
        for (let i = 0; i < 12; i++) {
          const rx = (i * 97 + tick * 8) % w;
          ctx.beginPath();
          ctx.moveTo(rx, 0);
          ctx.lineTo(rx - 12, h);
          ctx.stroke();
        }
      }

      for (const s of slicks) {
        ctx.fillStyle = "rgba(163,230,53,0.38)";
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, 22, 10, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      const kitColor: Record<Power, string> = {
        repair: "#34d399",
        rapid: "#fb7185",
        shield: "#38bdf8",
        oil: "#a3e635",
        missile: "#fbbf24",
        nitro: "#c084fc",
        star: "#fde68a",
      };
      for (const p of pickups) {
        ctx.fillStyle = kitColor[p.kind];
        ctx.beginPath();
        ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#0c0a10";
        ctx.font = "bold 10px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(p.kind[0].toUpperCase(), p.x, p.y + 3);
      }
      for (const e of ents) {
        if (e.kind === "civ") drawCar(ctx, e.x, e.y, e.w, e.h, "#64748b", "#cbd5e1", "civ");
        else if (e.kind === "truck") drawCar(ctx, e.x, e.y, e.w, e.h, "#9f1239", "#fb7185", "truck");
        else if (e.kind === "bike") drawCar(ctx, e.x, e.y, e.w, e.h, "#b45309", "#fbbf24", "bike");
        else if (e.kind === "boss") drawCar(ctx, e.x, e.y, e.w, e.h, "#4c0519", "#e11d48", "boss");
        else drawCar(ctx, e.x, e.y, e.w, e.h, "#be123c", "#fda4af", "hostile");
      }
      for (const b of bullets) {
        const glow = ctx.createLinearGradient(b.x, b.y, b.x, b.y + 14);
        glow.addColorStop(0, "#fff7ed");
        glow.addColorStop(1, "#fb7185");
        ctx.fillStyle = glow;
        ctx.fillRect(b.x - 2, b.y - 9, 4, 14);
      }
      if (player.inv <= 0 || tick % 4 < 2) {
        if (player.shield > 0) {
          ctx.strokeStyle = "rgba(56,189,248,0.7)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(player.x, player.y, 34, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.fillStyle = "rgba(254,240,138,0.12)";
        ctx.beginPath();
        ctx.moveTo(player.x - 16, player.y - player.h / 2);
        ctx.lineTo(player.x - 40, player.y - player.h / 2 - 90);
        ctx.lineTo(player.x + 40, player.y - player.h / 2 - 90);
        ctx.lineTo(player.x + 16, player.y - player.h / 2);
        ctx.fill();
        drawCar(ctx, player.x, player.y, player.w, player.h, player.nitro > 0 ? "#9d174d" : "#db2777", "#fecdd3", "player");
        if (player.nitro > 0) {
          ctx.fillStyle = "rgba(251,191,36,0.55)";
          ctx.beginPath();
          ctx.moveTo(player.x - 7, player.y + player.h / 2);
          ctx.lineTo(player.x, player.y + player.h / 2 + 18);
          ctx.lineTo(player.x + 7, player.y + player.h / 2);
          ctx.fill();
        }
      }
      for (const p of particles) {
        ctx.globalAlpha = Math.max(0, p.life / 28);
        ctx.fillStyle = p.c;
        ctx.fillRect(p.x, p.y, 3, 3);
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, 0, w, 54);
      ctx.fillStyle = "#fecdd3";
      ctx.font = "bold 15px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`${Math.floor(scoreN)}`, 12, 22);
      ctx.fillStyle = "#a3a3a3";
      ctx.font = "11px sans-serif";
      ctx.fillText(`${Math.floor(distance)}m · x${combo}${g.rebirths ? ` · R${g.rebirths}` : ""}`, 12, 40);
      ctx.textAlign = "right";
      ctx.fillStyle = "#fda4af";
      ctx.fillText("●".repeat(Math.max(0, player.armor)) + "○".repeat(Math.max(0, maxArmor - player.armor)), w - 12, 22);
      const kit = [];
      if (player.rapid > 0) kit.push("RF");
      if (player.shield > 0) kit.push("SH");
      if (player.nitro > 0) kit.push("N2");
      if (player.missiles > 0) kit.push(`M${player.missiles}`);
      if (player.oil > 0) kit.push(`O${player.oil}`);
      ctx.fillStyle = "#e9d5ff";
      ctx.fillText(kit.join(" "), w - 12, 40);
      ctx.restore();

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      audio.engine(false);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("pointermove", pointer);
      canvas.removeEventListener("pointerup", clearTouch);
      canvas.removeEventListener("pointerleave", clearTouch);
    };
  }, [phase, audio]);

  const buy = async (stat: UpgradeKey) => {
    if (!userId) return setMsg("Join to keep upgrades.");
    const res = await fetch("/api/highway/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: "buy", stat }),
    });
    const data = await res.json();
    if (!res.ok) setMsg(data.error || "Buy failed");
    else {
      setGarage(data.garage);
      setMsg("");
    }
  };

  const rebirth = async () => {
    if (!userId) return setMsg("Join to rebirth.");
    const res = await fetch("/api/highway/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: "rebirth" }),
    });
    const data = await res.json();
    if (!res.ok) setMsg(data.error || "Rebirth failed");
    else {
      setGarage(data.garage);
      setMsg(`Rebirth ${data.garage.rebirths}. The night got faster.`);
    }
  };

  const submit = async () => {
    if (!userId || !score) return setMsg("Join to post the board and bank scrap.");
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
    if (!res.ok) setMsg(data.error || "Score save failed");
    else {
      setMsg(`On the board · +${data.scrapGain || scrapFromRun(score.score, garage.rebirths)} scrap`);
      if (data.garage) setGarage((g) => ({ ...g, ...data.garage, scrap: data.garage.scrap }));
      const r = await fetch("/api/highway/score");
      const d = await r.json();
      setBoard(d.rows || []);
    }
  };

  const start = () => {
    audio.unlock();
    setScore(null);
    setMsg("");
    setPhase("play");
  };

  return (
    <div className="home-den relative overflow-hidden min-h-[calc(100vh-8rem)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="pg-orb pg-orb-a" />
        <div className="pg-orb pg-orb-b" />
        <div className="den-grain" />
      </div>
      <div className="relative max-w-lg mx-auto px-4 pt-8 pb-20">
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
          <p className="text-[10px] uppercase tracking-[0.28em] text-rose-300/80 mb-2">Highway Hunter</p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-rose-200 via-white to-purple-300">
            Night interstate
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            {userId ? `${garage.scrap} scrap · rebirth ${garage.rebirths}` : "Play free. Join to bank scrap."}
          </p>
        </div>

        {phase === "menu" && (
          <div className="rounded-3xl border border-rose-900/35 bg-black/55 p-6 space-y-4">
            <p className="text-sm text-neutral-300 leading-relaxed">
              WASD or arrows to move. Space to shoot. Shift dumps oil. On a phone, drag the road and use Fire.
              Grey cars are civilians.
            </p>
            <ul className="text-xs text-neutral-500 space-y-1">
              <li>Kits on the asphalt. Combo pays. Civ hits tax the run.</li>
              <li>One second wind. Then the scorecard.</li>
              <li>Account keeps scrap, upgrades, rebirths, and the board.</li>
            </ul>
            <button
              type="button"
              onClick={start}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-b from-red-600 via-red-800 to-purple-900 text-white font-semibold"
            >
              Start run
            </button>
            <button
              type="button"
              onClick={() => setPhase("garage")}
              className="w-full py-2.5 rounded-2xl border border-white/15 text-sm text-neutral-200"
            >
              Garage
            </button>
          </div>
        )}

        {phase === "garage" && (
          <div className="rounded-3xl border border-violet-900/35 bg-black/55 p-6 space-y-4">
            <p className="text-sm text-neutral-300">Spend scrap. Rebirth resets kits for a meaner night.</p>
            {!userId && (
              <Link href="/join" className="block text-center text-sm text-rose-300">
                Join to save this garage →
              </Link>
            )}
            <p className="text-amber-100 text-sm">{garage.scrap} scrap · R{garage.rebirths}</p>
            <div className="space-y-2">
              {UPGRADE_KEYS.map((key) => (
                <div key={key} className="flex items-center justify-between gap-3 rounded-xl border border-neutral-800 px-3 py-2">
                  <div>
                    <p className="text-sm text-neutral-100">{UPGRADE_META[key].label} {garage[key]}/{UPGRADE_MAX}</p>
                    <p className="text-[11px] text-neutral-500">{UPGRADE_META[key].line}</p>
                  </div>
                  <button
                    type="button"
                    disabled={!userId || garage[key] >= UPGRADE_MAX}
                    onClick={() => buy(key)}
                    className="shrink-0 text-[11px] px-3 py-1.5 rounded-lg border border-rose-800/50 text-rose-200 disabled:opacity-40"
                  >
                    {garage[key] >= UPGRADE_MAX ? "Max" : `${upgradeCost(key, garage[key])} scrap`}
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              disabled={!userId}
              onClick={rebirth}
              className="w-full py-2.5 rounded-2xl border border-amber-800/40 text-sm text-amber-100 disabled:opacity-40"
            >
              Rebirth · {rebirthCost(garage)} scrap
            </button>
            <button type="button" onClick={() => setPhase("menu")} className="w-full text-xs text-neutral-500">
              Back
            </button>
            {msg && <p className="text-xs text-center text-rose-200">{msg}</p>}
          </div>
        )}

        {phase === "play" && (
          <div className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden border border-rose-900/30 bg-black shadow-[0_0_70px_-18px_rgba(185,28,92,0.55)]">
              <canvas ref={canvasRef} className="w-full touch-none block" />
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  oilHeld.current = true;
                }}
                onPointerUp={() => {
                  oilHeld.current = false;
                }}
                onPointerLeave={() => {
                  oilHeld.current = false;
                }}
                className="absolute bottom-4 left-4 w-16 h-16 rounded-full border border-lime-400/40 bg-black/75 text-lime-100 text-[10px] uppercase tracking-wide"
              >
                Oil
              </button>
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  fireHeld.current = true;
                }}
                onPointerUp={() => {
                  fireHeld.current = false;
                }}
                onPointerLeave={() => {
                  fireHeld.current = false;
                }}
                className="absolute bottom-4 right-4 w-20 h-20 rounded-full border border-rose-400/50 bg-gradient-to-b from-red-700/90 to-purple-950/90 text-white text-xs uppercase tracking-wide shadow-[0_0_30px_rgba(244,63,94,0.45)] active:scale-95"
              >
                Fire
              </button>
            </div>
            {msg && <p className="text-center text-xs text-rose-200">{msg}</p>}
            <p className="text-center text-[11px] text-neutral-500">WASD · space · Shift oil · drag the road · Fire</p>
          </div>
        )}

        {phase === "score" && score && (
          <div className="rounded-3xl border border-fuchsia-500/25 bg-black/60 p-6 space-y-4">
            <div className="text-center">
              <p className="text-5xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-rose-200 to-purple-300">
                {score.grade}
              </p>
              <p className="mt-2 text-lg text-neutral-100">{score.title}</p>
              <p className="text-sm text-neutral-400">{score.line}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl bg-white/5 p-3"><p className="text-[10px] text-neutral-500">Score</p><p className="text-rose-100">{score.score}</p></div>
              <div className="rounded-xl bg-white/5 p-3"><p className="text-[10px] text-neutral-500">Distance</p><p className="text-rose-100">{score.distance}m</p></div>
              <div className="rounded-xl bg-white/5 p-3"><p className="text-[10px] text-neutral-500">Hostiles</p><p className="text-rose-100">{score.kills}</p></div>
              <div className="rounded-xl bg-white/5 p-3"><p className="text-[10px] text-neutral-500">Max combo</p><p className="text-rose-100">{score.comboMax}</p></div>
            </div>
            {score.civHits > 0 && <p className="text-xs text-rose-300/80 text-center">Civilians hit: {score.civHits}</p>}
            <div className="flex flex-col gap-2">
              <button type="button" onClick={start} className="w-full py-3 rounded-2xl bg-gradient-to-b from-red-600 via-red-800 to-purple-900 text-white font-semibold">
                Run again
              </button>
              <button type="button" onClick={submit} className="w-full py-2.5 rounded-2xl border border-neutral-700 text-sm text-neutral-200">
                {userId ? "Bank scrap + post board" : "Join to bank scrap"}
              </button>
              <button type="button" onClick={() => setPhase("garage")} className="text-xs text-neutral-400">
                Garage
              </button>
              <button type="button" onClick={() => setPhase("menu")} className="text-xs text-neutral-600">
                Menu
              </button>
            </div>
            {msg && <p className="text-xs text-center text-fuchsia-200">{msg}</p>}
          </div>
        )}

        {board.length > 0 && phase !== "play" && (
          <div className="mt-8 rounded-2xl border border-neutral-800 bg-black/40 p-4">
            <p className="text-[10px] uppercase tracking-wide text-neutral-500 mb-2">Night board</p>
            <div className="space-y-1">
              {board.slice(0, 8).map((r, i) => (
                <p key={i} className="text-xs text-neutral-400 flex justify-between">
                  <span>{r.username}</span>
                  <span className="text-rose-200/90">{r.score} · {r.grade}</span>
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
