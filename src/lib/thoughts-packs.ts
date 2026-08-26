export type ThoughtPick = {
  id: string;
  label: string;
  emoji?: string;
  wash?: string;
  desc?: string;
  guide?: string;
};

export const OUTLOOKS: ThoughtPick[] = [
  { id: "honest", label: "Honest", emoji: "🤍", wash: "from-stone-700/40 to-black/40", desc: "No spin.", guide: "No spin. Say the thing people already know and won't say." },
  { id: "tender", label: "Tender", emoji: "🌹", wash: "from-rose-800/40 to-black/40", desc: "Kind, still true.", guide: "Warm and specific. Kind without a greeting card. No motivational coach." },
  { id: "funny", label: "Funny", emoji: "😂", wash: "from-amber-700/40 to-rose-950/30", desc: "Actually funny.", guide: "Genuinely funny. Specific. No sitcom wink. The laugh has to come from a real life." },
  { id: "cynical", label: "Cynical", emoji: "🚬", wash: "from-neutral-600/30 to-black/40", desc: "Dry cut.", guide: "Dry, cutting, still true. No cartoon villain energy." },
  { id: "petty", label: "Petty", emoji: "💅", wash: "from-fuchsia-800/40 to-black/40", desc: "Tiny wound, big attitude.", guide: "Small grievances, maximum attitude. Still a human, not a bit." },
  { id: "deadpan", label: "Deadpan", emoji: "😐", wash: "from-slate-700/35 to-black/40", desc: "Ice. Didn't blink.", guide: "Ice. The joke is that you didn't blink. Short sentences. No exclamation." },
  { id: "dry-positive", label: "Dry hope", emoji: "🌤️", wash: "from-amber-800/30 to-stone-950/40", desc: "Relief, not a poster.", guide: "Hope without posters. Relief, not motivation." },
  { id: "unhinged", label: "Unhinged", emoji: "🕳️", wash: "from-red-800/45 to-purple-950/40", desc: "Out of pocket.", guide: "Out of pocket but still a real human thought. Crude allowed. Do not become a cartoon." },
  { id: "naughty", label: "Naughty", emoji: "💋", wash: "from-fuchsia-700/40 to-rose-950/40", desc: "Sex, want, mess.", guide: "Sex, want, mess. Adult and specific, not porn-blog." },
  { id: "filthy", label: "Filthy", emoji: "🔥", wash: "from-red-700/50 to-fuchsia-950/40", desc: "Explicit on purpose.", guide: "Explicit, sexual, messy. Name the act. Still a thought, not a script." },
  { id: "bitter-sweet", label: "Bruise", emoji: "🥀", wash: "from-purple-800/40 to-rose-950/30", desc: "Tenderness with a welt.", guide: "Tenderness with a bruise. You can love them and still want them gone." },
  { id: "horny", label: "Horny-mean", emoji: "🖤", wash: "from-rose-900/50 to-black/40", desc: "Want plus contempt.", guide: "Want and contempt in the same sentence. Adult. Specific. Not romance-novel fog." },
];

export const HEATS: ThoughtPick[] = [
  { id: "quiet", label: "Whisper", emoji: "🕯️", desc: "Soft. Still honest." },
  { id: "warm", label: "Warm", emoji: "🍯", desc: "Close. Not cute." },
  { id: "sharp", label: "Sharp", emoji: "✂️", desc: "A real cut." },
  { id: "mean-funny", label: "Mean-funny", emoji: "🦂", desc: "Laugh, then flinch." },
  { id: "filthy", label: "Filthy", emoji: "🌶️", desc: "Goes there." },
  { id: "nuclear", label: "Nuclear", emoji: "☢️", desc: "Unhinged on purpose." },
];

export const FORMS: ThoughtPick[] = [
  { id: "essay", label: "Essay", emoji: "✎", desc: "A few true paragraphs." },
  { id: "truths", label: "Nobody says", emoji: "📋", desc: "Short lines people won't admit." },
  { id: "letter", label: "Letter", emoji: "✉️", desc: "To someone, named or not." },
  { id: "rant", label: "Rant", emoji: "🗯️", desc: "One breath, no brakes." },
  { id: "confession", label: "Confession", emoji: "🙏", desc: "You did it. Say it." },
  { id: "scene", label: "Scene", emoji: "🎬", desc: "One moment, present tense." },
  { id: "punchline", label: "Punchline", emoji: "🎯", desc: "Build, then land it." },
];

export const LENGTHS: ThoughtPick[] = [
  { id: "snack", label: "Snack", desc: "2–3 short hits", guide: "About 220 words. Tight." },
  { id: "medium", label: "Medium", desc: "A real piece", guide: "About 450 words. Room to turn." },
  { id: "long", label: "Long", desc: "Let it run", guide: "About 800 words. Still short paragraphs." },
];

