export type WyrHeat = "clean" | "spicy" | "nasty";
export type WyrPack =
  | "bodies"
  | "reputation"
  | "money"
  | "love"
  | "celebs"
  | "people"
  | "internet";

export type WyrLean = {
  appetite: number;
  image: number;
  stay: number;
};

export type WyrPair = {
  id: string;
  a: string;
  b: string;
  heat: WyrHeat;
  packs: WyrPack[];
  aLean: WyrLean;
  bLean: WyrLean;
};

const L = (
  appetite: number,
  image: number,
  stay: number
): WyrLean => ({ appetite, image, stay });

export const WYR_PAIRS: WyrPair[] = [
  {
    id: "wyr-001",
    a: "Sleep with someone 20 years older who actually wants you",
    b: "Sleep with someone your age who tells their group chat everything",
    heat: "nasty",
    packs: ["bodies", "people"],
    aLean: L(2, 0, 1),
    bLean: L(1, 2, 0),
  },
  {
    id: "wyr-002",
    a: "One night with someone you\u2019re ashamed you want",
    b: "Date someone hot who never initiates",
    heat: "nasty",
    packs: ["bodies", "love"],
    aLean: L(2, 0, 0),
    bLean: L(1, 2, 2),
  },
  {
    id: "wyr-003",
    a: "Attractive and bored of you in six weeks",
    b: "Not your type and they stay",
    heat: "spicy",
    packs: ["love", "bodies"],
    aLean: L(2, 2, 0),
    bLean: L(0, 0, 2),
  },
  {
    id: "wyr-004",
    a: "Great in bed, disappears for three days after",
    b: "Mid in bed, texts good morning every day",
    heat: "spicy",
    packs: ["bodies", "love"],
    aLean: L(2, 1, 0),
    bLean: L(0, 0, 2),
  },
  {
    id: "wyr-005",
    a: "Hook up with someone you work with",
    b: "Hook up with someone your sibling already dated",
    heat: "nasty",
    packs: ["bodies", "people"],
    aLean: L(2, 2, 1),
    bLean: L(1, 0, 0),
  },
  {
    id: "wyr-006",
    a: "Your worst text gets read at a wedding toast",
    b: "Your camera roll gets passed around at work",
    heat: "spicy",
    packs: ["reputation", "internet"],
    aLean: L(0, 2, 1),
    bLean: L(1, 2, 0),
  },
  {
    id: "wyr-007",
    a: "Everyone thinks you cheated and you didn\u2019t",
    b: "You did, and nobody believes the part that makes you look worse",
    heat: "spicy",
    packs: ["reputation", "love"],
    aLean: L(0, 2, 2),
    bLean: L(2, 0, 0),
  },
  {
    id: "wyr-008",
    a: "Be the joke in a group chat you\u2019re still in",
    b: "Be left out of the one that actually matters",
    heat: "clean",
    packs: ["people", "reputation"],
    aLean: L(0, 2, 2),
    bLean: L(0, 1, 0),
  },
  {
    id: "wyr-009",
    a: "Go viral for crying",
    b: "Go viral for being mean and accurate",
    heat: "spicy",
    packs: ["internet", "reputation"],
    aLean: L(0, 2, 1),
    bLean: L(1, 2, 0),
  },
  {
    id: "wyr-010",
    a: "Lose your job on a Friday",
    b: "Find out a close friend has been talking about you since March",
    heat: "clean",
    packs: ["money", "people"],
    aLean: L(0, 1, 0),
    bLean: L(0, 2, 2),
  },
  {
    id: "wyr-011",
    a: "Sit next to your ex on a six-hour flight",
    b: "Sit through dinner with their new person who is... fine",
    heat: "spicy",
    packs: ["love", "people"],
    aLean: L(1, 2, 1),
    bLean: L(0, 2, 2),
  },
  {
    id: "wyr-012",
    a: "Your car dies in a city you don\u2019t know",
    b: "Your phone dies at a family thing",
    heat: "clean",
    packs: ["people", "money"],
    aLean: L(0, 0, 0),
    bLean: L(0, 2, 2),
  },
  {
    id: "wyr-013",
    a: "Tell your boss the truth once",
    b: "Tell your partner a small lie that would actually help",
    heat: "spicy",
    packs: ["money", "love"],
    aLean: L(0, 1, 0),
    bLean: L(1, 0, 2),
  },
  {
    id: "wyr-014",
    a: "Take money from someone you slept with",
    b: "Take money from a parent and hear about it for a decade",
    heat: "nasty",
    packs: ["money", "bodies"],
    aLean: L(2, 1, 0),
    bLean: L(0, 2, 2),
  },
  {
    id: "wyr-015",
    a: "Be underpaid and respected",
    b: "Be overpaid and joked about",
    heat: "clean",
    packs: ["money", "reputation"],
    aLean: L(0, 1, 2),
    bLean: L(1, 2, 1),
  },
  {
    id: "wyr-016",
    a: "Get housed by someone you\u2019re attracted to",
    b: "Pay your own rent and go unnoticed",
    heat: "spicy",
    packs: ["money", "love"],
    aLean: L(2, 1, 2),
    bLean: L(0, 0, 1),
  },
  {
    id: "wyr-017",
    a: "One weekend with Madonna and it gets out",
    b: "A year as Sydney Sweeney\u2019s secret that she never posts",
    heat: "nasty",
    packs: ["celebs", "bodies"],
    aLean: L(2, 2, 0),
    bLean: L(2, 0, 2),
  },
  {
    id: "wyr-018",
    a: "Impregnate a famous woman in her 50s and co-parent in public",
    b: "Impregnate a 25-year-old famous woman who wants nothing to do with the kid",
    heat: "nasty",
    packs: ["celebs", "bodies"],
    aLean: L(1, 2, 2),
    bLean: L(2, 1, 0),
  },
  {
    id: "wyr-019",
    a: "Get caught in a hotel with a messy A-lister",
    b: "Never get caught with a boring B-lister who owns you socially",
    heat: "nasty",
    packs: ["celebs", "reputation"],
    aLean: L(2, 2, 0),
    bLean: L(1, 0, 2),
  },
  {
    id: "wyr-020",
    a: "Be wanted in public by someone unfashionable and rich",
    b: "Be used in private by someone everyone thinks is a catch",
    heat: "nasty",
    packs: ["celebs", "love"],
    aLean: L(1, 2, 2),
    bLean: L(2, 0, 0),
  },
  {
    id: "wyr-021",
    a: "Sleep with Jennifer Coolidge and she tells the story on a talk show \u2014 funny, specific, you",
    b: "Sleep with a current It-girl who pretends it didn\u2019t happen",
    heat: "nasty",
    packs: ["celebs", "reputation"],
    aLean: L(1, 2, 1),
    bLean: L(2, 1, 0),
  },
  {
    id: "wyr-022",
    a: "Martha Stewart wants a kid with you and means it",
    b: "A 23-year-old model wants a kid with you and will use it in a fight",
    heat: "nasty",
    packs: ["celebs", "bodies"],
    aLean: L(1, 2, 2),
    bLean: L(2, 1, 0),
  },
  {
    id: "wyr-023",
    a: "Your search history on a shared work laptop for one hour",
    b: "Your last 30 DMs read aloud to your closest friend",
    heat: "spicy",
    packs: ["internet", "reputation"],
    aLean: L(1, 2, 0),
    bLean: L(1, 1, 2),
  },
  {
    id: "wyr-024",
    a: "Be desired only when you\u2019re inconvenient",
    b: "Be desired only when you\u2019re bored",
    heat: "spicy",
    packs: ["love", "bodies"],
    aLean: L(2, 1, 0),
    bLean: L(1, 0, 1),
  },
  {
    id: "wyr-025",
    a: "One person who\u2019s seen you at 6:47 a.m. with no performance",
    b: "A hundred people who\u2019ve seen the wrong photo of you",
    heat: "spicy",
    packs: ["bodies", "internet"],
    aLean: L(1, 0, 2),
    bLean: L(0, 2, 0),
  },
  {
    id: "wyr-026",
    a: "Hook up with the you from five years ago",
    b: "Sit through dinner with the you from five years ahead",
    heat: "spicy",
    packs: ["love", "people"],
    aLean: L(2, 1, 0),
    bLean: L(0, 1, 2),
  },
  {
    id: "wyr-027",
    a: "Keep every secret and rot a little",
    b: "Leak one and sleep",
    heat: "spicy",
    packs: ["reputation", "people"],
    aLean: L(0, 2, 2),
    bLean: L(1, 0, 0),
  },
  {
    id: "wyr-028",
    a: "Always know when you\u2019re being talked about",
    b: "Never know and assume you are",
    heat: "clean",
    packs: ["people", "reputation"],
    aLean: L(0, 2, 1),
    bLean: L(0, 1, 2),
  },
  {
    id: "wyr-029",
    a: "Never finish a thought",
    b: "Finish every thought out loud",
    heat: "clean",
    packs: ["people", "internet"],
    aLean: L(0, 0, 1),
    bLean: L(1, 2, 0),
  },
  {
    id: "wyr-030",
    a: "Be unforgettable for one clip you hate",
    b: "Be misremembered as someone kinder",
    heat: "spicy",
    packs: ["internet", "reputation"],
    aLean: L(1, 2, 0),
    bLean: L(0, 1, 2),
  },
  {
    id: "wyr-031",
    a: "Date someone who\u2019s better looking than you and knows it",
    b: "Date someone who thinks they\u2019re settling and says it when they drink",
    heat: "nasty",
    packs: ["love", "bodies"],
    aLean: L(2, 2, 1),
    bLean: L(1, 0, 2),
  },
  {
    id: "wyr-032",
    a: "Your partner is loyal and dull in bed",
    b: "Your partner is electric and you catch them looking",
    heat: "nasty",
    packs: ["love", "bodies"],
    aLean: L(0, 1, 2),
    bLean: L(2, 2, 0),
  },
  {
    id: "wyr-033",
    a: "Sleep with your friend\u2019s ex and they never find out",
    b: "Don\u2019t, and they assume you did anyway",
    heat: "nasty",
    packs: ["people", "bodies"],
    aLean: L(2, 0, 1),
    bLean: L(0, 2, 2),
  },
  {
    id: "wyr-034",
    a: "Be the side person who gets the good hours",
    b: "Be the main person who gets the leftovers",
    heat: "nasty",
    packs: ["love", "bodies"],
    aLean: L(2, 1, 0),
    bLean: L(0, 2, 2),
  },
  {
    id: "wyr-035",
    a: "Someone you\u2019re not attracted to is excellent in bed",
    b: "Someone you\u2019re obsessed with is selfish in bed",
    heat: "nasty",
    packs: ["bodies", "love"],
    aLean: L(1, 0, 1),
    bLean: L(2, 1, 0),
  },
  {
    id: "wyr-036",
    a: "Have a kid with someone you can\u2019t stand talking to",
    b: "Want a kid with someone who already said no",
    heat: "nasty",
    packs: ["bodies", "love"],
    aLean: L(1, 0, 2),
    bLean: L(2, 1, 0),
  },
  {
    id: "wyr-037",
    a: "Impregnate someone your friends would clown you for",
    b: "Get ghosted by someone your friends would brag about",
    heat: "nasty",
    packs: ["bodies", "people"],
    aLean: L(1, 2, 2),
    bLean: L(2, 1, 0),
  },
  {
    id: "wyr-038",
    a: "A 48-year-old with money, taste, and a reputation",
    b: "A 24-year-old with a body and a camera",
    heat: "nasty",
    packs: ["bodies", "celebs"],
    aLean: L(1, 1, 2),
    bLean: L(2, 2, 0),
  },
  {
    id: "wyr-039",
    a: "Pamela Anderson in her prime, one night, no proof",
    b: "Current-era Pamela, public date, she posts you",
    heat: "nasty",
    packs: ["celebs", "reputation"],
    aLean: L(2, 0, 0),
    bLean: L(1, 2, 2),
  },
  {
    id: "wyr-040",
    a: "J.Lo wants dinner and means marriage talk",
    b: "A 22-year-old influencer wants sex and a collab",
    heat: "nasty",
    packs: ["celebs", "bodies"],
    aLean: L(1, 2, 2),
    bLean: L(2, 2, 0),
  },
  {
    id: "wyr-041",
    a: "Your mom finds the receipt",
    b: "Your coworker finds the photo",
    heat: "spicy",
    packs: ["people", "reputation"],
    aLean: L(1, 1, 2),
    bLean: L(1, 2, 0),
  },
  {
    id: "wyr-042",
    a: "Be broke with someone who likes you",
    b: "Be comfortable with someone who likes the life",
    heat: "spicy",
    packs: ["money", "love"],
    aLean: L(1, 0, 2),
    bLean: L(1, 2, 1),
  },
  {
    id: "wyr-043",
    a: "Apologize in person for something you meant",
    b: "Let it sit and watch them rewrite it",
    heat: "clean",
    packs: ["people", "reputation"],
    aLean: L(0, 1, 1),
    bLean: L(0, 2, 0),
  },
  {
    id: "wyr-044",
    a: "Your body tells the truth, your mouth can\u2019t",
    b: "Your mouth tells the truth, your body won\u2019t cooperate",
    heat: "nasty",
    packs: ["bodies", "love"],
    aLean: L(2, 1, 1),
    bLean: L(0, 2, 1),
  },
  {
    id: "wyr-045",
    a: "Finish every time a notification hits",
    b: "Lose interest every time they say \u201canyway\u201d",
    heat: "nasty",
    packs: ["bodies", "internet"],
    aLean: L(2, 1, 0),
    bLean: L(0, 0, 0),
  },
  {
    id: "wyr-046",
    a: "Be famous on a platform you hate",
    b: "Be ignored on the one you actually use",
    heat: "clean",
    packs: ["internet", "reputation"],
    aLean: L(1, 2, 1),
    bLean: L(0, 0, 2),
  },
  {
    id: "wyr-047",
    a: "Your partner reads your journal",
    b: "You read theirs and can\u2019t unread it",
    heat: "spicy",
    packs: ["love", "people"],
    aLean: L(0, 2, 2),
    bLean: L(1, 0, 1),
  },
  {
    id: "wyr-048",
    a: "Walk in on a friend",
    b: "A friend walks in on you",
    heat: "spicy",
    packs: ["people", "bodies"],
    aLean: L(0, 1, 1),
    bLean: L(1, 2, 0),
  },
  {
    id: "wyr-049",
    a: "Be the person people call at 2 a.m.",
    b: "Be the person people invite at 7 p.m.",
    heat: "clean",
    packs: ["people", "love"],
    aLean: L(1, 0, 2),
    bLean: L(0, 2, 1),
  },
  {
    id: "wyr-050",
    a: "A clean break that still stings",
    b: "A messy one you get to narrate",
    heat: "spicy",
    packs: ["love", "reputation"],
    aLean: L(0, 0, 0),
    bLean: L(1, 2, 1),
  },
  {
    id: "wyr-051",
    a: "Sleep with someone who votes the opposite of you and it\u2019s good",
    b: "Sleep with someone who agrees with you and it\u2019s dead",
    heat: "nasty",
    packs: ["bodies", "people"],
    aLean: L(2, 1, 0),
    bLean: L(0, 1, 2),
  },
  {
    id: "wyr-052",
    a: "Your nudes leak to strangers",
    b: "Your nudes leak to people who know your real name",
    heat: "nasty",
    packs: ["internet", "bodies"],
    aLean: L(1, 2, 0),
    bLean: L(1, 2, 2),
  },
  {
    id: "wyr-053",
    a: "Be the funny one they don\u2019t sleep with",
    b: "Be the hot one they don\u2019t introduce",
    heat: "spicy",
    packs: ["love", "reputation"],
    aLean: L(0, 1, 2),
    bLean: L(2, 2, 0),
  },
  {
    id: "wyr-054",
    a: "Stay in a city that\u2019s eating you",
    b: "Move home and be treated like you\u2019re 19",
    heat: "clean",
    packs: ["people", "money"],
    aLean: L(1, 1, 0),
    bLean: L(0, 2, 2),
  },
  {
    id: "wyr-055",
    a: "Your boss finds your dating profile",
    b: "Someone from high school finds your dating profile",
    heat: "spicy",
    packs: ["internet", "money"],
    aLean: L(1, 2, 1),
    bLean: L(1, 2, 0),
  },
  {
    id: "wyr-056",
    a: "Have chemistry with a coworker\u2019s spouse",
    b: "Have history with your new boss",
    heat: "nasty",
    packs: ["money", "bodies"],
    aLean: L(2, 1, 0),
    bLean: L(1, 2, 2),
  },
  {
    id: "wyr-057",
    a: "A one-night thing that turns into a kid",
    b: "A five-year thing that never turns into anything",
    heat: "nasty",
    packs: ["bodies", "love"],
    aLean: L(2, 1, 2),
    bLean: L(1, 0, 2),
  },
  {
    id: "wyr-058",
    a: "Be talked about as easy",
    b: "Be talked about as cold",
    heat: "spicy",
    packs: ["reputation", "bodies"],
    aLean: L(2, 2, 0),
    bLean: L(0, 2, 1),
  },
  {
    id: "wyr-059",
    a: "Your partner is hotter than you in every room",
    b: "You are, and they keep score",
    heat: "spicy",
    packs: ["love", "bodies"],
    aLean: L(1, 2, 2),
    bLean: L(1, 2, 0),
  },
  {
    id: "wyr-060",
    a: "Kiss someone you shouldn\u2019t at a funeral afterparty",
    b: "Sleep with someone you shouldn\u2019t after a promotion dinner",
    heat: "nasty",
    packs: ["people", "bodies"],
    aLean: L(2, 2, 0),
    bLean: L(2, 2, 1),
  },
  {
    id: "wyr-061",
    a: "Oprah knows a secret of yours and is kind about it",
    b: "A 21-year-old TikToker knows it and is building a series",
    heat: "nasty",
    packs: ["celebs", "internet"],
    aLean: L(0, 1, 2),
    bLean: L(1, 2, 0),
  },
  {
    id: "wyr-062",
    a: "Date someone your dad would like",
    b: "Date someone your friends would actually enjoy",
    heat: "clean",
    packs: ["love", "people"],
    aLean: L(0, 2, 2),
    bLean: L(1, 1, 1),
  },
  {
    id: "wyr-063",
    a: "Forgive someone who won\u2019t apologize",
    b: "Apologize to someone who won\u2019t forgive you",
    heat: "clean",
    packs: ["love", "people"],
    aLean: L(0, 0, 2),
    bLean: L(0, 2, 1),
  },
  {
    id: "wyr-064",
    a: "Be the rebound that works",
    b: "Be the real thing that ends",
    heat: "spicy",
    packs: ["love"],
    aLean: L(1, 1, 1),
    bLean: L(1, 0, 0),
  },
  {
    id: "wyr-065",
    a: "Someone ugly is better in bed than anyone you\u2019ve wanted",
    b: "Someone beautiful is the worst you\u2019ve had and you still go back",
    heat: "nasty",
    packs: ["bodies", "love"],
    aLean: L(2, 0, 1),
    bLean: L(2, 2, 2),
  },
  {
    id: "wyr-066",
    a: "Get someone pregnant after a wedding you weren\u2019t invited to as a couple",
    b: "Get dumped the week you were going to ask",
    heat: "nasty",
    packs: ["bodies", "love"],
    aLean: L(2, 2, 2),
    bLean: L(0, 1, 0),
  },
  {
    id: "wyr-067",
    a: "Your face on a billboard for a product you hate",
    b: "Your voice on an ad your whole city hears",
    heat: "clean",
    packs: ["reputation", "internet"],
    aLean: L(0, 2, 1),
    bLean: L(0, 2, 1),
  },
  {
    id: "wyr-068",
    a: "A slow relationship that never gets sexual",
    b: "A sexual one that never gets kind",
    heat: "nasty",
    packs: ["love", "bodies"],
    aLean: L(0, 0, 2),
    bLean: L(2, 1, 0),
  },
  {
    id: "wyr-069",
    a: "Tell a room you\u2019re in love",
    b: "Tell a room you\u2019re using someone",
    heat: "spicy",
    packs: ["reputation", "love"],
    aLean: L(1, 2, 2),
    bLean: L(2, 2, 0),
  },
  {
    id: "wyr-070",
    a: "Be needed and not wanted",
    b: "Be wanted and not needed",
    heat: "spicy",
    packs: ["love", "people"],
    aLean: L(0, 0, 2),
    bLean: L(2, 1, 0),
  },
];

