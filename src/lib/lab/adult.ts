// @ts-nocheck
import {minorReason} from "./options";
// Ensure every prompt explicitly states adult 21+.
export function ensureAdult(p,engine){const t=String(p||"").trim();if(/21\+/.test(t))return t;
  return engine==="illustrious"?`adult, 21+, mature, ${t}`:`${t} Subject is an adult woman, 21+.`.replace(/woman(, 21\+\.)$/,(m,a)=>/\b(man|male|boy|guy|masc)\b/i.test(t)&&!/\bwoman\b/i.test(t)?"man"+a:m);}
export {minorReason};
