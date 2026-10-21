const BASE58 = /^[1-9A-HJ-NP-Za-km-z]+$/;
const WORD = /^[a-zA-Z]+$/;

/** True when pasted text looks like a seed or a private key. Public addresses stay false. */
export function looksLikeSecret(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(trimmed)) return true;
  const words = trimmed.split(/\s+/);
  if ((words.length === 12 || words.length === 24) && words.every((word) => WORD.test(word))) return true;
  const compact = trimmed.replace(/\s+/g, "");
  const hexBody = compact.replace(/^0x/i, "");
  if (/^[0-9a-fA-F]+$/.test(hexBody) && hexBody.length >= 64) return true;
  if (BASE58.test(compact) && compact.length > 64) return true;
  return false;
}

export function walletProblem(address: string): { message: string; clear: boolean } | null {
  const value = address.trim();
  if (!value) return { message: "Add a public address.", clear: false };
  if (looksLikeSecret(value)) {
    return { message: "That looks like a private key or seed. Paste a public address.", clear: true };
  }
  if (value.length < 20 || value.length > 128 || /\s/.test(value)) {
    return { message: "That doesn't look like a public address.", clear: false };
  }
  return null;
}
