import { DEFAULT_MAX_TRANSFER_SOL } from "./constants";
import type { Cluster } from "./types";

export function previewFeatures(): boolean {
  if (process.env.VERCEL_ENV === "production") return false;
  if (process.env.VERCEL_ENV === "preview" || process.env.VERCEL_ENV === "development") return true;
  return process.env.NODE_ENV !== "production";
}

export function resolveCluster(requested: string | null, allowDevnet: boolean): Cluster {
  if (allowDevnet && requested === "devnet") return "devnet";
  return "mainnet-beta";
}

export function readMaxTransferSol(raw: string | undefined): number {
  if (!raw?.trim()) return DEFAULT_MAX_TRANSFER_SOL;
  const value = Number(raw.trim());
  if (!Number.isFinite(value) || value <= 0 || value > 10_000) return DEFAULT_MAX_TRANSFER_SOL;
  return Math.round(value * 1_000_000) / 1_000_000;
}
