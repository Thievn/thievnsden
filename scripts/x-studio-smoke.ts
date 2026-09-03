import {
  defaultCadence,
  hasRawUrl,
  maskKey,
  parseCadence,
  slotDate,
  upcomingSlots,
  wallParts,
  wantsArt,
  zernioScheduleStamp,
} from "../src/lib/x-studio";
import { parseXTrio, sprinkleEmotes } from "../src/lib/x-thoughts";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(hasRawUrl("see https://x.com/a") && !hasRawUrl("link in bio"), "url warn");
assert(maskKey("sk_abcdefghijklmnop").endsWith("mnop"), "mask");
const c = parseCadence({ per_day: 9, types: ["thought"], times: ["11:00", "19:00"], days: [1, 2, 3, 4, 5], mode: "auto" });
assert(c.per_day === 4 && c.mode === "auto" && c.types[0] === "thought", "parse cadence");
assert(wantsArt("art", ["art"], 0) && !wantsArt("quote", ["quote"], 0), "art flag");
assert(wantsArt("mixed", ["thought", "art"], 1), "mixed art");
const parts = wallParts(new Date("2026-09-03T15:00:00Z"), "America/New_York");
assert(parts.stamp.length === 10, "stamp");
const slot = slotDate("2026-09-03", "11:00", "America/New_York");
assert(!Number.isNaN(slot.getTime()), "slot date");
const ny = zernioScheduleStamp(slot.toISOString(), "America/New_York");
assert(/T11:00:00$/.test(ny), "zernio stamp " + ny);
const cad = defaultCadence();
const up = upcomingSlots({ ...cad, days: [0, 1, 2, 3, 4, 5, 6], times: ["11:00", "19:00"], per_day: 2 }, new Date("2026-09-03T12:00:00Z"), 4);
assert(up.length === 4, "upcoming " + up.length);
const trio = parseXTrio('{"dry":"ice","mean":"cut","unhinged":"filth","pick":"mean"}');
assert(trio.pick === "mean", "trio intact");
assert(sprinkleEmotes("line", "💀").includes("💀"), "emotes intact");

console.log("x-studio smoke ok");
