import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { buildCharacterPrompt, knownStyle, sanitizeRecipe, withPose, type Recipe } from "./presets.ts";
import { minorReason } from "./safety.ts";
import { qwenEditGraph } from "./workflows.ts";

const recipe: Recipe = {
  name: "Mira",
  style: "photoreal",
  appearance: { length: "long", color: "black", eyes: "green", wardrobe: "silk" },
  personality: "teasing",
  scene: "rain",
  action: "She waits by the window",
};

test("the builder keeps allowlisted traits and drops anything else", () => {
  const clean = sanitizeRecipe({
    style: "not-a-style",
    appearance: { length: "long", age: "teen", eyes: "green" },
    personality: "teasing",
    scene: "nope",
    action: "  standing in the doorway  ",
    name: " Mira ",
  });
  assert.ok(clean);
  assert.equal(clean.style, "semireal");
  assert.deepEqual(clean.appearance, { length: "long", eyes: "green" });
  assert.equal(clean.personality, "teasing");
  assert.equal(clean.scene, "");
  assert.equal(clean.action, "standing in the doorway");
  assert.equal(clean.name, "Mira");
  assert.equal(sanitizeRecipe(null), null);
  assert.equal(knownStyle("fashion"), true);
  assert.equal(knownStyle("nope"), false);
});

test("the built prompt matches the selected presets and blocks an underage action", () => {
  const prompt = buildCharacterPrompt(recipe);
  assert.match(prompt, /Her name is Mira/);
  assert.match(prompt, /Her hair is long/);
  assert.match(prompt, /Her hair is black/);
  assert.match(prompt, /Her eyes are green/);
  assert.match(prompt, /black silk dress/);
  assert.match(prompt, /teasing/);
  assert.match(prompt, /rain-streaked window/);
  assert.match(prompt, /She waits by the window\./);
  assert.equal(minorReason(prompt), null);
  const blocked = buildCharacterPrompt({ ...recipe, action: "a 16 year old in a dress" });
  assert.equal(minorReason(blocked), "Adults only.");
  assert.match(buildCharacterPrompt({ ...recipe, name: "", appearance: {}, personality: "", scene: "", action: "" }), /adult woman/i);
});

test("pose keywords are inserted once", () => {
  const once = withPose("keep the coat", "lookback");
  assert.match(once, /looking back over her shoulder/);
  assert.equal(withPose(once, "lookback"), once);
});

test("editor jobs can lock the pixel-drift fix", () => {
  const open = JSON.stringify(qwenEditGraph("a woman", "", { seed: 1, denoise: 0.5, images: {} }));
  const locked = JSON.stringify(qwenEditGraph("a woman", "", { seed: 1, denoise: 0.5, images: {}, lock: true }));
  assert.equal(open.includes("PixelDriftFix"), false);
  assert.match(locked, /PixelDriftFix/);
  assert.match(locked, /LFPixelPerfectComposite/);
  assert.match(locked, /LFPrepareEdit/);
  const handle = readFileSync(new URL("./handle.ts", import.meta.url), "utf8");
  const edit = handle.slice(handle.indexOf("async function edit"));
  assert.match(edit, /lock:\s*true/);
  assert.doesNotMatch(handle, /CREATOR_PASSWORD|password:\s*"abc"/);
});

test("lab pages stay owner-only, unindexed, and off the public page", () => {
  const layout = readFileSync(new URL("../../app/attic/layout.tsx", import.meta.url), "utf8");
  const page = readFileSync(new URL("../../app/attic/[[...slug]]/page.tsx", import.meta.url), "utf8");
  const route = readFileSync(new URL("../../app/api/lab/route.ts", import.meta.url), "utf8");
  const config = readFileSync(new URL("../../../next.config.ts", import.meta.url), "utf8");
  const landing = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
  assert.match(layout, /hasOwnerSession/);
  assert.match(layout, /notFound/);
  assert.match(layout, /index:\s*false/);
  assert.match(page, /hasOwnerSession/);
  assert.match(page, /notFound/);
  assert.match(route, /hasOwnerSession/);
  assert.match(config, /\/edit/);
  assert.match(config, /\/gallery/);
  assert.match(config, /\/characters/);
  assert.match(config, /noindex, nofollow/);
  assert.equal(existsSync(new URL("../../app/sitemap.ts", import.meta.url)), false);
  assert.equal(landing.includes("/attic"), false);
  assert.equal(landing.includes("/edit"), false);
  assert.equal(landing.includes("/gallery"), false);
  assert.equal(landing.includes("/characters"), false);
});
