import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("service worker caches an offline shell and never stores API responses", () => {
  const sw = readFileSync(new URL("../../public/sw.js", import.meta.url), "utf8");
  assert.match(sw, /offline\.html/);
  assert.match(sw, /startsWith\("\/api\/"\)/);
  assert.doesNotMatch(sw, /cache\.put/);
  assert.doesNotMatch(sw, /unregister/);
});

test("manifest is a standalone app named Den", () => {
  const manifest = readFileSync(new URL("../app/manifest.ts", import.meta.url), "utf8");
  assert.match(manifest, /name: "Thievn's Den"/);
  assert.match(manifest, /short_name: "Den"/);
  assert.match(manifest, /display: "standalone"/);
  assert.match(manifest, /#0B0D12/);
  assert.match(manifest, /purpose: "maskable"/);
  assert.match(manifest, /192x192/);
  assert.match(manifest, /512x512/);
});

test("the public page does not mention the desk", () => {
  const files = [
    "../app/page.tsx",
    "../app/layout.tsx",
    "../app/not-found.tsx",
    "../components/DenStory.tsx",
    "../components/CrewCode.tsx",
    "../components/SiteFooter.tsx",
    "../components/VaultDoor.tsx",
  ];
  const banned = /\b(trad(e|ing)|crypto|wallet|solana|bitcoin|token|money|bot)\b/i;
  for (const file of files) {
    const text = readFileSync(new URL(file, import.meta.url), "utf8");
    assert.equal(banned.test(text), false, file);
  }
});
