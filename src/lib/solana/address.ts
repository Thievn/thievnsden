import { PublicKey } from "@solana/web3.js";

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]+$/;

/** Accept only a 32-byte public key. Seeds, JSON secret keys, and long secrets return null. */
export function readPublicAddress(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (value.length < 32 || value.length > 44) return null;
  if (!BASE58.test(value)) return null;
  try {
    const key = new PublicKey(value);
    if (key.toBytes().length !== 32) return null;
    return key.toBase58();
  } catch {
    return null;
  }
}

export function sameAddress(left: string, right: string): boolean {
  const a = readPublicAddress(left);
  const b = readPublicAddress(right);
  return a !== null && a === b;
}
