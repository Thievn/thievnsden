import type { WyrHeat, WyrLean, WyrPack, WyrPair } from "@/lib/wyr-data";

const L = (appetite: number, image: number, stay: number): WyrLean => ({
  appetite,
  image,
  stay,
});

const HOT = [
  "Sydney Sweeney",
  "Margot Robbie",
  "Zendaya",
  "Ana de Armas",
  "Jenna Ortega",
  "Sydney Sweeney",
  "Megan Fox",
  "Salma Hayek",
  "Scarlett Johansson",
  "Gal Gadot",
  "Emily Ratajkowski",
  "Madison Beer",
  "Addison Rae",
  "Sydney Sweeney",
];

const MESSY = [
  "Madonna",
  "Jennifer Coolidge",
  "Martha Stewart",
  "J.Lo",
  "Pamela Anderson",
  "Oprah",
  "Kris Jenner",
  "Wendy Williams",
  "Kathy Griffin",
  "Sharon Stone",
  "Demi Moore",
  "Courtney Love",
];

const TEMPLATES: {
  a: (x: string, y: string) => string;
  b: (x: string, y: string) => string;
  heat: WyrHeat;
  packs: WyrPack[];
  aLean: WyrLean;
  bLean: WyrLean;
}[] = [
  {
    a: (x) => `Sleep with ${x} once and the hotel key photo hits the timeline`,
    b: (y) => `Date ${y} for a year and she never posts you`,
    heat: "nasty",
    packs: ["celebs", "bodies"],
    aLean: L(2, 2, 0),
    bLean: L(1, 0, 2),
  },
  {
    a: (x) => `One night with ${x} and she tells the story on a podcast, names included`,
    b: (y) => `A weekend with ${y} that nobody believes happened`,
    heat: "nasty",
    packs: ["celebs", "reputation"],
    aLean: L(2, 2, 0),
    bLean: L(2, 0, 1),
  },
  {
    a: (x) => `Impregnate ${x} and co-parent in public`,
    b: (y) => `Impregnate ${y} and she wants the kid, not you`,
    heat: "nasty",
    packs: ["celebs", "bodies"],
    aLean: L(1, 2, 2),
    bLean: L(2, 1, 0),
  },
  {
    a: (x) => `Get caught leaving ${x}'s place at 6 a.m.`,
    b: (y) => `Never get caught with ${y} and she owns every holiday`,
    heat: "nasty",
    packs: ["celebs", "reputation"],
    aLean: L(2, 2, 0),
    bLean: L(1, 0, 2),
  },
  {
    a: (x) => `${x} wants you and is loud about it`,
    b: (y) => `${y} wants you and makes you hide`,
    heat: "nasty",
    packs: ["celebs", "love"],
    aLean: L(2, 2, 1),
    bLean: L(2, 0, 2),
  },
  {
    a: (x) => `Be ${x}'s rebound that actually works`,
    b: (y) => `Be ${y}'s serious thing that ends ugly`,
    heat: "spicy",
    packs: ["celebs", "love"],
    aLean: L(2, 1, 1),
    bLean: L(1, 2, 0),
  },
  {
    a: (x) => `Fuck ${x} and she rates you in the group chat`,
    b: (y) => `Fuck ${y} and she never texts back, just a heart`,
    heat: "nasty",
    packs: ["celebs", "bodies"],
    aLean: L(2, 2, 0),
    bLean: L(2, 1, 0),
  },
  {
    a: (x) => `${x} introduces you to her friends as "a situation"`,
    b: (y) => `${y} introduces you as her person and they laugh`,
    heat: "spicy",
    packs: ["celebs", "people"],
    aLean: L(2, 1, 0),
    bLean: L(1, 2, 2),
  },
  {
    a: (x) => `A drunk voicemail from ${x} that you keep`,
    b: (y) => `A sober paragraph from ${y} that you can't answer`,
    heat: "spicy",
    packs: ["celebs", "love"],
    aLean: L(2, 0, 1),
    bLean: L(0, 1, 2),
  },
  {
    a: (x) => `Sit next to ${x} on a six-hour flight and she knows who you are`,
    b: (y) => `Sit through dinner with ${y} and she doesn't`,
    heat: "spicy",
    packs: ["celebs", "people"],
    aLean: L(2, 2, 1),
    bLean: L(1, 2, 2),
  },
];

