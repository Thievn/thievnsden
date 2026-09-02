import type { FloorId, LootKind } from "./night-grab";

export const TILE = 32;

export type TileKind = "wall" | "floor" | "glass" | "noise" | "extract" | "vent" | "spawn";

export type Patrol = { x: number; y: number }[];

export type FloorGuard = {
  x: number;
  y: number;
  patrol: Patrol;
  coffee?: boolean;
};

export type FloorCamera = {
  x: number;
  y: number;
  sweepMin: number;
  sweepMax: number;
  wakeOnEmber?: boolean;
};

export type FloorLoot = {
  id: string;
  kind: LootKind;
  x: number;
  y: number;
  locked?: boolean;
};

export type FloorDef = {
  id: FloorId;
  name: string;
  w: number;
  h: number;
  tiles: TileKind[][];
  spawn: { x: number; y: number };
  extract: { x: number; y: number };
  vent?: { x: number; y: number; to: { x: number; y: number } };
  powerBox?: { x: number; y: number };
  keycardDoor?: { x: number; y: number };
  lockedRoom?: { x: number; y: number }[];
  guards: FloorGuard[];
  cameras: FloorCamera[];
  loot: FloorLoot[];
};

function row(s: string): TileKind[] {
  return [...s].map((c) => {
    if (c === "#") return "wall";
    if (c === "g") return "glass";
    if (c === "N") return "noise";
    if (c === "E") return "extract";
    if (c === "V") return "vent";
    if (c === "S") return "spawn";
    return "floor";
  });
}

function grid(lines: string[]): TileKind[][] {
  return lines.map(row);
}

function find(tiles: TileKind[][], kind: TileKind): { x: number; y: number } {
  for (let y = 0; y < tiles.length; y++) {
    for (let x = 0; x < tiles[y].length; x++) {
      if (tiles[y][x] === kind) return { x: x * TILE + TILE / 2, y: y * TILE + TILE / 2 };
    }
  }
  return { x: TILE * 2, y: TILE * 2 };
}

function px(tx: number, ty: number) {
  return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
}

function loot(id: string, kind: LootKind, tx: number, ty: number, locked?: boolean): FloorLoot {
  return { id, kind, x: px(tx, ty).x, y: px(tx, ty).y, locked };
}

/** Floor A — Offices. Desks, break room, glass cameras love. */
function offices(): FloorDef {
  const tiles = grid([
    "####################",
    "#S..##.....g....E.##",
    "#...##.....g......##",
    "#......##..g..##..##",
    "#......##.....N...##",
    "##g#######g########",
    "#........##.......#",
    "#..V.....##.......#",
    "#........##.......#",
    "####g####g####....#",
    "#.............##..#",
    "#.............##..#",
    "#.................#",
    "####################",
  ]);
  return {
    id: "offices",
    name: "Offices",
    w: 20,
    h: 14,
    tiles,
    spawn: find(tiles, "spawn"),
    extract: find(tiles, "extract"),
    vent: { x: px(3, 7).x, y: px(3, 7).y, to: px(16, 10) },
    powerBox: px(11, 6),
    keycardDoor: px(14, 9),
    lockedRoom: [px(15, 10), px(16, 10), px(17, 10), px(15, 11), px(16, 11), px(17, 11)],
    guards: [
      { x: px(8, 3).x, y: px(8, 3).y, patrol: [px(8, 2), px(12, 2), px(12, 4), px(8, 4)] },
      { x: px(6, 11).x, y: px(6, 11).y, patrol: [px(2, 11), px(12, 11), px(12, 12), px(2, 12)] },
      { x: px(16, 7).x, y: px(16, 7).y, patrol: [px(14, 6), px(17, 6), px(17, 8), px(14, 8)], coffee: true },
    ],
    cameras: [
      { x: px(10, 1).x, y: px(10, 1).y, sweepMin: 0.2, sweepMax: Math.PI - 0.2 },
      { x: px(18, 4).x, y: px(18, 4).y, sweepMin: Math.PI * 0.6, sweepMax: Math.PI * 1.4, wakeOnEmber: true },
    ],
    loot: [
      loot("o1", "cash", 2, 2),
      loot("o2", "cash", 4, 3),
      loot("o3", "watch", 7, 2),
      loot("o4", "cash", 9, 4),
      loot("o5", "jewelry", 11, 3),
      loot("o6", "cash", 3, 6),
      loot("o7", "watch", 5, 8),
      loot("o8", "phone", 2, 12),
      loot("o9", "cash", 8, 12),
      loot("o10", "ember", 16, 3),
      loot("o11", "keycard", 10, 11),
      loot("o12", "jewelry", 16, 11, true),
      loot("o13", "ember", 17, 10, true),
    ],
  };
}