export const ADDRESSEES: ThoughtPick[] = [
  { id: "nobody", label: "The room", emoji: "🕳️", desc: "Nobody in particular." },
  { id: "self", label: "Yourself", emoji: "🪞", desc: "Talk to you." },
  { id: "them", label: "Them", emoji: "👤", desc: "The person in it." },
  { id: "ex", label: "An ex", emoji: "📵", desc: "They're gone. Mostly." },
  { id: "friend", label: "A friend", emoji: "🍻", desc: "Someone who knows." },
];

export const CATEGORIES = [
  { id: "all", label: "All", chip: "from-rose-500/30 to-purple-500/20 border-rose-400/40 text-rose-100" },
  { id: "relationships", label: "Relationships", chip: "from-rose-600/40 to-pink-500/20 border-rose-400/50 text-rose-100" },
  { id: "naughty", label: "Naughty", chip: "from-fuchsia-600/40 to-rose-500/20 border-fuchsia-400/50 text-fuchsia-100" },
  { id: "funny", label: "Funny", chip: "from-amber-500/35 to-rose-500/20 border-amber-400/45 text-amber-100" },
  { id: "self", label: "Self", chip: "from-purple-600/40 to-violet-500/20 border-purple-400/50 text-purple-100" },
  { id: "people", label: "People", chip: "from-red-600/35 to-rose-500/20 border-red-400/45 text-red-100" },
  { id: "work", label: "Work", chip: "from-amber-600/35 to-orange-500/20 border-amber-400/45 text-amber-100" },
  { id: "internet", label: "Internet", chip: "from-violet-600/35 to-fuchsia-500/20 border-violet-400/45 text-violet-100" },
  { id: "age", label: "Getting older", chip: "from-stone-500/30 to-rose-900/20 border-stone-400/40 text-stone-100" },
];

export const TOPICS = [
  { id: "cheating-almost", pack: "relationships", label: "Almost cheating and pretending it was nothing" },
  { id: "dead-bedroom", pack: "relationships", label: "Wanting them and resenting them in the same week" },
  { id: "text-drafts", pack: "relationships", label: "The texts you write and never send" },
  { id: "ex-still-in-phone", pack: "relationships", label: "Keeping an ex in your phone for no good reason" },
  { id: "perform-in-bed", pack: "relationships", label: "Performing in bed so they don't get bored" },
  { id: "love-vs-habit", pack: "relationships", label: "Calling it love because leaving would be work" },
  { id: "jealous-of-their-past", pack: "relationships", label: "Getting jealous of people they slept with before you" },
  { id: "used-for-body", pack: "relationships", label: "Knowing you're the body, not the person" },
  { id: "good-on-paper", pack: "relationships", label: "They're good on paper and you still want out" },
  { id: "make-up-sex", pack: "relationships", label: "Using sex to skip the actual fight" },
  { id: "double-life-soft", pack: "relationships", label: "The private search history vs the person they think you are" },
  { id: "friends-with-tension", pack: "relationships", label: "A friendship that's just delayed sex" },
  { id: "age-gap-look", pack: "relationships", label: "Wanting someone you shouldn't want and knowing why" },
  { id: "marriage-roommate", pack: "relationships", label: "Married roommates who still share a last name" },
  { id: "first-wrong", pack: "relationships", label: "Staying because they were your first and you don't know another version of you" },
  { id: "nice-anyway", pack: "relationships", label: "Being kind when you have every reason not to" },
  { id: "sunday-tenderness", pack: "relationships", label: "The quiet good morning that almost makes up for the week" },
  { id: "borrowed-goals", pack: "self", label: "Goals you stole from louder people" },
  { id: "never-impressive", pack: "self", label: "The relief of not being impressive" },
  { id: "become-the-parent", pack: "self", label: "Hearing your parent's voice in your own mouth" },
  { id: "addiction-soft", pack: "self", label: "The habit you won't name because then you'd have to stop" },
  { id: "revenge-body", pack: "self", label: "Getting hot out of spite" },
  { id: "stay-too-long", pack: "self", label: "Staying in something already over" },
  { id: "im-fine-lie", pack: "self", label: "The lie inside I'm fine" },
  { id: "laughing-at-you", pack: "funny", label: "Laughing at your own life so nobody else gets there first" },
  { id: "group-chat", pack: "funny", label: "The group chat that knows too much" },
  { id: "gym-personality", pack: "funny", label: "The gym as a personality you rented" },
  { id: "too-online", pack: "funny", label: "Being too online about a feeling that needed a walk" },
  { id: "joke-covers-wound", pack: "funny", label: "The joke that is doing too much work" },
  { id: "phone-as-life", pack: "internet", label: "Living through a screen and calling it a day" },
  { id: "everyone-performing", pack: "internet", label: "Everyone performing a personality" },
  { id: "attention-diet", pack: "internet", label: "Starving for attention and calling it standards" },
  { id: "job-identity", pack: "work", label: "Your job ate the rest of you" },
  { id: "broke-and-proud", pack: "work", label: "Acting unbothered while money runs the week" },
  { id: "money-weird", pack: "work", label: "Money making you weird around people you like" },
  { id: "getting-older", pack: "age", label: "Getting older without getting wiser" },
  { id: "body-changes", pack: "age", label: "The body changing and nobody warning you how petty it feels" },
  { id: "lonely-full-room", pack: "people", label: "Lonely in a full room" },
  { id: "friend-group-rot", pack: "people", label: "A friend group that's already over" },
  { id: "family-holiday", pack: "people", label: "Family as a performance you still show up for" },
  { id: "friend-you-want", pack: "people", label: "The friend you want and will never say" },
  { id: "nudes-regret", pack: "naughty", label: "Photos you sent that you still think about" },
  { id: "want-not-love", pack: "naughty", label: "Wanting someone you do not like" },
  { id: "kink-you-hide", pack: "naughty", label: "The thing you like that you'd never put in a bio" },
  { id: "after-hookup", pack: "naughty", label: "The quiet after a hookup that wasn't worth the Uber" },
  { id: "horny-annoyed", pack: "naughty", label: "Horny and annoyed at the same person" },
  { id: "aftercare-missing", pack: "naughty", label: "Aftercare you didn't get and still expected" },
  { id: "bad-idea-crush", pack: "naughty", label: "A crush that is a bad idea and you already know" },
];

