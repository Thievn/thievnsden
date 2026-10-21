import { NextRequest, NextResponse } from "next/server";
import { hasOwnerSession } from "@/lib/guard";
import { buildDesk } from "@/lib/vault/aggregate";
import {
  DAILY_LOSS_HALT_USD,
  EXAMPLE_SOL_USD,
  MAX_OPEN,
  ROOM_USD,
  TICKET_USD,
} from "@/lib/vault/constants";
import { previewFeatures, readMaxTransferSol, resolveCluster } from "@/lib/vault/env";
import { exampleBalance, exampleDesk } from "@/lib/vault/example";
import {
  acknowledgeAlert,
  deskIsEmpty,
  loadDesk,
  publicDeskError,
  supabaseConfigured,
} from "@/lib/vault/supabase";
import type { BalanceSample, DeskSource, DeskView, VaultPayload, WalletSnapshot } from "@/lib/vault/types";
import { fetchSolPrice, fetchWallet, tradingWalletAddress } from "@/lib/vault/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LOCKED = "The lock does not turn.";

function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === req.nextUrl.host;
  } catch {
    return false;
  }
}

function quietDesk(now: Date): DeskView {
  return buildDesk({
    checks: [],
    positions: [],
    trades: [],
    alerts: [],
    reports: [],
    runs: [],
    now,
  });
}

function payload(input: {
  source: DeskSource;
  deskError: string | null;
  connected: boolean;
  desk: DeskView;
  balanceSample: BalanceSample[] | null;
  wallet: WalletSnapshot | null;
  walletError: string | null;
  walletAddress: string | null;
  solPriceUsd: number | null;
  solPriceExample: boolean;
  cluster: VaultPayload["cluster"];
  allowDevnet: boolean;
  maxTransferSol: number;
}): VaultPayload {
  return {
    ok: true,
    source: input.source,
    deskError: input.deskError,
    connected: input.connected,
    walletConfigured: input.walletAddress !== null,
    walletAddress: input.walletAddress,
    walletError: input.walletError,
    maxTransferSol: input.maxTransferSol,
    cluster: input.cluster,
    allowDevnet: input.allowDevnet,
    solPriceUsd: input.solPriceUsd,
    solPriceExample: input.solPriceExample,
    wallet: input.wallet,
    balanceSample: input.walletAddress ? null : input.balanceSample,
    ...input.desk,
    refreshedAt: new Date().toISOString(),
    roomUsd: ROOM_USD,
    ticketUsd: TICKET_USD,
    maxOpen: MAX_OPEN,
    haltUsd: DAILY_LOSS_HALT_USD,
  };
}

export async function GET(req: NextRequest) {
  if (!(await hasOwnerSession())) {
    return NextResponse.json({ ok: false, error: LOCKED }, { status: 401 });
  }

  const preview = previewFeatures();
  const cluster = resolveCluster(req.nextUrl.searchParams.get("cluster"), preview);
  const now = new Date();
  let source: DeskSource = "empty";
  let deskError: string | null = null;
  let connected = false;
  let desk = quietDesk(now);
  let balanceSample: BalanceSample[] | null = null;

  if (!supabaseConfigured()) {
    if (preview) {
      source = "example";
      desk = exampleDesk(now);
      balanceSample = exampleBalance(now);
    } else {
      deskError = "The vault is not connected.";
    }
  } else {
    connected = true;
    try {
      const tables = await loadDesk();
      if (deskIsEmpty(tables) && preview) {
        source = "example";
        desk = exampleDesk(now);
        balanceSample = exampleBalance(now);
      } else if (deskIsEmpty(tables)) {
        source = "empty";
      } else {
        source = "live";
        desk = buildDesk({ ...tables, now });
      }
    } catch (error) {
      console.error(publicDeskError(error));
      deskError = publicDeskError(error);
    }
  }

  const walletAddress = tradingWalletAddress();
  let wallet: WalletSnapshot | null = null;
  let walletError: string | null = null;
  if (walletAddress) {
    try {
      wallet = await fetchWallet(walletAddress, cluster);
    } catch (error) {
      walletError = error instanceof Error ? error.message : "The chain did not answer.";
    }
  }

  let solPriceUsd = wallet?.solPriceUsd ?? null;
  if (solPriceUsd === null && cluster === "mainnet-beta") {
    solPriceUsd = await fetchSolPrice(cluster);
  }
  let solPriceExample = false;
  if (solPriceUsd === null && preview) {
    solPriceUsd = EXAMPLE_SOL_USD;
    solPriceExample = true;
  }

  return NextResponse.json(payload({
    source,
    deskError,
    connected,
    desk,
    balanceSample,
    wallet,
    walletError,
    walletAddress,
    solPriceUsd,
    solPriceExample,
    cluster,
    allowDevnet: preview,
    maxTransferSol: readMaxTransferSol(process.env.DEN_MAX_TRANSFER_SOL),
  }), {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) {
    return NextResponse.json({ ok: false, error: LOCKED }, { status: 403 });
  }
  if (!(await hasOwnerSession())) {
    return NextResponse.json({ ok: false, error: LOCKED }, { status: 401 });
  }
  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > 2_000) {
    return NextResponse.json({ ok: false, error: LOCKED }, { status: 413 });
  }
  const body = await req.json().catch(() => null) as { action?: unknown; id?: unknown } | null;
  if (body?.action !== "acknowledge" || typeof body.id !== "string") {
    return NextResponse.json({ ok: false, error: "Nothing to mark." }, { status: 400 });
  }
  if (body.id.startsWith("ex-")) {
    return NextResponse.json({ ok: false, error: "Sample alerts stay on this screen." }, { status: 400 });
  }
  try {
    await acknowledgeAlert(body.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "BAD_ID") {
      return NextResponse.json({ ok: false, error: "Nothing to mark." }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "The mark did not take." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
