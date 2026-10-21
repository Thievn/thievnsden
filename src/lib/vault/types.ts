export type Stage = "limits" | "facts" | "pool" | "grok" | "budget";
export type Verdict = "BUY" | "SKIP";
export type TradeAction = "open" | "partial" | "close";
export type DeskMode = "PAPER" | "LIVE";
export type Cluster = "mainnet-beta" | "devnet";
export type DeskSource = "live" | "example" | "empty";

export type CheckRow = {
  id: string;
  time: string;
  mint: string;
  symbol: string | null;
  stage: Stage;
  verdict: Verdict;
  confidence: number | null;
  reason: string | null;
};

export type PositionRow = {
  mint: string;
  symbol: string | null;
  entry: number | null;
  qty0: number | null;
  qty: number | null;
  peak: number | null;
  liq0: number | null;
  opened: string | null;
  steps: number;
};

export type TradeRow = {
  id: string;
  time: string;
  mint: string;
  symbol: string | null;
  action: TradeAction;
  usd: number | null;
  pnl: number | null;
  reason: string | null;
};

export type AlertRow = {
  id: string;
  createdAt: string;
  source: string | null;
  kind: string | null;
  mint: string | null;
  symbol: string | null;
  text: string;
  acknowledged: boolean;
};

export type ReportRow = {
  day: string;
  mode: DeskMode | null;
  body: string;
  createdAt: string;
};

export type RunRow = {
  id: string;
  ranAt: string;
  kind: string;
  status: string;
  counts: Record<string, number> | null;
  error: string | null;
};

export type Overview = {
  mode: DeskMode | null;
  todayPnl: number;
  openCount: number;
  entriesToday: number;
  dailyLossUsd: number;
  lastRun: { ranAt: string; kind: string; status: string; error: string | null } | null;
};

export type Funnel = {
  checked: number;
  passedLimits: number;
  passedFacts: number;
  passedPool: number;
  budget: number;
  bought: number;
};

export type WinRate = {
  wins: number;
  losses: number;
  flat: number;
  rate: number | null;
};

export type DeskView = {
  overview: Overview;
  alerts: AlertRow[];
  positions: PositionRow[];
  checks: CheckRow[];
  funnel: Funnel;
  trades: TradeRow[];
  equity: { time: string; usd: number }[];
  dailyPnl: { day: string; usd: number }[];
  winRate: WinRate;
  reports: ReportRow[];
  runs: RunRow[];
};

export type TokenBalance = {
  mint: string;
  symbol: string | null;
  amount: number;
  usd: number | null;
  priceUsd: number | null;
};

export type WalletSnapshot = {
  address: string;
  cluster: Cluster;
  sol: number;
  solPriceUsd: number | null;
  solUsd: number | null;
  tokens: TokenBalance[];
  totalUsd: number | null;
  pricesPartial: boolean;
  fetchedAt: string;
};

export type BalanceSample = { t: string; usd: number };

export type VaultPayload = {
  ok: true;
  source: DeskSource;
  deskError: string | null;
  connected: boolean;
  walletConfigured: boolean;
  walletAddress: string | null;
  walletError: string | null;
  maxTransferSol: number;
  cluster: Cluster;
  allowDevnet: boolean;
  solPriceUsd: number | null;
  solPriceExample: boolean;
  wallet: WalletSnapshot | null;
  balanceSample: BalanceSample[] | null;
  overview: Overview;
  alerts: AlertRow[];
  positions: PositionRow[];
  checks: CheckRow[];
  funnel: Funnel;
  trades: TradeRow[];
  equity: { time: string; usd: number }[];
  dailyPnl: { day: string; usd: number }[];
  winRate: WinRate;
  reports: ReportRow[];
  runs: RunRow[];
  refreshedAt: string;
  roomUsd: number;
  ticketUsd: number;
  maxOpen: number;
  haltUsd: number;
};
