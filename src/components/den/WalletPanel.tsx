"use client";

import { ConnectionProvider, useConnection, useWallet, WalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { BackpackWalletAdapter } from "@solana/wallet-adapter-backpack";
import type { WalletName } from "@solana/wallet-adapter-base";
import { PublicKey } from "@solana/web3.js";
import QRCode from "qrcode";
import { useEffect, useMemo, useRef, useState } from "react";
import { readPublicAddress, sameAddress } from "@/lib/solana/address";
import {
  CONFIRM_WORD,
  TRANSFER_FEE_LAMPORTS,
  createTransferTransaction,
  lamportsFromSol,
  needsConfirm,
  parsePositive,
  publicClusterRpc,
  solFromUsd,
  solscanTx,
} from "@/lib/solana/transfer";
import type { Cluster, VaultPayload } from "@/lib/vault/types";
import { BalanceArea } from "./vault/Charts";
import { plainMoney, shortAddress, solText } from "./vault/format";
import { rememberBalance, type HistPoint } from "./vault/history";
import { CountUp } from "./vault/motion";

const WALLETS: Array<{ name: WalletName; href: string; mark: string }> = [
  { name: "Phantom" as WalletName, href: "https://phantom.app/", mark: "Ph" },
  { name: "Solflare" as WalletName, href: "https://solflare.com/", mark: "Sf" },
  { name: "Backpack" as WalletName, href: "https://backpack.app/", mark: "Bp" },
];

const BOOK_KEY = "den_withdraw_book_v1";

type Saved = { address: string };

export function WalletPanel({
  data,
  cluster,
  onCluster,
  onRefresh,
}: {
  data: VaultPayload;
  cluster: Cluster;
  onCluster: (cluster: Cluster) => void;
  onRefresh: () => void;
}) {
  const endpoint = publicClusterRpc(cluster);
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new BackpackWalletAdapter(),
  ], [endpoint]);
  return (
    <ConnectionProvider endpoint={endpoint} key={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletBody data={data} cluster={cluster} onCluster={onCluster} onRefresh={onRefresh} />
      </WalletProvider>
    </ConnectionProvider>
  );
}

