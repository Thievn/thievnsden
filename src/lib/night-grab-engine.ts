import {
  BAG_SLOW_AT,
  CAMERA_WINDUP,
  CLOCK_SEE_SECONDS,
  COMBO_CAP,
  DEEP_POCKETS_AT,
  POWER_BOX_SECONDS,
  RUN_SECONDS,
  SMOKE_SECONDS,
  STUN_SECONDS,
  VENT_SECONDS,
  bagValue,
  earnBadges,
  finalScore,
  roastLine,
  type FloorId,
  type LoadoutId,
  type LootKind,
} from "./night-grab";
import { TILE, floorById, tileAt, walkable, type FloorDef, type FloorLoot } from "./night-grab-floors";

export type RunEvent = "grab" | "ember" | "extract" | "clocked" | "ten" | "noise" | "warn";

export type Input = {
  ax: number;
  ay: number;
  sneak: boolean;
  grab: boolean;
  dump: boolean;
  smoke: boolean;
};

type Guard = {
  x: number;
  y: number;
  heading: number;
  patrol: { x: number; y: number }[];
  pi: number;
  wait: number;
  coffee: boolean;
  see: number;
};

type Cam = {
  x: number;
  y: number;
  angle: number;
  min: number;
  max: number;
  dir: number;
  windup: number;
  wakeOnEmber: boolean;
  awake: boolean;
};

export type NightRun = {
  floor: FloorDef;
  floorId: FloorId;
  loadout: LoadoutId;
  t: number;
  ended: boolean;
  x: number;
  y: number;
  stun: number;
  crawl: number;
  crawlTo: { x: number; y: number } | null;
  smoke: number;
  alert: number;
  camerasDead: number;
  combo: number;
  comboPeak: number;
  bag: LootKind[];
  bagPeak: number;
  dropped: { x: number; y: number; items: LootKind[] } | null;
  extractedValue: number;
  extractedTimes: number;
  clocked: number;
  hasKey: boolean;
  unlocked: boolean;
  powerUsed: boolean;
  smokeUsed: boolean;
  quietUsed: boolean;
  windUsed: boolean;
  onNoise: boolean;
  tenFired: boolean;
  deadPhoneExtracted: boolean;
  firstExtractElapsed: number | null;
  stamp: number;
  flash: number;
  shake: number;
  loot: (FloorLoot & { taken: boolean })[];
  guards: Guard[];
  cams: Cam[];
  events: RunEvent[];
};

function angNorm(a: number) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.hypot(ax - bx, ay - by);
}

export function inCone(
  ox: number,
  oy: number,
  heading: number,
  half: number,
  len: number,
  px: number,
  py: number,
  sneak: boolean
) {
  const dx = px - ox;
  const dy = py - oy;
  let d = Math.hypot(dx, dy);
  if (sneak) d *= 1.22;
  if (d > len || d < 4) return false;
  const a = Math.atan2(dy, dx);
  return Math.abs(angNorm(a - heading)) < half;
}

function blocked(def: FloorDef, x: number, y: number, r: number, unlocked: boolean) {
  const samples = [
    [x - r, y],
    [x + r, y],
    [x, y - r],
    [x, y + r],
    [x, y],
  ];
  return samples.some(([sx, sy]) => {
    const tx = Math.floor(sx / TILE);
    const ty = Math.floor(sy / TILE);
    return !walkable(def, tx, ty, unlocked);
  });
}