export const CLASSICS = [
  { slug: "borrowed-goals", pack: "self", title: "Most of your goals were never really yours", excerpt: "Half the things you chase were absorbed from people who seemed more sure of themselves.", date: "Aug 2026", readTime: "3 min" },
  { slug: "never-impressive", pack: "self", title: "The quiet relief of accepting you’ll never be impressive", excerpt: "Peace shows up when you stop trying to be the most interesting person in the room.", date: "Aug 2026", readTime: "3 min" },
  { slug: "stop-explaining", pack: "people", title: "The day you stop explaining yourself", excerpt: "Some people were never going to understand you.", date: "Aug 2026", readTime: "4 min" },
  { slug: "lonely-in-a-crowd", pack: "people", title: "The loneliness that only hits when you’re surrounded", excerpt: "It’s not the empty room. It’s the full one where no one is looking at you.", date: "Aug 2026", readTime: "3 min" },
  { slug: "staying-too-long", pack: "relationships", title: "Why people stay in things that are already over", excerpt: "The hardest part is admitting how long you’ve already known.", date: "Aug 2026", readTime: "4 min" },
  { slug: "becoming-what-you-hated", pack: "self", title: "How easy it is to become what you used to hate", excerpt: "You wake up and recognize the tone in your own voice.", date: "Aug 2026", readTime: "3 min" },
];

export const COVER_STYLES = [
  { id: "object", label: "Object close-up", prompt: "cinematic still life, one object that fits the essay, hard daylight or warm indoor practical light, shallow depth, film grain, no text, no watermark, no clock, no 3am, no empty midnight kitchen" },
  { id: "place", label: "Place, nobody", prompt: "cinematic empty location that fits the essay, lived-in, daylight or late afternoon, no people, no text, no 3am mood, no neon void" },
  { id: "figure", label: "Figure from behind", prompt: "one adult figure from behind or cropped, not looking at camera, ordinary clothes, daylight or indoor practical light, cinematic, no text, no lingerie catalog pose" },
  { id: "type", label: "Title on dark", prompt: "dark textured background, subtle grain, no photograph of a room, space for mood not letters — do not render readable title text, abstract color field, no 3am cliche" },
];

export function packOfTopic(id: string) {
  return TOPICS.find((t) => t.id === id)?.pack || "self";
}

export function inferPack(topic?: string | null, slug?: string | null) {
  if (slug) {
    const c = CLASSICS.find((x) => x.slug === slug);
    if (c) return c.pack;
  }
  const raw = String(topic || "").toLowerCase();
  if (CATEGORIES.some((c) => c.id === raw && c.id !== "all")) return raw;
  const hit = TOPICS.find((t) => t.id === raw || t.label.toLowerCase() === raw || raw.includes(t.pack));
  if (hit) return hit.pack;
  if (raw.includes("sex") || raw.includes("nude") || raw.includes("hookup") || raw.includes("mouth") || raw.includes("bed")) return "naughty";
  if (raw.includes("text") || raw.includes("love") || raw.includes("ex") || raw.includes("relationship")) return "relationships";
  if (raw.includes("laugh") || raw.includes("joke") || raw.includes("funny")) return "funny";
  return "self";
}

export function pickRandom() {
  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
  const outlook = OUTLOOKS[Math.floor(Math.random() * OUTLOOKS.length)];
  const heat = HEATS[Math.floor(Math.random() * HEATS.length)];
  const form = FORMS[Math.floor(Math.random() * FORMS.length)];
  const cover = COVER_STYLES[Math.floor(Math.random() * COVER_STYLES.length)];
  const length = LENGTHS[Math.floor(Math.random() * LENGTHS.length)];
  const addressee = ADDRESSEES[Math.floor(Math.random() * ADDRESSEES.length)];
  return { topic, outlook, heat, form, cover, length, addressee };
}
