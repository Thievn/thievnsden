import {
  canPlayHeat,
  isFadeText,
  parseHeatTurn,
  parseJsonObject,
  splitScene,
  parseHeatSettings,
  DEFAULT_HEAT_SETTINGS,
} from "../src/lib/heat-check";
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

console.log("heat-check smoke ok");