export function filterPairs(opts: {
  heat?: WyrHeat | "mixed";
  pack?: WyrPack | "all";
  exclude?: string[];
}) {
  const exclude = new Set(opts.exclude || []);
  return WYR_PAIRS.filter((p) => {
    if (exclude.has(p.id)) return false;
    if (opts.heat && opts.heat !== "mixed" && p.heat !== opts.heat) return false;
    if (opts.pack && opts.pack !== "all" && !p.packs.includes(opts.pack)) return false;
    return true;
  });
}

export function pickNext(
  pool: WyrPair[],
  lastPacks: WyrPack[] = []
): WyrPair | null {
  if (pool.length === 0) return null;
  const avoid = new Set(lastPacks);
  const fresh = pool.filter((p) => !p.packs.some((x) => avoid.has(x)));
  const use = fresh.length ? fresh : pool;
  return use[Math.floor(Math.random() * use.length)];
}

export type WyrScore = {
  appetite: number;
  image: number;
  stay: number;
  title: string;
  line: string;
};

export function scorePicks(leans: WyrLean[]): WyrScore {
  const n = Math.max(leans.length, 1);
  const appetite = leans.reduce((s, l) => s + l.appetite, 0) / (n * 2);
  const image = leans.reduce((s, l) => s + l.image, 0) / (n * 2);
  const stay = leans.reduce((s, l) => s + l.stay, 0) / (n * 2);

  let title = "Hallway Case";
  if (appetite > 0.6 && image > 0.55) title = "Public Problem";
  else if (appetite > 0.6 && stay < 0.4) title = "High Taste, Low Patience";
  else if (appetite > 0.55 && stay > 0.55) title = "Convenient Coward";
  else if (image > 0.6 && stay > 0.55) title = "Image First";
  else if (image > 0.6 && appetite < 0.4) title = "Quiet Menace";
  else if (stay > 0.65) title = "Won\u2019t Leave";
  else if (appetite < 0.35 && image < 0.4) title = "Soft Alarm";
  else if (appetite > 0.5 && image < 0.4) title = "Private Appetite";

  const line =
    appetite > image && appetite > stay
      ? "You take the heat and deal with the story later."
      : image > stay
        ? "You\u2019d rather look intact than feel clean."
        : "You pick the version you can live next to, even if it\u2019s uglier.";

  return { appetite, image, stay, title, line };
}
