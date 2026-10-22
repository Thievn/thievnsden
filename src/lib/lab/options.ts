// @ts-nocheck
// Adults only. No minor / youthful options anywhere.
export const ENGINES={
  zimage:{label:"Z-Image Turbo",cost:"~$0.002–0.005",note:"fast photoreal / stylized"},
  illustrious:{label:"Illustrious-XL",cost:"~$0.005–0.01",note:"anime / 2D"},
  chroma:{label:"Chroma1-HD",cost:"~$0.01–0.02",note:"slower, highest quality"},
};
export const STYLES=[
  {id:"photoreal",label:"Photoreal",emoji:"📸",engine:"zimage",prefix:"Ultra-realistic photograph, natural skin texture, 85mm lens, sharp focus."},
  {id:"cinematic",label:"Cinematic",emoji:"🎬",engine:"zimage",prefix:"Cinematic film still, anamorphic lens, dramatic color grading, shallow depth of field, film grain."},
  {id:"boudoir",label:"Boudoir Photo",emoji:"🕯️",engine:"zimage",prefix:"Intimate boudoir photography, soft window light, warm tones, tasteful sensual mood."},
  {id:"semireal",label:"Semi-Real",emoji:"✨",engine:"zimage",prefix:"Semi-realistic digital painting, stylized 3D render with soft painterly shading."},
  {id:"pixar",label:"Pixar Hybrid",emoji:"🧸",engine:"zimage",prefix:"Stylized 3D animated feature film look, appealing exaggerated proportions for an adult character, subsurface skin, soft global illumination."},
  {id:"render3d",label:"3D Render",emoji:"🧊",engine:"zimage",prefix:"High-end 3D character render, octane, physically based materials, studio lighting."},
  {id:"anime",label:"Anime",emoji:"🌸",engine:"illustrious",prefix:"anime style, cel shading, vibrant colors"},
  {id:"manga",label:"Manga",emoji:"📖",engine:"illustrious",prefix:"monochrome manga, screentone, ink lineart, greyscale"},
  {id:"hentaiish",label:"Ecchi Anime",emoji:"💋",engine:"illustrious",prefix:"ecchi anime style, glossy skin, seductive, detailed shading"},
  {id:"comic",label:"Western Comic",emoji:"💥",engine:"zimage",prefix:"Western comic book art, bold ink outlines, halftone shading, dynamic colors."},
  {id:"oil",label:"Oil Painting",emoji:"🖼️",engine:"zimage",prefix:"Classical oil painting on canvas, visible brushstrokes, chiaroscuro, Renaissance-inspired."},
  {id:"watercolor",label:"Watercolor",emoji:"💧",engine:"zimage",prefix:"Delicate watercolor illustration, soft bleeding pigments, paper texture."},
  {id:"cyberpunk",label:"Cyberpunk",emoji:"🌃",engine:"zimage",prefix:"Cyberpunk aesthetic, neon magenta and cyan lighting, rain-slick city, holographic details."},
  {id:"darkfantasy",label:"Dark Fantasy",emoji:"🦇",engine:"zimage",prefix:"Dark fantasy art, gothic atmosphere, moody candlelight, ornate details, painterly."},
  {id:"pinup",label:"Pin-Up",emoji:"💄",engine:"zimage",prefix:"Vintage 1950s pin-up illustration, glossy airbrushed style, retro palette."},
  {id:"noir",label:"Noir",emoji:"🕶️",engine:"zimage",prefix:"Black and white film noir photograph, hard venetian-blind shadows, smoky high contrast."},
  {id:"vaporwave",label:"Vaporwave",emoji:"🌴",engine:"zimage",prefix:"Vaporwave aesthetic, pastel pink and teal gradients, retro 80s glow, chrome accents."},
  {id:"sketch",label:"Sketch",emoji:"✏️",engine:"zimage",prefix:"Pencil sketch on textured paper, expressive graphite linework, cross-hatching."},
  {id:"goth",label:"Goth Editorial",emoji:"🖤",engine:"zimage",prefix:"Dark goth fashion editorial photograph, rose and plum tones, dramatic rim light."},
  {id:"chroma",label:"Chroma HQ Photo",emoji:"💎",engine:"chroma",prefix:"Highly detailed professional photograph, realistic skin, beautiful lighting."},
  {id:"chromaart",label:"Chroma HQ Art",emoji:"🔮",engine:"chroma",prefix:"Masterful detailed digital artwork, rich color, intricate rendering."},
];
export const F={ // field -> options
  gender:["Woman","Man","Androgynous","Trans woman","Trans man","Non-binary femme","Non-binary masc"],
  age:["18–19 (adult)","Early 20s","Mid 20s","Late 20s","30s","40s","50s+"],
  ethnicity:["Any","East Asian","South Asian","Southeast Asian","Black","Latina/Latino","Middle Eastern","White / European","Mixed","Pacific Islander","Indigenous"],
  skin:["Porcelain","Fair","Olive","Golden tan","Bronze","Brown","Deep ebony","Freckled fair"],
  body:["Petite (adult)","Slim","Athletic","Toned","Curvy","Hourglass","Thick","Voluptuous","Muscular","Plus-size","Dad bod"],
  height:["Short","Average","Tall","Statuesque"],
  hairColor:["Black","Brunette","Chestnut","Blonde","Platinum","Ginger","Copper red","Silver","Pastel pink","Lilac","Electric blue","Emerald","Two-tone"],
  hairStyle:["Straight","Wavy","Curly","Coily","Braids","Ponytail","Space buns","Messy bun","Bob","Pixie","Undercut","Shaved","Bangs","Wolf cut"],
  hairLength:["Buzzed","Short","Shoulder","Long","Very long"],
  eyes:["Brown","Hazel","Green","Blue","Grey","Amber","Violet","Heterochromia","Red (fantasy)"],
  freckles:["None","Light","Heavy"],
  makeup:["Natural","Glam","Smoky eye","Goth (dark lips)","Winged liner","Glossy lips","Red lipstick","E-girl blush","None"],
  piercings:["Ear studs","Septum","Nose stud","Lip ring","Eyebrow","Tongue","Belly","Industrial"],
  tattoos:["None","Small minimal","Sleeve","Back piece","Thigh","Chest","Neck","Full body"],
  marks:["Beauty mark","Scar","Dimples","Vitiligo","Glasses","Elf ears","Horns","Fangs","Cat ears","Glowing runes"],
  vibe:["Sweet","Bratty","Dominant","Submissive","Shy","Confident","Playful","Mysterious","Seductive","Goofy","Cold","Nurturing","Wild","Elegant","Nerdy","Tomboy"],
  outfit:["Lingerie set","Silk robe","Oversized hoodie","Crop top + jeans","Little black dress","Corset + skirt","Latex catsuit","Office wear","Gym wear","Bikini","Kimono","Leather jacket","Gothic lace dress","Cosplay armor","Towel","Suit & tie","Shirtless + jeans"],
  pose:["Standing","Sitting","Lying on bed","Mirror selfie","Over the shoulder","Leaning on wall","Kneeling","Stretching","Walking toward camera","Arms crossed","Hand in hair","Lounging on couch"],
  setting:["Bedroom","Neon city street","Rooftop at night","Beach sunset","Luxury hotel","Gothic cathedral","Studio backdrop","Forest","Night club","Bathroom mirror","Kitchen","Cyber lab","Throne room","Pool"],
  expression:["Smile","Smirk","Seductive gaze","Pout","Laughing","Shy blush","Serious","Biting lip","Wink","Bored"],
  camera:["Close-up portrait","Half body","Full body","Low angle","High angle","POV","Selfie angle","Dutch angle","From behind"],
  lighting:["Soft daylight","Golden hour","Neon glow","Candlelight","Moody low-key","Studio softbox","Rim light","Moonlight","Sunset backlight"],
  aspect:["Portrait 832×1216","Square 1024×1024","Landscape 1216×832"],
};
export const MULTI=new Set(["piercings","marks","vibe"]);
export const DEFAULTS={gender:"Woman",age:"Mid 20s",ethnicity:"Any",body:"Curvy",hairColor:"Copper red",hairStyle:"Wavy",hairLength:"Long",eyes:"Green",freckles:"Light",makeup:"Winged liner",piercings:["Septum"],tattoos:"None",marks:[],vibe:["Playful","Seductive"],outfit:"Gothic lace dress",pose:"Standing",setting:"Bedroom",expression:"Smirk",camera:"Half body",lighting:"Candlelight",aspect:"Portrait 832×1216",style:"photoreal",custom:""};
export function dims(a){return a?.startsWith("Square")?[1024,1024]:a?.startsWith("Landscape")?[1216,832]:[832,1216];}
// Real minor-safety check: explicit minor terms (word-boundary) + numeric ages under 18. Returns reason string or null.
const MINOR_TERMS=/\b(child|children|kid|kids|minor|minors|underage|under-age|underaged|preteen|pre-teen|tween|teen|teens|teenage|teenager|loli|lolita|lolicon|shota|shotacon|toddler|infant|elementary school|middle school|junior high|grade schooler|jailbait)\b/gi;
const AGE_RE=/\b(\d{1,2})\s*(?:-|\s)?\s*(?:yo|y\/o|yrs?(?:\s*old)?|years?(?:\s*|-)old|year-old|years? of age)\b/gi;
const NEG_CTX=/\b(no|not|never|without|non|avoid|zero)\b[\w\s,'-]{0,20}$/i;
export function minorReason(text){
  const t=String(text||"");
  for(const m of t.matchAll(MINOR_TERMS)){const before=t.slice(Math.max(0,m.index-30),m.index);if(NEG_CTX.test(before))continue;return `contains "${m[0]}"`;}
  for(const m of t.matchAll(AGE_RE)){if(+m[1]<18)return `age under 18 ("${m[0]}")`;}
  return null;
}
export const BLOCK={test:t=>!!minorReason(t)};

const g=(s,x)=>s?.[x]&&s[x]!=="None"&&s[x]!=="Any"?s[x]:"";
export function buildPrompt(s){
  const st=STYLES.find(x=>x.id===s.style)||STYLES[0];
  const ageTxt=s.age?.startsWith("18")?"young adult (21+)":s.age;
  if(st.engine==="illustrious"){
    const tag=s.gender==="Man"||s.gender==="Trans man"||s.gender==="Non-binary masc"?"1boy, solo, adult man, 21+":"1girl, solo, adult woman, 21+, mature";
    return [st.prefix,tag,ageTxt&&`${ageTxt.toLowerCase()}`,g(s,"body")&&s.body.toLowerCase()+" body",g(s,"skin")&&s.skin.toLowerCase()+" skin",
      g(s,"hairLength")&&s.hairLength.toLowerCase()+" hair",g(s,"hairStyle")&&s.hairStyle.toLowerCase()+" hair",g(s,"hairColor")&&s.hairColor.toLowerCase()+" hair",
      g(s,"eyes")&&s.eyes.toLowerCase()+" eyes",g(s,"freckles")&&"freckles",g(s,"makeup")&&s.makeup.toLowerCase(),...(s.piercings||[]).map(p=>p.toLowerCase()+" piercing"),
      g(s,"tattoos")&&s.tattoos.toLowerCase()+" tattoo",...(s.marks||[]).map(m=>m.toLowerCase()),g(s,"outfit")&&s.outfit.toLowerCase(),g(s,"expression")&&s.expression.toLowerCase(),
      g(s,"pose")&&s.pose.toLowerCase(),g(s,"camera")&&s.camera.toLowerCase(),g(s,"setting")&&s.setting.toLowerCase()+" background",g(s,"lighting")&&s.lighting.toLowerCase(),s.custom].filter(Boolean).join(", ");
  }
  const who=[ageTxt,g(s,"ethnicity"),s.gender?.toLowerCase()].filter(Boolean).join(" ")+" (adult, 21+)";
  const parts=[st.prefix,
    `A ${who}${g(s,"height")?`, ${s.height.toLowerCase()} height`:""}, ${(s.body||"").toLowerCase()} build${g(s,"skin")?`, ${s.skin.toLowerCase()} skin`:""}.`,
    `${s.hairLength||""} ${s.hairStyle||""} ${s.hairColor||""} hair, ${s.eyes||""} eyes${g(s,"freckles")?`, ${s.freckles.toLowerCase()} freckles`:""}${g(s,"makeup")?`, ${s.makeup.toLowerCase()} makeup`:""}.`.replace(/\s+/g," "),
    (s.piercings?.length?`Piercings: ${s.piercings.join(", ").toLowerCase()}.`:""),
    g(s,"tattoos")?`Tattoos: ${s.tattoos.toLowerCase()}.`:"",
    s.marks?.length?`Distinctive: ${s.marks.join(", ").toLowerCase()}.`:"",
    s.vibe?.length?`Personality radiates ${s.vibe.join(", ").toLowerCase()} energy.`:"",
    g(s,"outfit")?`Wearing ${s.outfit.toLowerCase()}.`:"",
    [g(s,"pose"),g(s,"expression")&&s.expression.toLowerCase()+" expression"].filter(Boolean).join(", ")+".",
    g(s,"setting")?`Setting: ${s.setting.toLowerCase()}.`:"",
    [g(s,"camera"),g(s,"lighting")&&s.lighting.toLowerCase()+" lighting"].filter(Boolean).join(", ")+".",
    s.custom];
  return parts.filter(x=>x&&x!==".").join(" ");
}
// Appearance-only descriptor for saved characters
export function describe(s,name){
  const ageTxt=s.age?.startsWith("18")?"21-year-old":s.age?.toLowerCase();
  const bits=[`${name||"She"}, a ${ageTxt||"adult"} ${g(s,"ethnicity")?s.ethnicity+" ":""}${(s.gender||"woman").toLowerCase()}`,
    s.body&&`${s.body.toLowerCase()} build`,g(s,"height")&&`${s.height.toLowerCase()} height`,g(s,"skin")&&`${s.skin.toLowerCase()} skin`,
    `${[s.hairLength,s.hairStyle,s.hairColor].filter(Boolean).join(" ").toLowerCase()} hair`,s.eyes&&`${s.eyes.toLowerCase()} eyes`,
    g(s,"freckles")&&`${s.freckles.toLowerCase()} freckles`,g(s,"makeup")&&`${s.makeup.toLowerCase()} makeup`,
    s.piercings?.length&&`${s.piercings.join(", ").toLowerCase()} piercing${s.piercings.length>1?"s":""}`,g(s,"tattoos")&&`${s.tattoos.toLowerCase()} tattoos`,
    s.marks?.length&&s.marks.join(", ").toLowerCase()];
  return bits.filter(Boolean).join(", ");
}
export function charPrompt(c,{action,outfit,pose,setting,expression,camera,lighting},styleId){
  const st=STYLES.find(x=>x.id===(styleId||c.style))||STYLES[0];
  const extra=[outfit&&`wearing ${outfit.toLowerCase()}`,pose&&pose.toLowerCase(),expression&&`${expression.toLowerCase()} expression`,setting&&`in a ${setting.toLowerCase()}`,camera&&camera.toLowerCase(),lighting&&`${lighting.toLowerCase()} lighting`].filter(Boolean).join(", ");
  if(st.engine==="illustrious")return [st.prefix,"1girl, solo, adult woman, 21+, mature",c.descriptor,action,extra].filter(Boolean).join(", ");
  return [st.prefix,c.descriptor+(/21\+/.test(c.descriptor)?".":" (adult woman, 21+)."),action&&(action.trim().replace(/\.?$/,".")),extra&&(extra.charAt(0).toUpperCase()+extra.slice(1)+".")].filter(Boolean).join(" ");
}
