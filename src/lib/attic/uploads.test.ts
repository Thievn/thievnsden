import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

function fn(source: string, name: string) {
  const start = source.indexOf(`async function ${name}`);
  assert.notEqual(start, -1, name);
  const next = source.indexOf("\nasync function ", start + 10);
  return source.slice(start, next === -1 ? source.length : next);
}

test("uploads are stored before any generation check", () => {
  const source = readFileSync(new URL("./handle.ts", import.meta.url), "utf8");
  assert.equal(source.includes("Nothing was saved"), false);
  assert.equal(source.includes("enroll"), false);

  for (const name of ["saveUpload", "faceLock", "bodyScan"]) {
    const body = fn(source, name);
    assert.equal(/decideFace|readFace|isExplicit|checkGenerationFace/.test(body), false, name);
    assert.match(body, /rememberUpload/);
  }

  const stored = fn(source, "rememberUpload");
  assert.match(stored, /upload_sha/);
  assert.equal(stored.includes("content_sha"), false);
  assert.match(stored, /kind:\s*"upload"/);

  const edit = fn(source, "edit");
  const savedAt = edit.indexOf("rememberUploads");
  const ageAt = edit.indexOf("minorReason");
  const faceAt = edit.indexOf("checkGenerationFace");
  assert.ok(savedAt >= 0 && savedAt < ageAt && ageAt < faceAt);
  assert.match(edit, /rememberUploads\(\[subject, outfit, extra\]\)/);
  assert.equal(edit.includes("content_sha"), false);
  assert.match(fn(source, "checkGenerationFace"), /decideFace\(report, explicit\)/);
  assert.match(fn(source, "poll"), /content_sha/);
});
