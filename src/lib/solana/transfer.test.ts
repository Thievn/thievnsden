import assert from "node:assert/strict";
import test from "node:test";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import { readPublicAddress } from "./address.ts";
import {
  CONFIRM_WORD,
  createTransferTransaction,
  lamportsFromSol,
  needsConfirm,
  parsePositive,
  solscanTx,
} from "./transfer.ts";

const FROM = new PublicKey("BHhLhBvB2PusycxycgQVVsBuU73ZiBB5gdJsSCr12aPe");
const TO = new PublicKey("G5caahV1rDj23DEd227hS62EKQrs5pgmSfJuP4uXEh1u");

test("lamports and the confirm cap", () => {
  assert.equal(lamportsFromSol(1), 1_000_000_000);
  assert.equal(lamportsFromSol(0.000000001), 1);
  assert.throws(() => lamportsFromSol(0));
  assert.throws(() => lamportsFromSol(-1));
  assert.equal(needsConfirm(2, 2), false);
  assert.equal(needsConfirm(2.01, 2), true);
  assert.equal(CONFIRM_WORD, "CONFIRM");
  assert.equal(parsePositive("1,250.50"), 1250.5);
  assert.equal(parsePositive("0"), null);
  assert.equal(parsePositive("1e2"), null);
});

test("a transfer is one system instruction and nothing else", async () => {
  const connection = {
    getLatestBlockhash: async () => ({
      blockhash: "11111111111111111111111111111111",
      lastValidBlockHeight: 99,
    }),
  } as Connection;
  const tx = await createTransferTransaction({
    connection,
    from: FROM,
    to: TO,
    lamports: lamportsFromSol(0.01),
  });
  assert.equal(tx.instructions.length, 1);
  assert.equal(tx.feePayer?.equals(FROM), true);
  const instruction = tx.instructions[0];
  assert.equal(instruction.programId.equals(SystemProgram.programId), true);
  assert.equal(instruction.keys[0].pubkey.equals(FROM), true);
  assert.equal(instruction.keys[1].pubkey.equals(TO), true);
  const data = Buffer.from(instruction.data);
  assert.equal(data.readUInt32LE(0), 2);
  assert.equal(Number(data.readBigUInt64LE(4)), 10_000_000);
  assert.equal(JSON.stringify(tx).includes("secretKey"), false);
});

test("addresses are public keys only", () => {
  assert.equal(
    readPublicAddress("So11111111111111111111111111111111111111112"),
    "So11111111111111111111111111111111111111112",
  );
  assert.equal(readPublicAddress("abandon abandon abandon abandon abandon abandon"), null);
  assert.equal(readPublicAddress(`[${"1,".repeat(64)}1]`), null);
  assert.equal(readPublicAddress("not a key"), null);
  assert.equal(readPublicAddress("4"), null);
  assert.equal(solscanTx("a".repeat(80), "devnet")?.includes("cluster=devnet"), true);
  assert.equal(solscanTx("a".repeat(80), "mainnet-beta")?.includes("cluster"), false);
  assert.equal(solscanTx("short", "mainnet-beta"), null);
});
