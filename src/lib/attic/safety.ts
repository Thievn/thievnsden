/** Server-only age gate. Adult and explicit text is allowed. Ages under 21 are not. */

const AGE_PATTERNS: RegExp[] = [
  /\b(underage|under[\s-]?age|minor|minors|child|children|childlike|kid|kids|toddler|infant|newborn|preteen|pre-teen|lolita|loli|shota|shotacon|jailbait|pedo|paedo|prepubescent)\b/i,
  /\b(teen|teens|teenage|teenager|schoolgirl|schoolboy|high[\s-]?school|middle[\s-]?school|elementary[\s-]?school|grade[\s-]?school)\b/i,
  /\b(little|small|young)\s+(girl|boy|child|kid)s?\b/i,
  /\bbaby[\s-]?face\b/i,
  /\b(1[0-9]|20|[0-9])\s*(yo|y\.?\s*o\.?|years?\s*old)\b/i,
  /\b(1[0-9]|20|[0-9])\s*[- ]?\s*year[- ]old\b/i,
  /\b(ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\s*(years?\s*old|yo|year[- ]old)\b/i,
  /\bunder\s*21\b/i,
];

export const AGE_BLOCK = "Adults only.";

/** Appended on the server. Never shown in the editor and never returned to the browser. */
export const HIDDEN_AGE_NEGATIVE =
  "child, children, kid, toddler, infant, minor, underage, teen, teenager, preteen, loli, shota, childlike, baby face, young child, schoolgirl, schoolboy";

export function minorReason(text: string | null | undefined): string | null {
  const value = (text ?? "").trim();
  if (!value) return null;
  const folded = value
    .toLowerCase()
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/@/g, "a")
    .replace(/\$/g, "s");
  for (const sample of [value, folded]) {
    for (const pattern of AGE_PATTERNS) {
      if (pattern.test(sample)) return AGE_BLOCK;
    }
  }
  return null;
}

export function composeNegative(userNegative: string): string {
  const extra = userNegative.replace(/\s+/g, " ").trim().slice(0, 800);
  return extra ? `${extra}, ${HIDDEN_AGE_NEGATIVE}` : HIDDEN_AGE_NEGATIVE;
}

export function composePositive(
  userPrompt: string,
  styleText: string,
  fictional: boolean,
): string {
  const adult = "The subject is a consenting adult, 21 or older, with a mature face.";
  const who = fictional
    ? "Fictional character, not a real celebrity or private individual."
    : "Keep the face from the source photo.";
  return [styleText.trim(), userPrompt.replace(/\s+/g, " ").trim(), adult, who].filter(Boolean).join(" ");
}

export type FaceReport = {
  realFace: boolean;
  faceCount: number;
  minor: boolean;
  samePerson: boolean | null;
};

export function decideFace(
  report: FaceReport | null,
  mode: "enroll" | "upload",
  hasLock: boolean,
): { ok: true } | { ok: false; error: string } {
  if (!report) return { ok: false, error: "Face check is unavailable. Nothing was saved." };
  if (report.minor) return { ok: false, error: AGE_BLOCK };
  if (mode === "enroll") {
    if (!report.realFace || report.faceCount !== 1) {
      return { ok: false, error: "Use a clear photo of your face. One person." };
    }
    return { ok: true };
  }
  if (report.realFace && report.faceCount > 1) {
    return { ok: false, error: "One real face only." };
  }
  if (!report.realFace || report.faceCount === 0) return { ok: true };
  if (!hasLock) return { ok: false, error: "Set your face lock first. A real photo has to be you." };
  if (report.samePerson !== true) return { ok: false, error: "That face doesn't match your lock." };
  return { ok: true };
}
