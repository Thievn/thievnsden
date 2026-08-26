export const WYR_TOPICS = [
  "lust",
  "loyalty",
  "money",
  "fame",
  "family",
  "internet",
  "power",
  "revenge",
  "body",
  "dignity",
  "time",
  "secrets",
  "work",
  "friends",
  "status",
  "chaos",
  "control",
  "love",
  "privacy",
  "identity",
] as const;

export type WyrTopic = (typeof WYR_TOPICS)[number];

export const WYR_CONTRASTS: [WyrTopic, WyrTopic][] = [
  ["lust", "loyalty"],
  ["fame", "dignity"],
  ["money", "love"],
  ["internet", "family"],
  ["power", "privacy"],
  ["revenge", "dignity"],
  ["body", "status"],
  ["work", "lust"],
  ["friends", "status"],
  ["control", "chaos"],
  ["time", "fame"],
  ["secrets", "loyalty"],
  ["privacy", "internet"],
  ["love", "money"],
  ["identity", "fame"],
  ["family", "work"],
  ["revenge", "love"],
  ["body", "money"],
  ["chaos", "loyalty"],
  ["power", "friends"],
  ["secrets", "internet"],
  ["dignity", "lust"],
  ["time", "love"],
  ["control", "fame"],
  ["privacy", "revenge"],
];

export const TOPIC_PACK: Record<WyrTopic, string> = {
  lust: "bodies",
  loyalty: "love",
  money: "money",
  fame: "celebs",
  family: "family",
  internet: "internet",
  power: "power",
  revenge: "chaos",
  body: "bodies",
  dignity: "reputation",
  time: "work",
  secrets: "people",
  work: "work",
  friends: "people",
  status: "reputation",
  chaos: "chaos",
  control: "power",
  love: "love",
  privacy: "internet",
  identity: "people",
};

export function labelTopic(topic: string | undefined | null) {
  if (!topic) return "";
  return topic.charAt(0).toUpperCase() + topic.slice(1);
}

export function contrastLine(a?: string | null, b?: string | null) {
  const left = labelTopic(a) || "Heat";
  const right = labelTopic(b) || "Cost";
  if (left.toLowerCase() === right.toLowerCase()) return left;
  return `${left} vs ${right}`;
}

export const FLOOR_TICKER =
  "THE FLOOR IS LIVE  ·  TEN ROUNDS  ·  TWO COSTS  ·  THE ROOM SPLITS  ·  18+  ·  PICK ANYWAY  ·  ";
