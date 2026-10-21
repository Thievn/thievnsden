import assert from "node:assert/strict";
import test from "node:test";
import { explainReason, stageLabel } from "./reasons.ts";

test("reason codes use the label file, including wildcards", () => {
  assert.equal(stageLabel("facts"), "Rug sniff test");
  assert.equal(stageLabel("budget"), "Grok's off duty");
  assert.equal(stageLabel("mystery"), "mystery");

  assert.equal(
    explainReason("facts", "SKIP", "mint_open").label,
    "The dev can still print more coins whenever they want. Hard pass.",
  );
  assert.equal(explainReason("facts", "SKIP", "mint_open").raw, "mint_open");

  const danger = explainReason("facts", "SKIP", "danger:Freeze authority is still on");
  assert.equal(danger.label, "Rugcheck flagged a big red warning: Freeze authority is still on.");
  assert.equal(danger.raw, "danger:Freeze authority is still on");

  assert.equal(
    explainReason("facts", "SKIP", "rugcheck failed: 503").label,
    "Rugcheck was down, so this one got skipped. No guessing.",
  );
  assert.equal(
    explainReason("pool", "SKIP", "dexscreener failed").label,
    "DexScreener was down, so this one got skipped. No guessing.",
  );
  assert.equal(
    explainReason("grok", "SKIP", "grok failed: timed out").label,
    "Grok didn't answer, so this one got skipped. No guessing.",
  );

  const liked = explainReason("grok", "BUY", "People are actually arguing about this one.");
  assert.equal(liked.label, "Grok likes it: People are actually arguing about this one.");
  assert.equal(liked.raw, null);
  assert.equal(
    explainReason("grok", "SKIP", "The posts feel bought.").label,
    "Grok smelled a rat: The posts feel bought.",
  );

  const missing = explainReason("limits", "SKIP", "brand_new_code");
  assert.equal(missing.label, "brand_new_code");
  assert.equal(missing.raw, null);
  assert.equal(explainReason("limits", "SKIP", null).label, "No reason.");
});
