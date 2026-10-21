import assert from "node:assert/strict";
import test from "node:test";
import { readPushPrefs, readSubscription, readVapidPublicKey, TEST_NOTICE } from "./push.ts";

test("push subscription rejects anything that is not a web push endpoint", () => {
  assert.equal(readSubscription({ endpoint: "http://example.com/a", keys: { p256dh: "a".repeat(20), auth: "b".repeat(12) } }), null);
  const saved = readSubscription({
    endpoint: "https://push.example/device",
    keys: { p256dh: "abc123DEF_-xyz9876", auth: "authkey_12" },
  });
  assert.deepEqual(saved, {
    endpoint: "https://push.example/device",
    p256dh: "abc123DEF_-xyz9876",
    auth: "authkey_12",
  });
});

test("push prefs keep the quiet-hours default off and ignore unknown events", () => {
  const prefs = readPushPrefs({
    alertsOn: true,
    quietHours: true,
    lowBalanceSol: 0.25,
    events: { paper_trade: false, made_up: false },
  });
  assert.equal(prefs.alertsOn, true);
  assert.equal(prefs.quietHours, true);
  assert.equal(prefs.quietStart, "22:00");
  assert.equal(prefs.lowBalanceSol, 0.25);
  assert.equal(prefs.events.paper_trade, false);
  assert.equal(prefs.events.stop_loss, true);
  assert.equal("made_up" in prefs.events, false);
  assert.equal(readPushPrefs({}).quietHours, false);
  assert.equal(readPushPrefs({ lowBalanceSol: -1 }).lowBalanceSol, 0.1);
});

test("the public vapid key is the only form accepted", () => {
  assert.equal(readVapidPublicKey(""), null);
  assert.equal(readVapidPublicKey("not a key"), null);
  assert.equal(readVapidPublicKey("A".repeat(87)), "A".repeat(87));
  assert.equal(TEST_NOTICE.body, "Test alert. You're all set.");
  assert.equal(TEST_NOTICE.url, "/den?screen=overview");
});
