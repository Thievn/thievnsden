import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { composeNegative, composePositive, decideFace, HIDDEN_AGE_NEGATIVE, isExplicit, minorReason, SPICY_NOTE } from "./safety.ts";
import { chromaGraph, qwenEditGraph, zimageGraph } from "./workflows.ts";

test("age terms are blocked and adult explicit text is not", () => {
  assert.equal(minorReason("a nude portrait of a 28 year old woman"), null);
  assert.equal(minorReason("photoreal adult in a red dress"), null);
  assert.equal(minorReason("a 16 year old"), "Adults only.");
  assert.equal(minorReason("eighteen year old"), "Adults only.");
  assert.equal(minorReason("schoolgirl uniform"), "Adults only.");
  assert.equal(minorReason("l0li"), "Adults only.");
  assert.equal(minorReason("young girl at the park"), "Adults only.");
  assert.equal(minorReason(""), null);
});

test("the hidden age negative is server-side and does not ban nudity", () => {
  const negative = composeNegative("blurry hands");
  assert.match(negative, /child/);
  assert.match(negative, /blurry hands/);
  assert.equal(negative.includes(HIDDEN_AGE_NEGATIVE), true);
  assert.doesNotMatch(HIDDEN_AGE_NEGATIVE, /nude|naked|nsfw/i);
  const positive = composePositive("nude portrait, red dress", "Photoreal still.", true);
  assert.match(positive, /nude portrait/);
  assert.match(positive, /21 or older/);
  assert.doesNotMatch(positive, /no nudity|must be clothed|sfw/i);
});

test("explicit edits of someone else's real face are the only face block", () => {
  const stranger = { realFace: true, faceCount: 1, minor: false, samePerson: false };
  const dean = { realFace: true, faceCount: 1, minor: false, samePerson: true };
  const drawing = { realFace: false, faceCount: 0, minor: false, samePerson: null };
  assert.equal(isExplicit("change the jacket and the street"), false);
  assert.equal(isExplicit("a nude portrait"), true);
  assert.equal(decideFace(stranger, false).ok, true);
  assert.equal(decideFace(stranger, true).ok, false);
  assert.equal(decideFace(stranger, true).ok ? "" : (decideFace(stranger, true) as { error: string }).error, SPICY_NOTE);
  assert.equal(decideFace(dean, true).ok, true);
  assert.equal(decideFace(drawing, true).ok, true);
  assert.equal(decideFace({ realFace: true, faceCount: 2, minor: false, samePerson: true }, false).ok, true);
  assert.equal(decideFace({ realFace: true, faceCount: 2, minor: false, samePerson: true }, true).ok, false);
  assert.equal(decideFace(null, false).ok, false);
  assert.equal(decideFace({ ...stranger, minor: true }, false).ok, false);
});

test("generation graphs carry the hidden age negative and no nudity sticker", () => {
  const opts = { seed: 1, steps: 8, cfg: 1, w: 832, h: 1216 };
  for (const graph of [chromaGraph("a woman", "", opts), zimageGraph("a woman", "", opts), qwenEditGraph("a woman", "", { seed: 1, denoise: 0.5, images: {} })]) {
    const text = JSON.stringify(graph);
    assert.match(text, /minor/);
    assert.doesNotMatch(text, /nudity sticker|black bar|censor/i);
  }
});

test("the public site does not mention the attic", () => {
  const files = [
    "../../app/page.tsx",
    "../../app/layout.tsx",
    "../../app/not-found.tsx",
    "../../components/landing/SignIn.tsx",
    "../../components/landing/landing.module.css",
  ];
  for (const file of files) {
    const text = readFileSync(new URL(file, import.meta.url), "utf8");
    assert.equal(/attic|den's attic/i.test(text), false, file);
  }
});
