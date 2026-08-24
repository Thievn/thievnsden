export const OUTLOOKS = [
  { id: "cynical", label: "Cynical", guide: "Dry, cutting, still true. No cartoon villain energy." },
  { id: "honest", label: "Plain honest", guide: "No spin. Say the thing people already know and won't say." },
  { id: "dry-positive", label: "Dry positive", guide: "Hope without posters. Relief, not motivation." },
  { id: "unhinged", label: "Unhinged", guide: "Out of pocket but still a real human thought. Crude allowed." },
  { id: "naughty", label: "Naughty", guide: "Sex, want, mess. Adult and specific, not porn-blog." },
];

export const HEATS = [
  { id: "quiet", label: "Quiet" },
  { id: "sharp", label: "Sharp" },
  { id: "mean-funny", label: "Mean-funny" },
  { id: "filthy", label: "Filthy" },
];

export const FORMS = [
  { id: "essay", label: "Essay" },
  { id: "truths", label: "Things nobody says" },
  { id: "letter", label: "Letter to someone" },
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
  { id: "borrowed-goals", pack: "self", label: "Goals you stole from louder people" },
  { id: "never-impressive", pack: "self", label: "The relief of not being impressive" },
  { id: "become-the-parent", pack: "self", label: "Hearing your parent's voice in your own mouth" },
  { id: "phone-as-life", pack: "internet", label: "Living through a screen and calling it a day" },
  { id: "everyone-performing", pack: "internet", label: "Everyone performing a personality" },
  { id: "job-identity", pack: "work", label: "Your job ate the rest of you" },
  { id: "broke-and-proud", pack: "work", label: "Acting unbothered while money runs the week" },
  { id: "getting-older", pack: "age", label: "Getting older without getting wiser" },
  { id: "body-changes", pack: "age", label: "The body changing and nobody warning you how petty it feels" },
  { id: "lonely-full-room", pack: "people", label: "Lonely in a full room" },
  { id: "friend-group-rot", pack: "people", label: "A friend group that's already over" },
  { id: "family-holiday", pack: "people", label: "Family as a performance you still show up for" },
  { id: "addiction-soft", pack: "self", label: "The habit you won't name because then you'd have to stop" },
  { id: "revenge-body", pack: "self", label: "Getting hot out of spite" },
  { id: "nudes-regret", pack: "naughty", label: "Photos you sent that you still think about" },
  { id: "want-not-love", pack: "naughty", label: "Wanting someone you do not like" },
  { id: "kink-you-hide", pack: "naughty", label: "The thing you like that you'd never put in a bio" },
  { id: "after-hookup", pack: "naughty", label: "The quiet after a hookup that wasn't worth the Uber" },
  { id: "attention-diet", pack: "internet", label: "Starving for attention and calling it standards" },
  { id: "stay-too-long", pack: "self", label: "Staying in something already over" },
];

export const COVER_STYLES = [
  { id: "object", label: "Object close-up", prompt: "cinematic still life, one object that fits the essay, hard daylight or warm indoor practical light, shallow depth, film grain, no text, no watermark, no clock, no 3am, no empty midnight kitchen" },
  { id: "place", label: "Place, nobody", prompt: "cinematic empty location that fits the essay, lived-in, daylight or late afternoon, no people, no text, no 3am mood, no neon void" },
  { id: "figure", label: "Figure from behind", prompt: "one adult figure from behind or cropped, not looking at camera, ordinary clothes, daylight or indoor practical light, cinematic, no text, no lingerie catalog pose" },
  { id: "type", label: "Title on dark", prompt: "dark textured background, subtle grain, no photograph of a room, space for mood not letters — do not render readable title text, abstract color field, no 3am cliche" },
];

export function pickRandom() {
  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
  const outlook = OUTLOOKS[Math.floor(Math.random() * OUTLOOKS.length)];
  const heat = HEATS[Math.floor(Math.random() * HEATS.length)];
  const form = FORMS[Math.floor(Math.random() * FORMS.length)];
  const cover = COVER_STYLES[Math.floor(Math.random() * COVER_STYLES.length)];
  return { topic, outlook, heat, form, cover };
}
