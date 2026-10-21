export const DESK_IDS = ["solana", "binanceus", "coinbase"] as const;

export type DeskId = (typeof DESK_IDS)[number];

export type PairId = "SOL-USD" | "BTC-USD" | "ETH-USD";

export const PAIRS: PairId[] = ["SOL-USD", "BTC-USD", "ETH-USD"];

export const CHAINS = ["solana", "ethereum", "bitcoin"] as const;

export type ChainId = (typeof CHAINS)[number];

export type DeskFees = {
  maker: string;
  taker: string;
  assumption: boolean;
};

export type DeskMeta = {
  id: DeskId;
  name: string;
  venue: boolean;
  mark: string;
  gecko: "SOL" | null;
  fees: DeskFees | null;
};

export const DESKS: Record<DeskId, DeskMeta> = {
  solana: { id: "solana", name: "Solana", venue: false, mark: "SOL", gecko: "SOL", fees: null },
  binanceus: {
    id: "binanceus",
    name: "Binance.US",
    venue: true,
    mark: "BN",
    gecko: null,
    fees: { maker: "0%", taker: "0.02%", assumption: false },
  },
  coinbase: {
    id: "coinbase",
    name: "Coinbase",
    venue: true,
    mark: "CB",
    gecko: null,
    fees: { maker: "0.60%", taker: "1.20%", assumption: true },
  },
};

export function isDeskId(value: string): value is DeskId {
  return (DESK_IDS as readonly string[]).includes(value);
}

export function isChain(value: string): value is ChainId {
  return (CHAINS as readonly string[]).includes(value);
}
