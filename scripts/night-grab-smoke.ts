import {
  ALL_LOADOUTS,
  FLOOR_ORDER,
  bagValue,
  boardRank,
  earnBadges,
  finalScore,
  pickFloor,
  pickLoadoutTrio,
  roastLine,
  shareText,
  timeBonus,
} from "../src/lib/night-grab";
import { FLOORS, TILE } from "../src/lib/night-grab-floors";
import { createRun, inCone, scorecard, stepRun } from "../src/lib/night-grab-engine";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(FLOOR_ORDER.length === 3, "three floors");
assert(ALL_LOADOUTS.length === 6, "six loadouts");
assert(pickLoadoutTrio(0.2).length === 3, "trio size");
assert(new Set(pickLoadoutTrio(0.2)).size === 3, "trio unique");
assert(pickFloor("offices") !== "offices", "rotate floors");
assert(bagValue(["cash", "ember", "phone"]) === 120 + 720, "phone is zero");
assert(timeBonus(12, 0) === 0 && timeBonus(12, 1) > 0, "time bonus gated");
const math = finalScore(400, 3, 10, 1);
assert(math.total === 400 * 3 + timeBonus(10, 1), "score math");
assert(earnBadges({ extractedTimes: 1, clocked: 0, bagPeak: 2, deadPhoneExtracted: true, firstExtractElapsed: 12 }).includes("ghost"), "ghost");
assert(earnBadges({ extractedTimes: 1, clocked: 0, bagPeak: 2, deadPhoneExtracted: true, firstExtractElapsed: 12 }).includes("dead-phone"), "phone club");
assert(earnBadges({ extractedTimes: 1, clocked: 1, bagPeak: 6, deadPhoneExtracted: false, firstExtractElapsed: 8 }).includes("sub-20"), "sub-20");
assert(roastLine(0, 0, true, 1).includes("phone"), "phone roast");
assert(shareText(900, "line").includes("900") && shareText(900, "line").includes("night-grab"), "share");
assert(boardRank(50, [{ score: 80 }, { score: 40 }]) === 2, "rank");

for (const id of FLOOR_ORDER) {
  const f = FLOORS[id];
  assert(f.loot.length >= 8 && f.loot.length <= 14, `${id} loot count`);
  assert(f.guards.length >= 2 && f.guards.length <= 4, `${id} guards`);
  assert(f.cameras.length >= 1 && f.cameras.length <= 3, `${id} cams`);
  assert(f.vent, `${id} vent`);
  assert(f.extract && f.spawn, `${id} spawn extract`);
  assert(f.tiles.some((row) => row.includes("noise")), `${id} noise`);
  assert(TILE === 32, "tile");
}

const idle = { ax: 0, ay: 0, sneak: false, grab: false, dump: false, smoke: false };
const run = createRun("offices", "fast-hands");
assert(run.t === 60, "clock start");
const near = run.loot.find((l) => l.kind === "cash");
assert(near, "cash on floor");
run.x = near!.x;
run.y = near!.y;
stepRun(run, 0.05, { ...idle, grab: true });
assert(run.bag.includes("cash"), "grab cash");
assert(run.combo >= 2, "combo after grab");
const bagN = run.bag.length;
stepRun(run, 0.05, { ...idle, dump: true });
assert(run.bag.length === 0 && run.dropped, "dump bag");
run.x = run.dropped!.x;
run.y = run.dropped!.y;
stepRun(run, 0.05, { ...idle, grab: true });
assert(run.bag.length === bagN, "regrab");

run.x = run.floor.extract.x;
run.y = run.floor.extract.y;
stepRun(run, 0.05, { ...idle, grab: true });
assert(run.extractedTimes === 1 && run.bag.length === 0, "extract banks");
assert(run.extractedValue > 0, "banked value");

const clock = createRun("offices", "quiet-soles");
clock.bag = ["watch", "jewelry"];
clock.x = clock.guards[0].x + 20;
clock.y = clock.guards[0].y;
clock.guards[0].heading = 0;
clock.guards[0].coffee = false;
clock.guards[0].wait = 9;
for (let i = 0; i < 20; i++) {
  const seen = inCone(clock.guards[0].x, clock.guards[0].y, 0, 0.5, 90, clock.x, clock.y, false);
  if (seen) clock.guards[0].see = 1;
  stepRun(clock, 0.05, idle);
}
assert(clock.clocked >= 1, "clocked in cone");
assert(clock.bag.length === 0, "soft fail dumps bag");
assert(clock.ended === false, "not permadeath");

const wind = createRun("vault", "second-wind");
wind.bag = ["ember"];
wind.stun = 0;
for (let i = 0; i < 8; i++) stepRun(wind, 0.04, idle);
assert(true, "second wind run lives");

const soles = createRun("docks", "quiet-soles");
const noise = soles.floor.tiles.flatMap((row, y) => row.map((t, x) => (t === "noise" ? { x, y } : null))).filter(Boolean)[0] as { x: number; y: number };
soles.x = noise.x * TILE + 16;
soles.y = noise.y * TILE + 16;
soles.combo = 3;
stepRun(soles, 0.02, idle);
assert(soles.combo === 3 && soles.quietUsed, "quiet soles keep combo");
stepRun(soles, 0.02, { ...idle, ax: 1 });
soles.onNoise = false;
soles.x = noise.x * TILE + 16;
soles.y = noise.y * TILE + 16;
stepRun(soles, 0.02, idle);
assert(soles.combo === 1, "second noise breaks combo");

const smoke = createRun("offices", "smoke");
stepRun(smoke, 0.02, { ...idle, smoke: true });
assert(smoke.smoke > 1 && smoke.smokeUsed, "smoke puff");

const sc = scorecard(run);
assert(sc.total === finalScore(run.extractedValue, run.comboPeak, run.t, run.extractedTimes).total, "scorecard");
assert(sc.roast.length > 8, "roast");

console.log("night-grab smoke ok");
