import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { authConfigured, createSessionToken, credentialsMatch, ownerUsername, readSessionToken } from "./session.ts";

const KEYS = ["DEN_OWNER_EMAIL", "DEN_OWNER_USERNAME", "DEN_OWNER_PASSWORD", "SESSION_SECRET"] as const;
const previous = new Map<string, string | undefined>();

function saveEnv() {
  for (const key of KEYS) previous.set(key, process.env[key]);
}

function restoreEnv() {
  for (const key of KEYS) {
    const value = previous.get(key);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

function configure() {
  process.env.DEN_OWNER_EMAIL = "keeper@thievnsden.com";
  process.env.DEN_OWNER_USERNAME = "Thievn";
  process.env.DEN_OWNER_PASSWORD = "correct-horse-battery";
  process.env.SESSION_SECRET = "s".repeat(40);
}

afterEach(() => {
  restoreEnv();
});

test("accepts only the configured owner", () => {
  saveEnv();
  configure();
  assert.equal(authConfigured(), true);
  assert.equal(credentialsMatch("Keeper@Thievnsden.com", "correct-horse-battery"), true);
  assert.equal(credentialsMatch("thievn", "correct-horse-battery"), true);
  assert.equal(credentialsMatch("THIEVN", "correct-horse-battery"), true);
  assert.equal(ownerUsername(), "Thievn");
  assert.equal(credentialsMatch("keeper@thievnsden.com", "wrong-passphrase-1"), false);
  assert.equal(credentialsMatch("other@thievnsden.com", "correct-horse-battery"), false);
  assert.equal(credentialsMatch("stranger", "correct-horse-battery"), false);
  delete process.env.DEN_OWNER_USERNAME;
  assert.equal(ownerUsername(), null);
  assert.equal(credentialsMatch("thievn", "correct-horse-battery"), false);
  assert.equal(credentialsMatch("keeper@thievnsden.com", "correct-horse-battery"), true);
});

test("a correct plaintext password works for Thievn, thievn, and the email", () => {
  saveEnv();
  process.env.DEN_OWNER_EMAIL = "thievnsden@gmail.com";
  process.env.DEN_OWNER_USERNAME = "Thievn";
  process.env.DEN_OWNER_PASSWORD = "plain-pass1";
  process.env.SESSION_SECRET = "s".repeat(40);
  assert.equal("plain-pass1".length, 11);
  assert.equal(authConfigured(), true);
  assert.equal(credentialsMatch("Thievn", "plain-pass1"), true);
  assert.equal(credentialsMatch("thievn", "plain-pass1"), true);
  assert.equal(credentialsMatch("THIEVN", "plain-pass1"), true);
  assert.equal(credentialsMatch("thievnsden@gmail.com", "plain-pass1"), true);
  assert.equal(credentialsMatch("THIEVNSDEN@GMAIL.COM", "plain-pass1"), true);
  assert.equal(credentialsMatch("Thievn", "Plain-pass1"), false);
  assert.equal(credentialsMatch("someone@else.com", "plain-pass1"), false);

  process.env.DEN_OWNER_EMAIL = '"thievnsden@gmail.com"\n';
  process.env.DEN_OWNER_USERNAME = "  'Thievn'  ";
  process.env.DEN_OWNER_PASSWORD = '"plain-pass1"\n';
  assert.equal(ownerUsername(), "Thievn");
  assert.equal(credentialsMatch("Thievn", " plain-pass1 "), true);
  assert.equal(credentialsMatch("thievn", "plain-pass1"), true);
  assert.equal(credentialsMatch("thievnsden@gmail.com", "plain-pass1"), true);
});

test("fails closed when secrets are missing or short", () => {
  saveEnv();
  configure();
  process.env.DEN_OWNER_PASSWORD = "short";
  assert.equal(authConfigured(), false);
  assert.equal(credentialsMatch("keeper@thievnsden.com", "short"), false);
  process.env.DEN_OWNER_PASSWORD = "correct-horse-battery";
  process.env.SESSION_SECRET = "too-short";
  assert.equal(authConfigured(), false);
  assert.equal(createSessionToken(), null);
});

test("session token round-trips and rejects tampering", () => {
  saveEnv();
  configure();
  const now = Date.parse("2026-10-21T00:00:00Z");
  const token = createSessionToken(now);
  assert.ok(token);
  assert.equal(readSessionToken(token, now + 1_000), true);
  assert.equal(readSessionToken(token, now + 1000 * 60 * 60 * 24 * 20), false);

  const [payload, sig] = token.split(".");
  assert.equal(readSessionToken(`${payload}.${sig.slice(0, -2)}aa`, now + 1_000), false);

  const forged = Buffer.from(JSON.stringify({ v: 1, sub: "owner", exp: 9_999_999_999 })).toString(
    "base64url",
  );
  assert.equal(readSessionToken(`${forged}.${sig}`, now + 1_000), false);
});
