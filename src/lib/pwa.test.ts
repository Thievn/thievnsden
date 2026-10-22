import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("service worker caches an offline shell and never stores API responses", () => {
  const sw = readFileSync(new URL("../../public/sw.js", import.meta.url), "utf8");
  const install = sw.slice(sw.indexOf('addEventListener("install"'), sw.indexOf('addEventListener("activate"'));
  assert.match(sw, /const VERSION = "1\.0"/);
  assert.match(sw, /SKIP_WAITING/);
  assert.match(sw, /offline\.html/);
  assert.match(sw, /startsWith\("\/api\/"\)/);
  assert.match(sw, /pathname === "\/sw\.js"/);
  assert.match(sw, /showNotification/);
  assert.match(sw, /notificationclick/);
  assert.doesNotMatch(install, /skipWaiting/);
  assert.doesNotMatch(sw, /cache\.put/);
  assert.doesNotMatch(sw, /unregister/);
});

test("the update toast waits for a real update and the install banner stays inside the app", () => {
  const pwa = readFileSync(new URL("../../public/pwa.js", import.meta.url), "utf8");
  assert.match(pwa, /__denHadCtl/);
  assert.match(pwa, /updateViaCache:\s*"none"/);
  assert.match(pwa, /updatefound/);
  assert.match(pwa, /installed/);
  assert.match(pwa, /SKIP_WAITING/);
  assert.match(pwa, /controllerchange/);
  assert.match(pwa, /data-den-app/);
  assert.match(pwa, /beforeinstallprompt/);
  assert.match(pwa, /Add to Home Screen/);
  assert.doesNotMatch(pwa, /\b(trad(e|ing)|crypto|wallet|solana|bitcoin|token|money|bot)\b/i);
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
    "../components/landing/SignIn.tsx",
    "../components/landing/landing.module.css",
  ];
  const banned = /\b(trad(e|ing)|crypto|wallet|solana|bitcoin|token|money|bot)\b/i;
  for (const file of files) {
    const text = readFileSync(new URL(file, import.meta.url), "utf8");
    assert.equal(banned.test(text), false, file);
    assert.equal(text.includes("/desk"), false, file);
    assert.equal(/binance|coinbase/i.test(text), false, file);
  }
});
