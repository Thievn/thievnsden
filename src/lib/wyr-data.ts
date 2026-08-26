export type WyrHeat = "clean" | "spicy" | "nasty";
export type WyrPack =
  | "bodies"
  | "reputation"
  | "money"
  | "love"
  | "celebs"
  | "people"
  | "internet"
  | "power"
  | "family"
  | "work"
  | "chaos";

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
  topic?: string;
  topicB?: string;
  aSting?: string;
  bSting?: string;
};

const L = (appetite: number, image: number, stay: number): WyrLean => ({
  appetite,
  image,
  stay,
});

/** Tiny offline fallback. Live play reads the Supabase pool. */
export const WYR_PAIRS: WyrPair[] = [
  {
    id: "floor-fallback-01",
    a: "Your private photos get projected behind the band at a wedding you weren't invited to",
    b: "You keep the photos secret and lose the only friend who would have sat with you",
    heat: "nasty",
    packs: ["internet", "people"],
    topic: "privacy",
    topicB: "friends",
    aLean: L(1, 2, 0),
    bLean: L(0, 0, 2),
    aSting: "You chose the lights. Enjoy the reception.",
    bSting: "Loyal and alone. Classic Floor move.",
  },
  {
    id: "floor-fallback-02",
    a: "Take $400k if your ex writes the press release in their voice",
    b: "Stay broke, but the worst night of your life never happened",
    heat: "spicy",
    packs: ["money", "love"],
    topic: "money",
    topicB: "love",
    aLean: L(1, 2, 1),
    bLean: L(0, 0, 2),
    aSting: "Paid in full. Narrated by someone who hates you.",
    bSting: "You bought peace with a smaller life. Fine.",
  },
  {
    id: "floor-fallback-03",
    a: "One filthy weekend with someone your whole family already warned you about",
    b: "Be the reliable one at every holiday and never get touched like that",
    heat: "nasty",
    packs: ["bodies", "family"],
    topic: "lust",
    topicB: "family",
    aLean: L(2, 2, 0),
    bLean: L(0, 1, 2),
    aSting: "You picked the warning label. Don't act shocked.",
    bSting: "Saint of the group chat. Cold hands.",
  },
  {
    id: "floor-fallback-04",
    a: "Go viral for the meanest true thing you've ever said",
    b: "Your boss promotes you for a lie you can't take back",
    heat: "spicy",
    packs: ["internet", "work"],
    topic: "internet",
    topicB: "work",
    aLean: L(1, 2, 0),
    bLean: L(0, 2, 2),
    aSting: "Honest and unemployable. The crowd loves it.",
    bSting: "Corner office built on a sentence you still hear.",
  },
  {
    id: "floor-fallback-05",
    a: "Everyone thinks you cheated and you didn't",
    b: "You did, and the only person who knows is kind about it",
    heat: "spicy",
    packs: ["reputation", "love"],
    topic: "dignity",
    topicB: "secrets",
    aLean: L(0, 2, 2),
    bLean: L(2, 0, 1),
    aSting: "Innocent in a room that already voted.",
    bSting: "Guilty with a witness who likes you. Worse.",
  },
  {
    id: "floor-fallback-06",
    a: "Be famous for a clip of you crying in a parking lot",
    b: "Stay unknown and watch someone prettier steal your joke",
    heat: "clean",
    packs: ["internet", "reputation"],
    topic: "fame",
    topicB: "dignity",
    aLean: L(0, 2, 1),
    bLean: L(0, 1, 2),
    aSting: "Main character tears. Congrats on the lighting.",
    bSting: "You kept your face. They kept the line.",
  },
  {
    id: "floor-fallback-07",
    a: "Sleep in the spare room of someone who still wants you, rent-free for a year",
    b: "Pay your own place and eat dinner with people who forget you exist",
    heat: "spicy",
    packs: ["money", "love"],
    topic: "money",
    topicB: "dignity",
    aLean: L(2, 1, 2),
    bLean: L(0, 0, 1),
    aSting: "Free rent. Expensive mornings.",
    bSting: "Independent and invisible. Very Floor.",
  },
  {
    id: "floor-fallback-08",
    a: "Ruin a friendship to get even, and it actually works",
    b: "Let it go and sit next to them at every birthday for a decade",
    heat: "spicy",
    packs: ["chaos", "people"],
    topic: "revenge",
    topicB: "friends",
    aLean: L(1, 2, 0),
    bLean: L(0, 1, 2),
    aSting: "You won. The chair across from you is empty.",
    bSting: "Mercy with a seating chart. Brave.",
  },
  {
    id: "floor-fallback-09",
    a: "Your search history reads itself at Sunday lunch",
    b: "You keep the history and never get asked a real question again",
    heat: "nasty",
    packs: ["internet", "family"],
    topic: "secrets",
    topicB: "family",
    aLean: L(1, 2, 0),
    bLean: L(1, 0, 2),
    aSting: "Pass the potatoes. Explain the tabs.",
    bSting: "Safe and unread. That's a kind of death.",
  },
  {
    id: "floor-fallback-10",
    a: "One night with the person you're not supposed to want, no proof, they forget you",
    b: "A public relationship with someone respectable who never looks hungry",
    heat: "nasty",
    packs: ["bodies", "love"],
    topic: "lust",
    topicB: "status",
    aLean: L(2, 0, 0),
    bLean: L(0, 2, 2),
    aSting: "You got the heat. They didn't even keep the receipt.",
    bSting: "Pretty couple. Dead voltage.",
  },
  {
    id: "floor-fallback-11",
    a: "Take the promotion that makes your closest coworker unemployed",
    b: "Stay in your lane and watch them become the person you report to",
    heat: "clean",
    packs: ["work", "people"],
    topic: "work",
    topicB: "friends",
    aLean: L(0, 2, 0),
    bLean: L(0, 1, 2),
    aSting: "Title landed. Friendship didn't.",
    bSting: "You were nice. They have your calendar now.",
  },
  {
    id: "floor-fallback-12",
    a: "Everyone at the party hears the voicemail you left at 2:14 a.m.",
    b: "You never send it and spend five years rewriting it in the shower",
    heat: "spicy",
    packs: ["love", "reputation"],
    topic: "love",
    topicB: "dignity",
    aLean: L(2, 2, 0),
    bLean: L(1, 0, 2),
    aSting: "Live from the bathroom floor. Applause.",
    bSting: "Unsent and undead. The Floor has seen this.",
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

export function pickNext(pool: WyrPair[], lastPacks: WyrPack[] = []): WyrPair | null {
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

  let title = "Cold Open";
  if (appetite > 0.62 && image > 0.58) title = "Prime Time Problem";
  else if (appetite > 0.62 && stay < 0.38) title = "Hot Mic";
  else if (appetite > 0.55 && stay > 0.55) title = "Closed Set";
  else if (image > 0.62 && stay > 0.55) title = "Image First";
  else if (image > 0.62 && appetite < 0.38) title = "Untelevised";
  else if (stay > 0.68) title = "Won't Leave";
  else if (appetite < 0.32 && image < 0.38) title = "Soft Alarm";
  else if (appetite > 0.52 && image < 0.38) title = "Private Appetite";
  else if (image > 0.55 && stay < 0.4) title = "Main Character";
  else if (stay > 0.5 && appetite < 0.4) title = "House Favorite";
  else if (appetite > 0.5 && image > 0.45) title = "Crowd Hazard";
  else if (appetite > 0.48 && stay < 0.45) title = "Lights Out";

  const line =
    appetite > image && appetite > stay
      ? "You take the heat live and argue with the edit later."
      : image > stay
        ? "You'd rather look intact than feel clean."
        : "You pick the version you can live next to, even if the room hates it.";

  return { appetite, image, stay, title, line };
}