function WalletBody({
  data,
  cluster,
  onCluster,
  onRefresh,
}: {
  data: VaultPayload;
  cluster: Cluster;
  onCluster: (cluster: Cluster) => void;
  onRefresh: () => void;
}) {
  const wallet = data.wallet;
  const [history, setHistory] = useState<HistPoint[]>([]);
  const [qr, setQr] = useState<string | null>(null);
  const [flow, setFlow] = useState<"topup" | "withdraw">("topup");
  const [unit, setUnit] = useState<"SOL" | "USD">("SOL");
  const [amountText, setAmountText] = useState("");
  const [destText, setDestText] = useState("");
  const [remember, setRemember] = useState(false);
  const [saved, setSaved] = useState<Saved[]>([]);
  const [sheet, setSheet] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [phase, setPhase] = useState<"review" | "sending" | "done">("review");
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [fee, setFee] = useState(TRANSFER_FEE_LAMPORTS);
  const { connection } = useConnection();
  const { publicKey, connected, connecting, select, connect, disconnect, sendTransaction, wallets, wallet: selected } = useWallet();
  const pending = useRef<string | null>(null);

  useEffect(() => {
    if (!data.walletAddress) {
      setQr(null);
      return;
    }
    let cancel = false;
    QRCode.toDataURL(`solana:${data.walletAddress}`, {
      margin: 1,
      width: 280,
      color: { dark: "#1A1D26", light: "#F2E6C9" },
    }).then((url) => {
      if (!cancel) setQr(url);
    }).catch(() => {
      if (!cancel) setQr(null);
    });
    return () => {
      cancel = true;
    };
  }, [data.walletAddress]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(BOOK_KEY);
      const parsed = raw ? JSON.parse(raw) as Saved[] : [];
      if (Array.isArray(parsed)) setSaved(parsed.filter((row) => readPublicAddress(row.address)));
    } catch {
      setSaved([]);
    }
  }, []);

  useEffect(() => {
    if (!wallet || wallet.totalUsd === null) {
      setHistory([]);
      return;
    }
    setHistory(rememberBalance(wallet.cluster, wallet.address, {
      t: Date.now(),
      usd: wallet.totalUsd,
      sol: wallet.sol,
    }));
  }, [wallet]);

  useEffect(() => {
    if (!selected || connected || connecting) return;
    if (pending.current !== selected.adapter.name) return;
    pending.current = null;
    connect().catch(() => undefined);
  }, [selected, connected, connecting, connect]);

  const solAmount = useMemo(() => {
    const amount = parsePositive(amountText);
    if (amount === null) return null;
    try {
      return unit === "SOL" ? amount : solFromUsd(amount, data.solPriceUsd ?? 0);
    } catch {
      return null;
    }
  }, [amountText, unit, data.solPriceUsd]);

  const destination = flow === "topup" ? data.walletAddress : readPublicAddress(destText);
  const overCap = solAmount !== null && needsConfirm(solAmount, data.maxTransferSol);
  const sample = !data.walletAddress && data.balanceSample
    ? data.balanceSample.map((point) => ({
      label: new Intl.DateTimeFormat("en-US", { month: "numeric", day: "numeric", timeZone: "America/New_York" }).format(new Date(point.t)),
      usd: point.usd,
    }))
    : history.map((point) => ({
      label: new Intl.DateTimeFormat("en-US", { month: "numeric", day: "numeric" }).format(point.t),
      usd: point.usd,
    }));

  function choose(name: WalletName) {
    pending.current = name;
    select(name);
  }

  function openReview() {
    setError(null);
    setSignature(null);
    setConfirmText("");
    setPhase("review");
    setFee(TRANSFER_FEE_LAMPORTS);
    if (solAmount === null) {
      setError(unit === "USD" && !data.solPriceUsd ? "No dollar price yet" : "Enter an amount above zero.");
      return;
    }
    if (!destination) {
      setError(flow === "topup" ? "No vault address yet." : "That doesn't look like a Solana address.");
      return;
    }
    if (publicKey && sameAddress(publicKey.toBase58(), destination)) {
      setError("That's the wallet you just connected.");
      return;
    }
    if (flow === "withdraw" && data.walletAddress && sameAddress(destination, data.walletAddress) && publicKey && sameAddress(publicKey.toBase58(), data.walletAddress)) {
      setError("That's already the vault address.");
      return;
    }
    if (remember && flow === "withdraw") {
      const next = [{ address: destination }, ...saved.filter((row) => row.address !== destination)].slice(0, 6);
      setSaved(next);
      localStorage.setItem(BOOK_KEY, JSON.stringify(next));
    }
    setSheet(true);
  }

  useEffect(() => {
    if (!sheet || !publicKey || !destination || phase !== "review") return;
    let cancel = false;
    createTransferTransaction({
      connection,
      from: publicKey,
      to: new PublicKey(destination),
      lamports: 1,
    }).then((tx) => connection.getFeeForMessage(tx.compileMessage(), "confirmed")).then((result) => {
      if (!cancel && result.value !== null) setFee(result.value);
    }).catch(() => {
      if (!cancel) setFee(TRANSFER_FEE_LAMPORTS);
    });
    return () => {
      cancel = true;
    };
  }, [sheet, publicKey, destination, connection, phase]);

  async function approve() {
    if (!publicKey || !destination || solAmount === null || phase === "sending") return;
    if (overCap && confirmText !== CONFIRM_WORD) return;
    setPhase("sending");
    setError(null);
    try {
      const tx = await createTransferTransaction({
        connection,
        from: publicKey,
        to: new PublicKey(destination),
        lamports: lamportsFromSol(solAmount),
      });
      const sig = await sendTransaction(tx, connection, { preflightCommitment: "confirmed" });
      setSignature(sig);
      setPhase("done");
      onRefresh();
    } catch (err) {
      setPhase("review");
      const text = (err instanceof Error ? err.message : "").replace(/https?:\/\/\S+/g, "").slice(0, 180);
      if (/reject|cancel|denied|closed/i.test(text)) setError("Your wallet didn't approve it.");
      else if (/insufficient/i.test(text)) setError("Not enough SOL for the amount and the fee.");
      else setError("That didn't go through.");
    }
  }

  const low = wallet && !wallet.pricesPartial && wallet.totalUsd !== null && wallet.totalUsd < data.roomUsd;
  const link = signature ? solscanTx(signature, cluster) : null;
  const detected = (name: string) => wallets.some((item) => item.adapter.name === name && item.readyState === "Installed");

  return (
    <div className="stack">
      <p className="safety">Your keys stay in your wallet app. This site never signs.</p>

      <section className="glass pad">
        <div className="row-between">
          <h2>Balance</h2>
          <p className="quiet">{cluster === "devnet" ? "Devnet" : "Mainnet"}</p>
        </div>
        {!data.walletConfigured || !wallet ? (
          <div className="empty-copy">
            <p>Set <code>DEN_WALLET_ADDRESS</code> to the public address. Not a key.</p>
            {data.walletError ? <p className="pnl-down">{data.walletError}</p> : null}
          </div>
        ) : (
          <>
            <p className="hero-sol"><CountUp value={wallet.sol} format={(value) => solText(value)} /> <span>SOL</span></p>
            <p className="hero-usd">{wallet.totalUsd === null ? "No dollar value yet" : <CountUp value={wallet.totalUsd} format={(value) => plainMoney(value)} />}</p>
            {low ? <p className="warn">Under the ${data.roomUsd} working balance. That&apos;s {data.maxOpen} positions at ${data.ticketUsd}.</p> : null}
            {wallet.pricesPartial ? <p className="quiet">Some prices didn&apos;t load, so the total might be low.</p> : null}
            <ul className="token-list">
              <li>
                <span>SOL</span>
                <span>{solText(wallet.sol)}</span>
                <span>{plainMoney(wallet.solUsd)}</span>
              </li>
              {wallet.tokens.map((token) => (
                <li key={token.mint}>
                  <span>{token.symbol ?? shortAddress(token.mint)}</span>
                  <span>{solText(token.amount, 2)}</span>
                  <span>{plainMoney(token.usd)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
        <h3>{data.walletAddress ? "On this device" : "Sample"}</h3>
        <BalanceArea rows={sample} />
        <p className="quiet">
          {data.walletAddress
            ? "Saved in this browser only."
            : "Sample chart. Not a real wallet."}
        </p>
      </section>

      <section className="glass pad" id="add-funds">
        <h2>Add funds</h2>
        {data.walletAddress ? (
          <>
            <p className="full-address">{data.walletAddress}</p>
            <CopyButton value={data.walletAddress} />
            {qr ? <img className="qr" src={qr} alt="QR code for the vault address" /> : <div className="skel skel-qr" />}
            <ol className="steps">
              <li>Buy SOL on an exchange.</li>
              <li>Send it to this address.</li>
              <li>Try a small amount first.</li>
            </ol>
            <p className="link-row">
              <a href="https://www.coinbase.com/price/solana" target="_blank" rel="noopener noreferrer">Coinbase</a>
              <a href="https://www.kraken.com/prices/solana" target="_blank" rel="noopener noreferrer">Kraken</a>
            </p>
          </>
        ) : <p>No address yet.</p>}
      </section>

      <section className="glass pad">
        <div className="row-between">
          <h2>Move SOL</h2>
          {data.allowDevnet ? (
            <label className="cluster-toggle">
              <input
                type="checkbox"
                checked={cluster === "devnet"}
                onChange={(event) => onCluster(event.target.checked ? "devnet" : "mainnet-beta")}
              />
              Devnet
            </label>
          ) : null}
        </div>
        <p className="quiet">Connect a wallet. You approve each transfer.</p>
        <div className="wallet-picks">
          {WALLETS.map((item) => (
            <button key={item.name} className="wallet-pick" type="button" onClick={() => choose(item.name)}>
              <span className="mark">{item.mark}</span>
              <span>{item.name}</span>
              <span className="quiet">{detected(item.name) ? "Installed" : "Get app"}</span>
            </button>
          ))}
        </div>
        <p className="installs">
          {WALLETS.map((item) => (
            <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer">{item.name}</a>
          ))}
        </p>
        {connected && publicKey ? (
          <p className="connected-line">
            Connected {shortAddress(publicKey.toBase58())}
            <button type="button" className="text-btn" onClick={() => disconnect().catch(() => undefined)}>Disconnect</button>
          </p>
        ) : <p className="quiet">{connecting ? "Waiting for your wallet." : "Not connected yet."}</p>}
        {flow === "withdraw" && connected && publicKey && data.walletAddress && !sameAddress(publicKey.toBase58(), data.walletAddress) ? (
          <p className="warn">This isn&apos;t the vault address. Withdraw sends from the wallet you connected.</p>
        ) : null}

        <div className="seg flow-seg" role="group" aria-label="Transfer direction">
          <button type="button" className={flow === "topup" ? "is-on" : ""} onClick={() => setFlow("topup")}>Top up</button>
          <button type="button" className={flow === "withdraw" ? "is-on" : ""} onClick={() => setFlow("withdraw")}>Withdraw</button>
        </div>

        <div className="seg unit-seg" role="group" aria-label="Amount unit">
          <button type="button" className={unit === "SOL" ? "is-on" : ""} onClick={() => setUnit("SOL")}>SOL</button>
          <button type="button" className={unit === "USD" ? "is-on" : ""} onClick={() => setUnit("USD")}>USD</button>
        </div>
        <label className="field">
          <span>Amount</span>
          <input data-amount inputMode="decimal" value={amountText} onChange={(event) => setAmountText(event.target.value)} placeholder={unit === "SOL" ? "0.10" : "25"} />
        </label>
        {solAmount !== null && unit === "USD" ? <p className="quiet">About {solText(solAmount, 6)} SOL{data.solPriceExample ? ", using the sample price" : ""}.</p> : null}
        <p className="quiet">Over {solText(data.maxTransferSol, 4)} SOL, type {CONFIRM_WORD} to continue.</p>

        {flow === "withdraw" ? (
          <>
            <label className="field">
              <span>Destination</span>
              <input data-dest value={destText} onChange={(event) => setDestText(event.target.value)} placeholder="Solana address" autoCapitalize="off" autoCorrect="off" spellCheck={false} />
            </label>
            {saved.length > 0 ? (
              <div className="saved-row">
                {saved.map((row) => (
                  <button key={row.address} type="button" className="chip-btn" onClick={() => setDestText(row.address)}>
                    {shortAddress(row.address)}
                  </button>
                ))}
              </div>
            ) : null}
            <label className="remember">
              <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
              Remember this address on this device
            </label>
          </>
        ) : (
          <p className="quiet">Sends to the vault address{data.walletAddress ? ` ${shortAddress(data.walletAddress)}` : ""}. You approve it in your wallet.</p>
        )}
        {error && !sheet ? <p className="pnl-down" role="alert">{error}</p> : null}
        <button className="gold-btn" type="button" data-review onClick={openReview}>Review</button>
      </section>

      {sheet && destination && solAmount !== null ? (
        <div className="sheet-back" onClick={() => { if (phase !== "sending") setSheet(false); }}>
          <div
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sheet-title"
            data-sheet
            onClick={(event) => event.stopPropagation()}
          >
            {phase === "done" && link ? (
              <>
                <p className="eyebrow">Sent</p>
                <h2 id="sheet-title">Nice, that went through</h2>
                <p>{solText(solAmount, 6)} SOL sent.</p>
                <p><a href={link} target="_blank" rel="noopener noreferrer">View on Solscan</a></p>
                <button className="gold-btn" type="button" onClick={() => setSheet(false)}>Done</button>
              </>
            ) : (
              <>
                <p className="eyebrow">{flow === "topup" ? "Top up" : "Withdraw"}</p>
                <h2 id="sheet-title">{solText(solAmount, 6)} SOL</h2>
                <p className={cluster === "devnet" ? "quiet" : "warn"}>
                  {cluster === "devnet" ? "Devnet. These aren't real funds." : "Mainnet. This one is real."}
                </p>
                <div className="sheet-row">
                  <span>To</span>
                  <strong>{shortAddress(destination)}</strong>
                  <CopyButton value={destination} />
                </div>
                <div className="sheet-row">
                  <span>Network fee</span>
                  <strong>{solText(fee / 1_000_000_000, 6)} SOL</strong>
                </div>
                {overCap ? (
                  <label className="field">
                    <span>Over {solText(data.maxTransferSol, 4)} SOL. Type {CONFIRM_WORD}</span>
                    <input data-confirm-word value={confirmText} onChange={(event) => setConfirmText(event.target.value)} autoCapitalize="characters" autoCorrect="off" />
                  </label>
                ) : null}
                {error ? <p className="pnl-down" role="alert">{error}</p> : null}
                <div className="sheet-actions">
                  <button className="ghost-btn" type="button" disabled={phase === "sending"} onClick={() => setSheet(false)}>Back</button>
                  <button
                    className="gold-btn"
                    type="button"
                    data-approve
                    disabled={!connected || phase === "sending" || (overCap && confirmText !== CONFIRM_WORD)}
                    onClick={approve}
                  >
                    {phase === "sending" ? "Waiting for your wallet" : connected ? "Approve in wallet" : "Connect a wallet first"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="text-btn"
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1200);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