export function createRun(floorId: FloorId, loadout: LoadoutId): NightRun {
  const floor = floorById(floorId);
  return {
    floor,
    floorId,
    loadout,
    t: RUN_SECONDS,
    ended: false,
    x: floor.spawn.x,
    y: floor.spawn.y,
    stun: 0,
    crawl: 0,
    crawlTo: null,
    smoke: 0,
    alert: 0,
    camerasDead: 0,
    combo: 1,
    comboPeak: 1,
    bag: [],
    bagPeak: 0,
    dropped: null,
    extractedValue: 0,
    extractedTimes: 0,
    clocked: 0,
    hasKey: false,
    unlocked: false,
    powerUsed: false,
    smokeUsed: false,
    quietUsed: false,
    windUsed: false,
    onNoise: false,
    tenFired: false,
    deadPhoneExtracted: false,
    firstExtractElapsed: null,
    stamp: 0,
    flash: 0,
    shake: 0,
    loot: floor.loot.map((l) => ({ ...l, taken: false })),
    guards: floor.guards.map((g) => ({
      x: g.x,
      y: g.y,
      heading: 0,
      patrol: g.patrol,
      pi: 0,
      wait: g.coffee ? 99 : 0.4,
      coffee: !!g.coffee,
      see: 0,
    })),
    cams: floor.cameras.map((c) => ({
      x: c.x,
      y: c.y,
      angle: c.sweepMin,
      min: c.sweepMin,
      max: c.sweepMax,
      dir: 1,
      windup: 0,
      wakeOnEmber: !!c.wakeOnEmber,
      awake: !c.wakeOnEmber,
    })),
    events: [],
  };
}

function bumpCombo(run: NightRun) {
  run.combo = Math.min(COMBO_CAP, run.combo + 1);
  run.comboPeak = Math.max(run.comboPeak, run.combo);
}

function clockPlayer(run: NightRun, warningOnly: boolean) {
  run.clocked += 1;
  run.combo = 1;
  run.stamp = 0.7;
  run.shake = 0.18;
  run.alert = 4.2;
  run.stun = STUN_SECONDS;
  run.events.push(warningOnly ? "warn" : "clocked");
  if (!warningOnly && run.bag.length) {
    run.dropped = { x: run.x, y: run.y, items: [...run.bag] };
    run.bag = [];
  }
}

function tryClock(run: NightRun) {
  if (run.stun > 0) return;
  if (run.loadout === "second-wind" && !run.windUsed) {
    run.windUsed = true;
    clockPlayer(run, true);
    return;
  }
  clockPlayer(run, false);
}

function grabRadius(run: NightRun) {
  return run.loadout === "fast-hands" ? 34 : 22;
}

function interact(run: NightRun) {
  const r = grabRadius(run);
  if (run.dropped && dist(run.x, run.y, run.dropped.x, run.dropped.y) < r + 8) {
    run.bag = [...run.bag, ...run.dropped.items];
    run.bagPeak = Math.max(run.bagPeak, run.bag.length);
    run.dropped = null;
    run.events.push("grab");
    return;
  }
  if (run.floor.powerBox && !run.powerUsed && dist(run.x, run.y, run.floor.powerBox.x, run.floor.powerBox.y) < r + 4) {
    run.powerUsed = true;
    run.camerasDead = POWER_BOX_SECONDS;
    run.events.push("grab");
    return;
  }
  if (run.floor.vent && run.crawl <= 0 && dist(run.x, run.y, run.floor.vent.x, run.floor.vent.y) < r + 6) {
    run.crawl = VENT_SECONDS;
    run.crawlTo = { ...run.floor.vent.to };
    run.t = Math.max(0, run.t - 1);
    return;
  }
  const extract = run.floor.extract;
  if (dist(run.x, run.y, extract.x, extract.y) < r + 10) {
    if (run.bag.length) {
      const val = bagValue(run.bag);
      if (run.bag.includes("phone")) run.deadPhoneExtracted = true;
      run.extractedValue += val;
      run.extractedTimes += 1;
      if (run.firstExtractElapsed === null) run.firstExtractElapsed = RUN_SECONDS - run.t;
      run.bag = [];
      run.flash = 0.28;
      bumpCombo(run);
      run.events.push("extract");
      return;
    }
    if (run.extractedTimes >= 1) {
      run.ended = true;
      return;
    }
  }
  for (const item of run.loot) {
    if (item.taken) continue;
    if (item.locked && !run.unlocked) continue;
    if (dist(run.x, run.y, item.x, item.y) > r) continue;
    item.taken = true;
    if (item.kind === "keycard") {
      run.hasKey = true;
      run.unlocked = true;
      run.events.push("grab");
      bumpCombo(run);
      return;
    }
    run.bag.push(item.kind);
    run.bagPeak = Math.max(run.bagPeak, run.bag.length);
    if (item.kind === "ember") {
      run.events.push("ember");
      run.alert = Math.max(run.alert, 2.4);
      for (const cam of run.cams) {
        if (cam.wakeOnEmber) {
          cam.awake = true;
          cam.windup = CAMERA_WINDUP * 0.6;
        }
      }
    } else {
      run.events.push("grab");
    }
    bumpCombo(run);
    return;
  }
}

