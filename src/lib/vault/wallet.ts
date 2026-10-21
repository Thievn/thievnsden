import { Connection, PublicKey } from "@solana/web3.js";
import { readPublicAddress } from "../solana/address";
import { SOL_MINT } from "./constants";
import type { Cluster, TokenBalance, WalletSnapshot } from "./types";

if (typeof window !== "undefined") {
  throw new Error("Wallet reads stay on the server.");
}

const TOKEN_PROGRAM = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const TOKEN_2022 = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
const CACHE_MS = 20_000;

type PriceHit = { usd: number; symbol: string | null; liq: number };

const walletCache = new Map<string, { at: number; value: WalletSnapshot }>();
let priceCache: { at: number; key: string; value: Map<string, PriceHit> } | null = null;

export function tradingWalletAddress(): string | null {
  const raw = process.env.DEN_WALLET_ADDRESS;
  const address = readPublicAddress(raw);
  if (raw?.trim() && !address) {
    console.error("DEN_WALLET_ADDRESS was rejected because it is not a public key.");
  }
  return address;
}

function mainnetRpc(): string {
  const raw = process.env.SOLANA_RPC_URL?.trim() ?? "";
  if (!raw.startsWith("https://") || /devnet/i.test(raw)) return "https://api.mainnet-beta.solana.com";
  return raw;
}

function rpcFor(cluster: Cluster): string {
  return cluster === "devnet" ? "https://api.devnet.solana.com" : mainnetRpc();
}

function safeError(): string {
  return "The chain did not answer.";
}

async function withTimeout<T>(work: Promise<T>, ms = 8_000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error("timeout")), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function tokenPrices(mints: string[]): Promise<Map<string, PriceHit>> {
  const key = mints.slice().sort().join(",");
  if (priceCache && priceCache.key === key && Date.now() - priceCache.at < CACHE_MS) return priceCache.value;
  const found = new Map<string, PriceHit>();
  for (let index = 0; index < mints.length; index += 30) {
    const chunk = mints.slice(index, index + 30);
    const response = await withTimeout(fetch(`https://api.dexscreener.com/tokens/v1/solana/${chunk.join(",")}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    }));
    if (!response.ok) continue;
    const body = await response.json() as unknown;
    const pairs = Array.isArray(body) ? body : (body && typeof body === "object" && Array.isArray((body as { pairs?: unknown }).pairs)
      ? (body as { pairs: unknown[] }).pairs
      : []);
    for (const pair of pairs) {
      if (!pair || typeof pair !== "object") continue;
      const row = pair as {
        baseToken?: { address?: string; symbol?: string };
        priceUsd?: string;
        liquidity?: { usd?: number };
      };
      const mint = row.baseToken?.address;
      const usd = Number(row.priceUsd);
      const liq = Number(row.liquidity?.usd ?? 0);
      if (!mint || !Number.isFinite(usd)) continue;
      const prev = found.get(mint);
      if (!prev || liq > prev.liq) found.set(mint, { usd, symbol: row.baseToken?.symbol ?? null, liq });
    }
  }
  priceCache = { at: Date.now(), key, value: found };
  return found;
}

export async function fetchSolPrice(cluster: Cluster): Promise<number | null> {
  if (cluster === "devnet") return null;
  try {
    const prices = await tokenPrices([SOL_MINT]);
    return prices.get(SOL_MINT)?.usd ?? null;
  } catch {
    return null;
  }
}

type ParsedAccount = {
  account?: {
    data?: {
      parsed?: {
        info?: {
          mint?: string;
          tokenAmount?: { uiAmount?: number | null };
        };
      };
    };
  };
};

function readTokens(accounts: ParsedAccount[]): { mint: string; amount: number }[] {
  const rows: { mint: string; amount: number }[] = [];
  for (const account of accounts) {
    const info = account.account?.data?.parsed?.info;
    const mint = info?.mint;
    const amount = info?.tokenAmount?.uiAmount;
    if (!mint || typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) continue;
    rows.push({ mint, amount });
  }
  return rows;
}

export async function fetchWallet(address: string, cluster: Cluster): Promise<WalletSnapshot> {
  const cacheKey = `${cluster}:${address}`;
  const cached = walletCache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.value;
  try {
    const connection = new Connection(rpcFor(cluster), "confirmed");
    const owner = new PublicKey(address);
    const [lamports, spl, token2022] = await Promise.all([
      withTimeout(connection.getBalance(owner, "confirmed")),
      withTimeout(connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_PROGRAM })),
      withTimeout(connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_2022 })),
    ]);
    const sol = lamports / 1_000_000_000;
    const held = [...readTokens(spl.value as ParsedAccount[]), ...readTokens(token2022.value as ParsedAccount[])]
      .slice(0, 40);
    let prices = new Map<string, PriceHit>();
    if (cluster === "mainnet-beta") {
      try {
        prices = await tokenPrices([SOL_MINT, ...held.map((token) => token.mint)]);
      } catch {
        prices = new Map();
      }
    }
    const solPrice = prices.get(SOL_MINT)?.usd ?? null;
    const tokens: TokenBalance[] = held.map((token) => {
      const hit = prices.get(token.mint);
      const priceUsd = hit?.usd ?? null;
      return {
        mint: token.mint,
        symbol: hit?.symbol ?? null,
        amount: token.amount,
        priceUsd,
        usd: priceUsd === null ? null : Math.round(token.amount * priceUsd * 100) / 100,
      };
    }).sort((left, right) => (right.usd ?? -1) - (left.usd ?? -1));
    const pricesPartial = solPrice === null || tokens.some((token) => token.usd === null);
    const tokenUsd = tokens.reduce((sum, token) => sum + (token.usd ?? 0), 0);
    const snapshot: WalletSnapshot = {
      address,
      cluster,
      sol,
      solPriceUsd: solPrice,
      solUsd: solPrice === null ? null : Math.round(sol * solPrice * 100) / 100,
      tokens,
      totalUsd: solPrice === null ? null : Math.round((sol * solPrice + tokenUsd) * 100) / 100,
      pricesPartial,
      fetchedAt: new Date().toISOString(),
    };
    walletCache.set(cacheKey, { at: Date.now(), value: snapshot });
    return snapshot;
  } catch {
    throw new Error(safeError());
  }
}
