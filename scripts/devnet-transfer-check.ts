/**
 * Local devnet check only. The site never imports this file and never signs.
 * A throwaway keypair is created in memory, funded by the public faucet, and
 * discarded when the process exits.
 */
import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { createTransferTransaction, lamportsFromSol, solscanTx } from "../src/lib/solana/transfer.ts";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");

async function airdrop(to: Keypair): Promise<void> {
  try {
    const signature = await connection.requestAirdrop(to.publicKey, LAMPORTS_PER_SOL);
    const latest = await connection.getLatestBlockhash("confirmed");
    await connection.confirmTransaction({ signature, ...latest }, "confirmed");
  } catch (error) {
    const message = error instanceof Error ? error.message : "The faucet did not answer.";
    throw new Error(message.replace(/\s+/g, " ").slice(0, 240));
  }
}

const from = Keypair.generate();
const to = Keypair.generate();
await airdrop(from);
const tx = await createTransferTransaction({
  connection,
  from: from.publicKey,
  to: to.publicKey,
  lamports: lamportsFromSol(0.01),
});
if (tx.instructions.length !== 1) throw new Error("Expected one instruction.");
const signature = await connection.sendTransaction(tx, [from], { preflightCommitment: "confirmed" });
const latest = await connection.getLatestBlockhash("confirmed");
await connection.confirmTransaction({ signature, ...latest }, "confirmed");
const landed = await connection.getBalance(to.publicKey, "confirmed");
if (landed !== lamportsFromSol(0.01)) {
  throw new Error(`Destination balance was ${landed} lamports.`);
}
console.log(JSON.stringify({
  ok: true,
  lamports: landed,
  signature,
  solscan: solscanTx(signature, "devnet"),
}));