export function stepRun(run: NightRun, dt: number, input: Input): NightRun {
  run.events = [];
  if (run.ended) return run;
  const capped = Math.min(0.05, Math.max(0, dt));
  run.t -= capped;
  run.stun = Math.max(0, run.stun - capped);
  run.smoke = Math.max(0, run.smoke - capped);
  run.alert = Math.max(0, run.alert - capped);
  run.camerasDead = Math.max(0, run.camerasDead - capped);
  run.stamp = Math.max(0, run.stamp - capped);
  run.flash = Math.max(0, run.flash - capped);
  run.shake = Math.max(0, run.shake - capped);

  if (run.t <= 10 && !run.tenFired) {
    run.tenFired = true;
    run.events.push("ten");
  }
  if (run.t <= 0) {
    run.t = 0;
    run.ended = true;
    return run;
  }

  if (run.crawl > 0 && run.crawlTo) {
    run.crawl -= capped;
    const k = 1 - run.crawl / VENT_SECONDS;
    run.x += (run.crawlTo.x - run.x) * Math.min(1, k * 0.35 + capped * 3);
    run.y += (run.crawlTo.y - run.y) * Math.min(1, k * 0.35 + capped * 3);
    if (run.crawl <= 0) {
      run.x = run.crawlTo.x;
      run.y = run.crawlTo.y;
      run.crawlTo = null;
    }
  } else if (run.stun <= 0) {
    let speed = 102;
    if (input.sneak) speed *= run.loadout === "long-lungs" ? 0.78 : 0.52;
    const taxAt = run.loadout === "deep-pockets" ? DEEP_POCKETS_AT : BAG_SLOW_AT;
    if (run.bag.length >= taxAt) speed *= 0.86;
    const mag = Math.hypot(input.ax, input.ay);
    const ax = mag > 1 ? input.ax / mag : input.ax;
    const ay = mag > 1 ? input.ay / mag : input.ay;
    const nx = run.x + ax * speed * capped;
    const ny = run.y + ay * speed * capped;
    if (!blocked(run.floor, nx, run.y, 9, run.unlocked)) run.x = nx;
    if (!blocked(run.floor, run.x, ny, 9, run.unlocked)) run.y = ny;
  }

  if (input.dump && run.bag.length && run.stun <= 0) {
    run.dropped = { x: run.x, y: run.y, items: [...run.bag] };
    run.bag = [];
  }
  if (input.smoke && run.loadout === "smoke" && !run.smokeUsed) {
    run.smokeUsed = true;
    run.smoke = SMOKE_SECONDS;
  }
  if (run.bag.length && dist(run.x, run.y, run.floor.extract.x, run.floor.extract.y) < grabRadius(run) + 10) {
    const val = bagValue(run.bag);
    if (run.bag.includes("phone")) run.deadPhoneExtracted = true;
    run.extractedValue += val;
    run.extractedTimes += 1;
    if (run.firstExtractElapsed === null) run.firstExtractElapsed = RUN_SECONDS - run.t;
    run.bag = [];
    run.flash = 0.28;
    bumpCombo(run);
    run.events.push("extract");
  }
  if (input.grab && run.stun <= 0 && run.crawl <= 0) interact(run);

  const tile = tileAt(run.floor, run.x, run.y);
  const noisy = tile === "noise";
  if (noisy && !run.onNoise) {
    const saveCombo = run.loadout === "quiet-soles" && !run.quietUsed;
    if (saveCombo) run.quietUsed = true;
    else {
      run.combo = 1;
      run.events.push("noise");
      run.alert = Math.max(run.alert, 1.6);
      const g = run.guards[0];
      if (g) {
        g.heading = Math.atan2(run.y - g.y, run.x - g.x);
        g.wait = 0.9;
        g.coffee = false;
      }
    }
  }
  run.onNoise = noisy;

  const alert = run.alert > 0;
  const half = (alert ? 0.5 : 0.42) + (run.smoke > 0 ? -0.4 : 0);
  const len = (alert ? 102 : 88) * (run.smoke > 0 ? 0.15 : 1);
  const sneak = input.sneak && run.stun <= 0;

  for (const g of run.guards) {
    if (g.coffee && run.alert < 0.2) {
      g.heading = Math.PI * 0.5 + 0.2;
      g.wait = 1;
    } else {
      g.coffee = false;
      if (g.wait > 0) g.wait -= capped;
      else {
        const tgt = g.patrol[g.pi % g.patrol.length];
        const d = dist(g.x, g.y, tgt.x, tgt.y);
        g.heading = Math.atan2(tgt.y - g.y, tgt.x - g.x);
        if (d < 6) {
          g.pi += 1;
          g.wait = 0.55;
        } else {
          const sp = 42 * capped;
          g.x += Math.cos(g.heading) * sp;
          g.y += Math.sin(g.heading) * sp;
        }
      }
    }
    if (run.smoke > 0) {
      g.see = 0;
      continue;
    }
    if (inCone(g.x, g.y, g.heading, Math.max(0.12, half), len, run.x, run.y, sneak)) {
      g.see += capped;
      if (g.see >= CLOCK_SEE_SECONDS) {
        g.see = 0;
        tryClock(run);
      }
    } else {
      g.see = Math.max(0, g.see - capped * 1.6);
    }
  }

  for (const cam of run.cams) {
    if (run.camerasDead > 0 || !cam.awake) {
      cam.windup = 0;
      continue;
    }
    cam.angle += cam.dir * 0.55 * capped;
    if (cam.angle > cam.max) {
      cam.angle = cam.max;
      cam.dir = -1;
    }
    if (cam.angle < cam.min) {
      cam.angle = cam.min;
      cam.dir = 1;
    }
    if (run.smoke > 0) {
      cam.windup = 0;
      continue;
    }
    const camHalf = alert ? 0.38 : 0.3;
    const camLen = alert ? 120 : 108;
    if (inCone(cam.x, cam.y, cam.angle, camHalf, camLen, run.x, run.y, sneak)) {
      cam.windup += capped;
      if (cam.windup >= CAMERA_WINDUP) {
        cam.windup = 0;
        tryClock(run);
      }
    } else {
      cam.windup = Math.max(0, cam.windup - capped * 2);
    }
  }

  return run;
}

export function scorecard(run: NightRun) {
  const math = finalScore(run.extractedValue, run.comboPeak, run.t, run.extractedTimes);
  const badges = earnBadges({
    extractedTimes: run.extractedTimes,
    clocked: run.clocked,
    bagPeak: run.bagPeak,
    deadPhoneExtracted: run.deadPhoneExtracted,
    firstExtractElapsed: run.firstExtractElapsed,
  });
  const roast = roastLine(math.total, run.clocked, run.deadPhoneExtracted, run.extractedTimes);
  return {
    total: math.total,
    extracted: run.extractedValue,
    clocked: run.clocked,
    combo: run.comboPeak,
    timeBonus: math.time,
    lootLine: math.loot,
    roast,
    badges,
    floor: run.floorId,
    loadout: run.loadout,
    deadPhone: run.deadPhoneExtracted,
  };
}

export type Scorecard = ReturnType<typeof scorecard>;