const HAND: WyrPair[] = [
  {
    id: "wyr-h01",
    a: "Would you rather fuck someone famous and mid in bed or someone from your gym who ruins you and tells one friend",
    b: "Would you rather never hook up again and keep your reputation clean",
    heat: "nasty",
    packs: ["bodies", "reputation"],
    aLean: L(2, 1, 0),
    bLean: L(0, 2, 2),
  },
  {
    id: "wyr-h02",
    a: "Your nudes go to your boss",
    b: "Your nudes go to your sibling's group chat",
    heat: "nasty",
    packs: ["internet", "people"],
    aLean: L(1, 2, 1),
    bLean: L(1, 2, 2),
  },
  {
    id: "wyr-h03",
    a: "Hook up in a parking lot and get walked up on",
    b: "Hook up in their parents' house and hear the garage",
    heat: "nasty",
    packs: ["bodies", "people"],
    aLean: L(2, 2, 0),
    bLean: L(2, 1, 1),
  },
  {
    id: "wyr-h04",
    a: "Be great in bed and bad at being a person after",
    b: "Be kind and they only stay for the sex somewhere else",
    heat: "nasty",
    packs: ["bodies", "love"],
    aLean: L(2, 1, 0),
    bLean: L(0, 1, 2),
  },
  {
    id: "wyr-h05",
    a: "Your search history read at Thanksgiving",
    b: "Your camera roll passed at a work offsite",
    heat: "nasty",
    packs: ["internet", "reputation"],
    aLean: L(1, 2, 2),
    bLean: L(1, 2, 0),
  },
  {
    id: "wyr-h06",
    a: "Sleep with your friend's sibling and keep it",
    b: "Sleep with your friend's ex and they find out in a week",
    heat: "nasty",
    packs: ["people", "bodies"],
    aLean: L(2, 0, 2),
    bLean: L(2, 2, 0),
  },
  {
    id: "wyr-h07",
    a: "A situationship that is filthy and goes nowhere",
    b: "A relationship that is tender and dead in bed",
    heat: "nasty",
    packs: ["love", "bodies"],
    aLean: L(2, 1, 0),
    bLean: L(0, 0, 2),
  },
  {
    id: "wyr-h08",
    a: "Get someone pregnant after a wedding afterparty",
    b: "Find out they already were and you were the alibi",
    heat: "nasty",
    packs: ["bodies", "people"],
    aLean: L(2, 2, 2),
    bLean: L(1, 2, 0),
  },
  {
    id: "wyr-h09",
    a: "Be the person they cheat with",
    b: "Be the person they cheat on and everyone already knew",
    heat: "nasty",
    packs: ["love", "reputation"],
    aLean: L(2, 1, 0),
    bLean: L(0, 2, 2),
  },
  {
    id: "wyr-h10",
    a: "Your mom likes them and they're using you",
    b: "Your friends hate them and they're actually good to you",
    heat: "spicy",
    packs: ["people", "love"],
    aLean: L(1, 2, 1),
    bLean: L(1, 0, 2),
  },
];

function built(): WyrPair[] {
  const out: WyrPair[] = [...HAND];
  let n = 71;
  for (let t = 0; t < TEMPLATES.length; t++) {
    const tpl = TEMPLATES[t];
    for (let i = 0; i < HOT.length; i++) {
      for (let j = 0; j < MESSY.length; j++) {
        if ((i + j + t) % 3 !== 0) continue;
        const x = HOT[i];
        const y = MESSY[j];
        if (x === y) continue;
        const id = `wyr-${String(n).padStart(3, "0")}`;
        n += 1;
        out.push({
          id,
          a: tpl.a(x, y),
          b: tpl.b(y, x),
          heat: tpl.heat,
          packs: tpl.packs,
          aLean: tpl.aLean,
          bLean: tpl.bLean,
        });
        if (out.length >= 520) return out;
      }
    }
  }
  return out;
}

export const WYR_EXTRA: WyrPair[] = built();
