import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { buildPrompt, DEFAULTS, describe, F, STYLES } from "./options.ts";
import { qwenEdit } from "./workflows.ts";

test("art styles and the default character copy match lustforge-lab", () => {
  assert.equal(STYLES.length, 21);
  assert.equal(STYLES[0].id, "photoreal");
  assert.equal(STYLES.find((style: { id: string }) => style.id === "hentaiish").label, "Ecchi Anime");
  assert.equal(STYLES.find((style: { id: string }) => style.id === "goth").prefix.includes("rose and plum"), true);
  assert.equal(DEFAULTS.outfit, "Gothic lace dress");
  assert.equal(DEFAULTS.hairColor, "Copper red");
  assert.equal(DEFAULTS.age, "Mid 20s");
  assert.ok(F.age.includes("18–19 (adult)"));
  assert.ok(F.vibe.includes("Seductive"));
  assert.ok(F.setting.includes("Gothic cathedral"));
  const young = buildPrompt({ ...DEFAULTS, age: "18–19 (adult)" });
  assert.match(young, /young adult \(21\+\)/);
  assert.doesNotMatch(young, /18–19/);
  assert.match(buildPrompt(DEFAULTS), /gothic lace dress/i);
  assert.match(describe({ ...DEFAULTS, age: "18–19 (adult)" }, "Vesper"), /21-year-old/);
});

test("pose keywords stay hidden on the card and searchable", () => {
  const poses = JSON.parse(readFileSync(new URL("./poses.json", import.meta.url), "utf8")) as { name: string; hint: string }[];
  const mirror = poses.filter((pose) => pose.hint.toLowerCase().includes("mirror"));
  assert.ok(mirror.length > 0);
  assert.equal(mirror.some((pose) => pose.name.toLowerCase().includes("mirror")), true);
  const picker = readFileSync(new URL("../../components/den/lab/pose.tsx", import.meta.url), "utf8");
  assert.match(picker, /pose\.hint/);
  assert.match(picker, /Search poses \(e\.g\. mirror, kneel, couch\)/);
});

test("the pixel-drift fix matches the lustforge editor and skips pose edits", () => {
  const still = JSON.stringify(qwenEdit({ instr: "retouch", seed: 1, denoise: 1, refs: false, pose: false, mask: false }));
  const posed = JSON.stringify(qwenEdit({ instr: "retouch", seed: 1, denoise: 1, refs: false, pose: true, mask: true }));
  assert.match(still, /PixelDriftFix/);
  assert.match(still, /flat_4_points/);
  assert.match(still, /LFPixelPerfectComposite/);
  assert.match(still, /"mode":"auto"/);
  assert.equal(posed.includes("PixelDriftFix"), false);
  assert.match(posed, /"mode":"mask"/);
  const source = readFileSync(new URL("./workflows.ts", import.meta.url), "utf8");
  assert.match(source, /Chroma1-HD-fp8mixed\.safetensors/);
  assert.match(source, /ConditioningZeroOut/);
  assert.match(source, /cfg:5\.5/);
  assert.match(source, /Qwen-Image-Edit-2511-Lightning-4steps-V1\.0-bf16\.safetensors/);
});

test("enhance prompts, gallery storage, and the missing character table", () => {
  const dispatch = readFileSync(new URL("./dispatch.ts", import.meta.url), "utf8");
  assert.match(dispatch, /You are the prompt engineer for a private adult character-art tool/);
  assert.match(dispatch, /You rewrite IMAGE-EDIT instructions for Qwen-Image-Edit/);
  assert.match(dispatch, /grok-4\.20-0309-non-reasoning/);
  assert.match(dispatch, /Everyone shown is an adult \(21\+\)/);
  assert.doesNotMatch(dispatch, /CREATOR_PASSWORD|BLOB_READ_WRITE_TOKEN|knag1yvb1tlqk3/);
  const sql = readFileSync(new URL("../../../supabase/lab.sql", import.meta.url), "utf8");
  assert.equal(/drop\s/i.test(sql), false);
  assert.equal(sql.includes("lab_characters"), false);
  assert.match(sql, /add column if not exists src/);
  assert.equal(sql.includes("tyaplrrlirlbqrfjqryo"), false);
  const app = readFileSync(new URL("../../components/den/lab/LabApp.tsx", import.meta.url), "utf8");
  assert.equal(app.includes("character"), false);
});
