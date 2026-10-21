import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  CONFIRM_WORD,
  DEFAULT_MAX_TRANSFER_SOL,
  TRANSFER_FEE_LAMPORTS,
} from "../vault/constants";
import type { Cluster } from "../vault/types";

export { CONFIRM_WORD, DEFAULT_MAX_TRANSFER_SOL, TRANSFER_FEE_LAMPORTS };

const LAMPORTS_PER_SOL = 1_000_000_000;

export function publicClusterRpc(cluster: Cluster): string {
  return cluster === "devnet" ? "https://api.devnet.solana.com" : "https://api.mainnet-beta.solana.com";
}

export function lamportsFromSol(sol: number): number {
  if (!Number.isFinite(sol) || sol <= 0) throw new Error("Amount must be greater than zero.");
  const lamports = Math.round(sol * LAMPORTS_PER_SOL);
  if (!Number.isSafeInteger(lamports) || lamports < 1) throw new Error("Amount is too small.");
  if (lamports > 1_000_000 * LAMPORTS_PER_SOL) throw new Error("Amount is too large.");
  return lamports;
}

export function solFromUsd(usd: number, priceUsd: number): number {
  if (!Number.isFinite(usd) || usd <= 0) throw new Error("Amount must be greater than zero.");
  if (!Number.isFinite(priceUsd) || priceUsd <= 0) throw new Error("No SOL price yet.");
  return usd / priceUsd;
}

export function parsePositive(text: string): number | null {
  const cleaned = text.trim().replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

export function needsConfirm(sol: number, maxSol = DEFAULT_MAX_TRANSFER_SOL): boolean {
  if (!Number.isFinite(sol) || sol <= 0) return false;
  const cap = Number.isFinite(maxSol) && maxSol > 0 ? maxSol : DEFAULT_MAX_TRANSFER_SOL;
  return sol > cap + 1e-9;
}

export function solscanTx(signature: string, cluster: Cluster): string | null {
  if (!/^[1-9A-HJ-NP-Za-km-z]{64,100}$/.test(signature)) return null;
  const base = `https://solscan.io/tx/${signature}`;
  return cluster === "devnet" ? `${base}?cluster=devnet` : base;
}

export async function createTransferTransaction(args: {
  connection: Connection;
  from: PublicKey;
  to: PublicKey;
  lamports: number;
}): Promise<Transaction> {
  if (!Number.isSafeInteger(args.lamports) || args.lamports < 1) {
    throw new Error("Amount is too small.");
  }
  const latest = await args.connection.getLatestBlockhash("confirmed");
  return new Transaction({
    feePayer: args.from,
    blockhash: latest.blockhash,
    lastValidBlockHeight: latest.lastValidBlockHeight,
  }).add(
    SystemProgram.transfer({
      fromPubkey: args.from,
      toPubkey: args.to,
      lamports: args.lamports,
    }),
  );
}
