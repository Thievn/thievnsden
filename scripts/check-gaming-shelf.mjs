/**
 * Date-shelf rules used by src/lib/gaming-data.ts (keep in lockstep).
 * Run: node scripts/check-gaming-shelf.mjs
 */
const CLASSIC_AGE_YEARS = 8;

function parseReleasedUtc(released) {
  const iso = String(released || "").trim().slice(0, 10);
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const t = Date.parse(`${iso}T00:00:00.000Z`);
  return Number.isNaN(t) ? null : t;
}

function utcDay(now) {
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

function classicCutoffUtc(now) {
  return Date.UTC(
    now.getUTCFullYear() - CLASSIC_AGE_YEARS,
    now.getUTCMonth(),
    now.getUTCDate()
  );
}

function shelfFromReleased(released, now = new Date()) {
  const t = parseReleasedUtc(released);
  if (t == null) return "coming";
  const today = utcDay(now);
  if (t > today) return "coming";
  if (t <= classicCutoffUtc(now)) return "classic";
  return "current";
}

const now = new Date(Date.UTC(2026, 7, 27));
const cases = [
  ["The Blood of Dawnwalker", "2026-09-02", "coming"],
  ["Resonance same day", "2026-08-27", "current"],
  ["Beast of Reincarnation", "2026-08-04", "current"],
  ["Hades", "2020-09-17", "current"],
  ["Diablo 4", "2023-06-05", "current"],
  ["TBA", "", "coming"],
  ["Eight years ago", "2018-08-27", "classic"],
  ["Seven years ago", "2019-08-27", "current"],
];

let failed = 0;
for (const [name, date, expected] of cases) {
  const got = shelfFromReleased(date, now);
  const ok = got === expected;
  if (!ok) failed += 1;
  console.log(`${ok ? "ok" : "FAIL"}  ${name}  ${date || "none"}  → ${got} (want ${expected})`);
}

if (failed) {
  console.error(`\n${failed} shelf rule(s) failed`);
  process.exit(1);
}
console.log("\nAll shelf rules passed.");