/** Floor B — Vault wing. Tight hall, fat high-loot room, bad sightlines. */
function vault(): FloorDef {
  const tiles = grid([
    "################",
    "#S....#........#",
    "#.....#........#",
    "##N####g####...#",
    "#.....#....#...#",
    "#.....#....#E..#",
    "#..V..#....#...#",
    "#######g####...#",
    "#..............#",
    "#..............#",
    "#..............#",
    "################",
  ]);
  return {
    id: "vault",
    name: "Vault wing",
    w: 16,
    h: 12,
    tiles,
    spawn: find(tiles, "spawn"),
    extract: find(tiles, "extract"),
    vent: { x: px(3, 6).x, y: px(3, 6).y, to: px(13, 4) },
    powerBox: px(10, 8),
    keycardDoor: px(6, 3),
    lockedRoom: [px(7, 4), px(8, 4), px(9, 4), px(7, 5), px(8, 5), px(9, 5), px(7, 6), px(8, 6)],
    guards: [
      { x: px(3, 4).x, y: px(3, 4).y, patrol: [px(1, 4), px(4, 4), px(4, 6), px(1, 6)] },
      { x: px(12, 2).x, y: px(12, 2).y, patrol: [px(8, 1), px(14, 1), px(14, 2), px(8, 2)] },
      { x: px(8, 9).x, y: px(8, 9).y, patrol: [px(2, 9), px(13, 9), px(13, 10), px(2, 10)] },
      { x: px(13, 8).x, y: px(13, 8).y, patrol: [px(12, 8), px(14, 8), px(14, 10), px(12, 10)], coffee: true },
    ],
    cameras: [
      { x: px(8, 1).x, y: px(8, 1).y, sweepMin: 0, sweepMax: Math.PI },
      { x: px(14, 5).x, y: px(14, 5).y, sweepMin: Math.PI * 0.7, sweepMax: Math.PI * 1.6, wakeOnEmber: true },
      { x: px(1, 8).x, y: px(1, 8).y, sweepMin: -0.4, sweepMax: 1.2 },
    ],
    loot: [
      loot("v1", "cash", 2, 1),
      loot("v2", "watch", 4, 2),
      loot("v3", "cash", 2, 5),
      loot("v4", "jewelry", 4, 5),
      loot("v5", "phone", 1, 10),
      loot("v6", "cash", 5, 10),
      loot("v7", "watch", 11, 9),
      loot("v8", "ember", 13, 2),
      loot("v9", "keycard", 13, 10),
      loot("v10", "jewelry", 8, 4, true),
      loot("v11", "ember", 9, 5, true),
      loot("v12", "watch", 7, 6, true),
      loot("v13", "cash", 8, 6, true),
      loot("v14", "jewelry", 9, 4, true),
    ],
  };
}

/** Floor C — Docks. Long lane, noisy grate, extract far on purpose. */
function docks(): FloorDef {
  const tiles = grid([
    "##########################",
    "#S.......................#",
    "#........................#",
    "######N######g######.....#",
    "#.....#......#......#....#",
    "#..V..#......#......#E...#",
    "#.....#......#......#....#",
    "######.######.######.....#",
    "#........................#",
    "#........................#",
    "#........................#",
    "##########################",
  ]);
  return {
    id: "docks",
    name: "Docks",
    w: 26,
    h: 12,
    tiles,
    spawn: find(tiles, "spawn"),
    extract: find(tiles, "extract"),
    vent: { x: px(3, 5).x, y: px(3, 5).y, to: px(21, 5) },
    powerBox: px(12, 8),
    keycardDoor: px(13, 3),
    lockedRoom: [px(14, 4), px(15, 4), px(16, 4), px(14, 5), px(15, 5), px(16, 5)],
    guards: [
      { x: px(10, 1).x, y: px(10, 1).y, patrol: [px(4, 1), px(20, 1), px(20, 2), px(4, 2)] },
      { x: px(7, 9).x, y: px(7, 9).y, patrol: [px(2, 8), px(22, 8), px(22, 10), px(2, 10)] },
      { x: px(18, 5).x, y: px(18, 5).y, patrol: [px(19, 4), px(24, 4), px(24, 6), px(19, 6)], coffee: true },
    ],
    cameras: [
      { x: px(12, 1).x, y: px(12, 1).y, sweepMin: 0, sweepMax: Math.PI },
      { x: px(24, 3).x, y: px(24, 3).y, sweepMin: Math.PI * 0.5, sweepMax: Math.PI * 1.4, wakeOnEmber: true },
    ],
    loot: [
      loot("d1", "cash", 3, 1),
      loot("d2", "cash", 6, 2),
      loot("d3", "watch", 9, 1),
      loot("d4", "jewelry", 14, 2),
      loot("d5", "cash", 3, 9),
      loot("d6", "watch", 8, 9),
      loot("d7", "phone", 1, 10),
      loot("d8", "ember", 22, 1),
      loot("d9", "keycard", 11, 10),
      loot("d10", "cash", 20, 9),
      loot("d11", "jewelry", 15, 4, true),
      loot("d12", "ember", 16, 5, true),
      loot("d13", "watch", 14, 5, true),
    ],
  };
}

export const FLOORS: Record<FloorId, FloorDef> = {
  offices: offices(),
  vault: vault(),
  docks: docks(),
};

export function floorById(id: FloorId): FloorDef {
  return FLOORS[id];
}

export function walkable(def: FloorDef, tx: number, ty: number, unlocked: boolean): boolean {
  if (ty < 0 || tx < 0 || ty >= def.h || tx >= def.w) return false;
  const t = def.tiles[ty][tx];
  if (t === "wall") return false;
  if (!unlocked && def.lockedRoom?.some((p) => Math.floor(p.x / TILE) === tx && Math.floor(p.y / TILE) === ty)) {
    return false;
  }
  return true;
}

export function tileAt(def: FloorDef, x: number, y: number): TileKind {
  const tx = Math.floor(x / TILE);
  const ty = Math.floor(y / TILE);
  if (ty < 0 || tx < 0 || ty >= def.h || tx >= def.w) return "wall";
  return def.tiles[ty][tx];
}
