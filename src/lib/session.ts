import { createHash, createHmac, timingSafeEqual } from "crypto";

if (typeof window !== "undefined") {
  throw new Error("Den session helpers cannot run in the browser.");
}

export const SESSION_COOKIE = "den_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

type Payload = { v: 1; sub: "owner"; exp: number };

/** Runtime read. A dynamic key is not inlined at build time. */
function readEnv(name: string): string {
  const raw = process.env[name];
  if (typeof raw !== "string") return "";
  let value = raw.replace(/^\uFEFF/, "").trim();
  if (value.length >= 2) {
    const quote = value[0];
    if ((quote === '"' || quote === "'") && value.endsWith(quote)) {
      value = value.slice(1, -1).trim();
    }
  }
  return value;
}

function sessionSecret(): string | null {
  const secret = process.env.SESSION_SECRET?.trim() ?? "";
  if (secret.length < 32) return null;
  return secret;
}

export function authConfigured(): boolean {
  const email = readEnv("DEN_OWNER_EMAIL");
  const password = readEnv("DEN_OWNER_PASSWORD");
  return email.length > 3 && email.includes("@") && password.length >= 10 && sessionSecret() !== null;
}

/** Display name for the signed-in owner. Original casing. Null when unset or unusable. */
export function ownerUsername(): string | null {
  const name = readEnv("DEN_OWNER_USERNAME");
  if (name.length < 2 || name.length > 40) return null;
  if (/[\s@]/.test(name)) return null;
  return name;
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

export function credentialsMatch(identifier: string, password: string): boolean {
  if (!authConfigured()) return false;
  const given = digest(identifier.trim().toLowerCase());
  const expectedEmail = readEnv("DEN_OWNER_EMAIL").toLowerCase();
  const emailOk = timingSafeEqual(given, digest(expectedEmail));
  const username = ownerUsername();
  const usernameOk = username ? timingSafeEqual(given, digest(username.toLowerCase())) : false;
  const typed = password.replace(/^\uFEFF/, "").trim();
  const passwordOk = timingSafeEqual(digest(typed), digest(readEnv("DEN_OWNER_PASSWORD")));
  return (emailOk || usernameOk) && passwordOk;
}

function signature(payload: string): Buffer | null {
  const secret = sessionSecret();
  if (!secret) return null;
  return createHmac("sha256", secret).update(payload).digest();
}

export function createSessionToken(now = Date.now()): string | null {
  if (!sessionSecret()) return null;
  const body: Payload = {
    v: 1,
    sub: "owner",
    exp: Math.floor(now / 1000) + MAX_AGE_SECONDS,
  };
  const payload = Buffer.from(JSON.stringify(body)).toString("base64url");
  const sig = signature(payload);
  if (!sig) return null;
  return `${payload}.${sig.toString("base64url")}`;
}

export function readSessionToken(token: string | undefined | null, now = Date.now()): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, encoded] = parts;
  if (!payload || !encoded) return false;

  const expected = signature(payload);
  if (!expected) return false;
  const actual = Buffer.from(encoded, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<Payload>;
    if (parsed.v !== 1 || parsed.sub !== "owner") return false;
    if (typeof parsed.exp !== "number" || !Number.isFinite(parsed.exp)) return false;
    const expiresAt = parsed.exp * 1000;
    if (expiresAt <= now) return false;
    if (expiresAt > now + MAX_AGE_SECONDS * 1000 + 60_000) return false;
    return true;
  } catch {
    return false;
  }
}

export function sessionCookieBase(secure: boolean) {
  return {
    name: SESSION_COOKIE,
    httpOnly: true as const,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}
