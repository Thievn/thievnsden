import {
  HEAT_SKINS,
  HEAT_ROLES,
  HEAT_TAGLINE,
  sourceHash,
  canPlayHeat,
  isFadeText,
  parseHeatTurn,
  parseJsonObject,
  splitScene,
  parseHeatSettings,
  DEFAULT_HEAT_SETTINGS,
  lookKey,
  vibeForLook,
} from "../src/lib/heat-check";
import { HEAT_CHECK_STILL, playgroundStill } from "../src/lib/playground-games";
import type { User } from "@supabase/supabase-js";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const owner = { email: "thievnsden@gmail.com", user_metadata: { username: "THIEVN" } } as unknown as User;
const rando = { email: "x@y.z", user_metadata: { username: "guest" } } as unknown as User;

assert(isFadeText("FADE") && isFadeText(" fade "), "fade");
assert(!isFadeText("fade out"), "not fade phrase");

const turn = parseHeatTurn({
  scene: "you still up?\n\ndon't leave me on read",
  tip: "They're checking consent. Don't dump.",
  score: 8,
  rewrite: null,
  mood: "needy",
  read_delay_ms: 4000,
  reward_photo: false,
  ended: false,
  end_reason: null,
});
assert(turn.scene.includes("you still up"), "scene");
assert(!turn.scene.includes("Don't dump"), "tip stays out of scene");
assert(splitScene(turn.scene).length === 2, "split");
assert(turn.read_delay_ms === 4000, "delay");

const settings = parseHeatSettings({ public: false, kill: false });
assert(canPlayHeat(owner, settings), "owner can play");
assert(!canPlayHeat(rando, settings), "rando blocked");
assert(!canPlayHeat(rando, { ...DEFAULT_HEAT_SETTINGS, public: true, kill: true }), "kill blocks public");
assert(canPlayHeat(rando, { ...DEFAULT_HEAT_SETTINGS, public: true, kill: false }), "public play");

const parsed = parseJsonObject('```json\n{"scene":"hey","tip":"slow","score":7}\n```');
assert(parsed.scene === "hey", "json fence");

assert(vibeForLook("trans-woman") === "woman", "vibe");
assert(HEAT_SKINS.find((s) => s.id === "android")?.label === "Android skin", "android skin");
assert(lookKey("woman", "default", "any") === "woman|feminine", "look key default");
assert(lookKey("woman", "feminine", "east-asian") === "woman|feminine|east-asian", "look key appearance");
assert(HEAT_ROLES.length >= 17, "roles");
assert(HEAT_TAGLINE.includes("twice"), "tagline");
assert(HEAT_CHECK_STILL.endsWith("card.jpg"), "heat still");
assert(playgroundStill("heat-check", { "heat-check": "https://evil.example/text.png" }) === HEAT_CHECK_STILL, "ignore text plate");
assert(playgroundStill("highway-hunter", { "highway-hunter": "/hh.jpg" }) === "/hh.jpg", "other stills");
const h1 = sourceHash(["a", "b"]);
const h2 = sourceHash(["a", "b"]);
const h3 = sourceHash(["a", "c"]);
assert(h1 === h2 && h1 !== h3, "combo hash");

console.log("heat-check smoke ok");
