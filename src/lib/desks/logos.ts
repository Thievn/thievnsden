const COIN_GECKO: Record<string, string> = {
  SOL: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
  BTC: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
  ETH: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
};

export const COIN_PLACEHOLDER = "/img/coin-placeholder.svg";

export function geckoUrl(symbol: string | null | undefined): string | null {
  if (!symbol) return null;
  return COIN_GECKO[symbol.trim().toUpperCase()] ?? null;
}

export function pairHead(value: string): string {
  const head = value.toUpperCase().split(/[-/_\s]/)[0] ?? "";
  return head.replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

export function letters(symbol: string): string {
  const clean = symbol.replace(/[^A-Za-z0-9]/g, "");
  return (clean.slice(0, 2) || "•").toUpperCase();
}
