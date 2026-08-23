function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64);
}

const SERIES = [
  "One Piece","Naruto","Naruto Shippuden","Bleach","Dragon Ball Z","Dragon Ball Super",
  "Demon Slayer","Jujutsu Kaisen","Chainsaw Man","Attack on Titan","My Hero Academia",
  "Spy x Family","Frieren","Solo Leveling","Hunter x Hunter","Fullmetal Alchemist",
  "Death Note","Tokyo Ghoul","Mob Psycho 100","One Punch Man","Haikyuu",
  "Kuroko no Basket","Slam Dunk","Blue Lock","Yu Yu Hakusho","JoJo's Bizarre Adventure",
  "Berserk","Vinland Saga","Hell's Paradise","Jigokuraku","Black Clover",
  "Fairy Tail","Fire Force","Soul Eater","Gurren Lagann","Kill la Kill",
  "Neon Genesis Evangelion","Cowboy Bebop","Trigun","Samurai Champloo","Outlaw Star",
  "Steins;Gate","Code Geass","Psycho-Pass","Ghost in the Shell","Akira",
  "Your Name","Weathering With You","Suzume","Spirited Away","Howl's Moving Castle",
  "Princess Mononoke","Nausicaa","Castle in the Sky","Kiki's Delivery Service",
  "Violet Evergarden","Clannad","Toradora","Horimiya","Kaguya-sama",
  "Oshi no Ko","The Dangers in My Heart","Komi Can't Communicate","Nana",
  "Fruits Basket","Ouran High School Host Club","Sailor Moon","Cardcaptor Sakura",
  "Madoka Magica","Fate/stay night","Fate/Zero","Demon Lord 2099","Re:Zero",
  "Konosuba","Overlord","That Time I Got Reincarnated as a Slime","Mushoku Tensei",
  "The Rising of the Shield Hero","Sword Art Online","Log Horizon","No Game No Life",
  "Made in Abyss","Delicious in Dungeon","Shangri-La Frontier","Gachiakuta",
  "Dandadan","Kaiju No. 8","Wind Breaker","Sakamoto Days","Undead Unluck",
  "Mashle","Spy Classroom","Lycoris Recoil","Bocchi the Rock","K-On",
  "Love Live","BanG Dream","Idolmaster","Macross","Gundam",
  "Code Geass","Aldnoah.Zero","86","Attack on Titan Junior High",
  "The Apothecary Diaries","Frieren Beyond Journey's End","Mushishi","Natsume Yuujinchou",
  "March Comes in Like a Lion","Ping Pong the Animation","Keep Your Hands Off Eizouken",
  "Odd Taxi","Paranoia Agent","Mononoke","xxxHolic","FLCL",
  "Kill la Kill","Panty & Stocking","Darling in the Franxx","Gurren Lagann",
  "Kill Bill anime","Cyberpunk Edgerunners","Arcane","Castlevania",
  "The Witcher: Nightmare of the Wolf","DOTA Dragon's Blood",
  "Solo Leveling","Tower of God","The God of High School","Noblesse",
  "Lookism","Viral Hit","Omniscient Reader","The Beginning After the End",
  "Lord of the Mysteries","ORV","Wind Breaker",
  "Original",
];

const CHARACTERS: Record<string, string[]> = {
  "One Piece": ["Nami","Nico Robin","Boa Hancock","Yamato","Uta","Luffy","Zoro","Sanji","Shanks","Hancock"],
  "Naruto": ["Hinata","Sakura","Tsunade","Temari","Ino","Naruto","Sasuke","Kakashi","Itachi"],
  "Bleach": ["Rukia","Orihime","Yoruichi","Neliel","Rangiku","Ichigo","Aizen","Byakuya"],
  "Demon Slayer": ["Nezuko","Shinobu","Mitsuri","Kanao","Daki","Tanjiro","Zenitsu","Rengoku"],
  "Jujutsu Kaisen": ["Nobara","Maki","Mei Mei","Utahime","Gojo","Yuji","Megumi","Toji"],
  "Chainsaw Man": ["Makima","Power","Kobeni","Reze","Himeno","Denji","Aki"],
  "Attack on Titan": ["Mikasa","Historia","Annie","Sasha","Hange","Eren","Levi","Erwin"],
  "My Hero Academia": ["Ochaco","Momo","Tsuyu","Midnight","All Might","Deku","Bakugo","Todoroki"],
  "Spy x Family": ["Yor","Anya","Fiona","Becky","Loid"],
  "Frieren": ["Frieren","Fern","Serie","Stark"],
  "Solo Leveling": ["Cha Hae-In","Choi Jong-In","Sung Jinwoo","Igris"],
  "Hunter x Hunter": ["Killua","Gon","Kurapika","Hisoka","Biscuit","Shizuku"],
  "Death Note": ["Misa","Near","L","Light"],
  "Sailor Moon": ["Usagi","Rei","Ami","Makoto","Minako","Setsuna","Hotaru"],
  "Cyberpunk Edgerunners": ["Lucy","Rebecca","David","Maine"],
  "Oshi no Ko": ["Ai","Akane","Kana","Aqua","Ruby"],
  "Re:Zero": ["Emilia","Rem","Ram","Beatrice","Subaru"],
  "Konosuba": ["Aqua","Darkness","Megumin","Kazuma"],
  "Evangelion": ["Asuka","Rei","Misato","Shinji"],
  "Cowboy Bebop": ["Faye","Spike","Jet","Ed"],
  "Dragon Ball Z": ["Bulma","Android 18","Chi-Chi","Goku","Vegeta","Gohan"],
  "Black Clover": ["Noelle","Mimosa","Vanessa","Asta","Yuno"],
  "Fairy Tail": ["Lucy","Erza","Wendy","Natsu","Gray"],
  "Dandadan": ["Momo Ayase","Aira","Okarun"],
  "The Apothecary Diaries": ["Maomao","Gyokuyou","Jinshi"],
};

export function catalogSeed() {
  const rows: any[] = [];
  const seen = new Set<string>();
  SERIES.forEach((label, i) => {
    const s = slug(label);
    if (seen.has(`series:${s}`)) return;
    seen.add(`series:${s}`);
    rows.push({ kind: "series", slug: s, label, hint: "Anime / series", parent_slug: "", prompt: label, aliases: label, sort_order: i });
  });
  Object.entries(CHARACTERS).forEach(([series, names]) => {
    const parent = slug(series);
    names.forEach((label, i) => {
      const s = slug(`${parent}-${label}`);
      rows.push({
        kind: "character",
        slug: s,
        label,
        hint: series,
        parent_slug: parent,
        prompt: `${label} from ${series}`,
        aliases: `${label} ${series}`,
        sort_order: i,
      });
    });
  });
  return rows;
}
