import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import {
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
  getAccount,
  getMint,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { createMemoInstruction } from "@solana/spl-memo";
import bs58 from "bs58";
import {
  SOLANA_RPC_ENDPOINTS,
  TOKEN,
  TREASURY_WALLET,
  toAtomic,
} from "@/lib/token";

let cachedRpcEndpoint: string | null = null;

export async function getConnection(): Promise<Connection> {
  if (cachedRpcEndpoint) {
    return new Connection(cachedRpcEndpoint, "confirmed");
  }

  for (const endpoint of SOLANA_RPC_ENDPOINTS) {
    const connection = new Connection(endpoint, "confirmed");
    try {
      await connection.getLatestBlockhash();
      cachedRpcEndpoint = endpoint;
      return connection;
    } catch {
      // Try the next endpoint if this RPC is unavailable or blocked.
    }
  }

  return new Connection(SOLANA_RPC_ENDPOINTS[0] ?? "https://api.mainnet-beta.solana.com", "confirmed");
}

export function treasuryPubkey(): PublicKey {
  if (!TREASURY_WALLET) {
    throw new Error("NEXT_PUBLIC_TREASURY_WALLET is not set");
  }
  return new PublicKey(TREASURY_WALLET);
}

export function mintPubkey(): PublicKey {
  return new PublicKey(TOKEN.mint);
}

/** Build a transfer of `humanAmount` $JCKYCSNO → treasury, with memo tag. */
export async function buildTreasurySpendTx(params: {
  from: PublicKey;
  humanAmount: number;
  memo: string;
}): Promise<Transaction> {
  const connection = await getConnection();
  const mint = mintPubkey();
  const treasury = treasuryPubkey();
  const amount = toAtomic(params.humanAmount);

  let decimals: number = TOKEN.decimals;
  try {
    const mintInfo = await getMint(connection, mint);
    decimals = mintInfo.decimals;
  } catch {
    /* use configured default */
  }

  const fromAta = getAssociatedTokenAddressSync(
    mint,
    params.from,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  const toAta = getAssociatedTokenAddressSync(
    mint,
    treasury,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const tx = new Transaction();
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.lastValidBlockHeight = lastValidBlockHeight;
  tx.feePayer = params.from;

  try {
    await getAccount(connection, fromAta);
  } catch {
    tx.add(
      createAssociatedTokenAccountInstruction(
        params.from,
        fromAta,
        params.from,
        mint,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );
  }

  try {
    await getAccount(connection, toAta);
  } catch {
    tx.add(
      createAssociatedTokenAccountInstruction(
        params.from,
        toAta,
        treasury,
        mint,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );
  }

  tx.add(
    createTransferCheckedInstruction(
      fromAta,
      mint,
      toAta,
      params.from,
      amount,
      decimals,
      [],
      TOKEN_PROGRAM_ID
    )
  );
  tx.add(createMemoInstruction(params.memo, [params.from]));

  return tx;
}

export type VerifiedSpend = {
  ok: true;
  signature: string;
  from: string;
  amountAtomic: bigint;
} | {
  ok: false;
  reason: string;
};

/** Confirm a spend landed in the treasury ATA for our mint. */
export async function verifyTreasurySpend(params: {
  signature: string;
  expectedFrom: string;
  expectedHumanAmount: number;
  memoIncludes?: string;
}): Promise<VerifiedSpend> {
  const connection = await getConnection();
  const expected = toAtomic(params.expectedHumanAmount);

  const tx = await connection.getParsedTransaction(params.signature, {
    maxSupportedTransactionVersion: 0,
    commitment: "confirmed",
  });

  if (!tx || tx.meta?.err) {
    return { ok: false, reason: "Transaction not found or failed" };
  }

  const mint = TOKEN.mint;
  const treasury = TREASURY_WALLET;
  let transferred = BigInt(0);
  let fromOwner: string | null = null;
  const feePayer =
    tx.transaction.message.accountKeys[0]?.pubkey?.toString?.() ?? null;

  for (const ix of tx.transaction.message.instructions) {
    if (!("parsed" in ix) || !ix.parsed) continue;
    const p = ix.parsed as {
      type?: string;
      info?: {
        mint?: string;
        authority?: string;
        source?: string;
        destination?: string;
        tokenAmount?: { amount?: string; decimals?: number };
        amount?: string;
      };
    };

    if (p.type === "transferChecked" || p.type === "transfer") {
      const info = p.info;
      if (!info) continue;
      if (info.mint && info.mint !== mint) continue;

      const raw = BigInt(
        info.tokenAmount?.amount ?? info.amount ?? "0"
      );
      // destination is ATA — resolve owner via post token balances
      transferred += raw;
      fromOwner = info.authority ?? fromOwner;
    }
  }

  // Prefer token-balance deltas for destination ownership check
  const pre = tx.meta?.preTokenBalances ?? [];
  const post = tx.meta?.postTokenBalances ?? [];
  let treasuryDelta = BigInt(0);

  for (const postBal of post) {
    if (postBal.mint !== mint) continue;
    if (postBal.owner !== treasury) continue;
    const preBal = pre.find(
      (b) =>
        b.accountIndex === postBal.accountIndex &&
        b.mint === mint
    );
    const before = BigInt(preBal?.uiTokenAmount.amount ?? "0");
    const after = BigInt(postBal.uiTokenAmount.amount ?? "0");
    treasuryDelta += after - before;
  }

  if (treasuryDelta < expected) {
    // fallback to instruction parse
    if (transferred < expected) {
      return {
        ok: false,
        reason: `Treasury received ${treasuryDelta}, expected ≥ ${expected}`,
      };
    }
  }

  if (params.expectedFrom && fromOwner && fromOwner !== params.expectedFrom) {
    if (feePayer !== params.expectedFrom && fromOwner !== params.expectedFrom) {
      return { ok: false, reason: "Spender wallet mismatch" };
    }
  }

  if (params.memoIncludes) {
    const logs = (tx.meta?.logMessages ?? []).join("\n");
    const serialized = JSON.stringify(tx.transaction.message);
    const hit =
      logs.includes(params.memoIncludes) ||
      serialized.includes(params.memoIncludes);
    if (!hit) {
      return {
        ok: false,
        reason: `Memo tag missing (expected ${params.memoIncludes})`,
      };
    }
  }

  return {
    ok: true,
    signature: params.signature,
    from: params.expectedFrom,
    amountAtomic: treasuryDelta >= expected ? treasuryDelta : transferred,
  };
}

export async function getTokenBalance(
  owner: PublicKey
): Promise<number> {
  const connection = await getConnection();
  const mint = mintPubkey();
  const ata = getAssociatedTokenAddressSync(mint, owner);
  try {
    const acct = await getAccount(connection, ata);
    return Number(acct.amount) / 10 ** TOKEN.decimals;
  } catch {
    return 0;
  }
}

/** Server-side payout from treasury hot wallet → winner. */
export async function payoutWinner(params: {
  winnerWallet: string;
  humanAmount: number;
  memo: string;
}): Promise<{ ok: true; signature: string } | { ok: false; reason: string }> {
  const secret = process.env.TREASURY_PRIVATE_KEY?.trim();
  if (!secret) {
    return {
      ok: false,
      reason: "TREASURY_PRIVATE_KEY not configured — stakes held in treasury",
    };
  }

  let payer: Keypair;
  try {
    payer = Keypair.fromSecretKey(bs58.decode(secret));
  } catch {
    try {
      payer = Keypair.fromSecretKey(
        Uint8Array.from(JSON.parse(secret) as number[])
      );
    } catch {
      return { ok: false, reason: "Invalid TREASURY_PRIVATE_KEY format" };
    }
  }

  if (TREASURY_WALLET && payer.publicKey.toBase58() !== TREASURY_WALLET) {
    return {
      ok: false,
      reason: "TREASURY_PRIVATE_KEY does not match NEXT_PUBLIC_TREASURY_WALLET",
    };
  }

  const connection = await getConnection();
  const mint = mintPubkey();
  const winner = new PublicKey(params.winnerWallet);
  const amount = toAtomic(params.humanAmount);

  let decimals: number = TOKEN.decimals;
  try {
    decimals = (await getMint(connection, mint)).decimals;
  } catch {
    /* default */
  }

  const fromAta = getAssociatedTokenAddressSync(mint, payer.publicKey);
  const toAta = getAssociatedTokenAddressSync(mint, winner);

  const tx = new Transaction();
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.lastValidBlockHeight = lastValidBlockHeight;
  tx.feePayer = payer.publicKey;

  try {
    await getAccount(connection, toAta);
  } catch {
    tx.add(
      createAssociatedTokenAccountInstruction(
        payer.publicKey,
        toAta,
        winner,
        mint
      )
    );
  }

  tx.add(
    createTransferCheckedInstruction(
      fromAta,
      mint,
      toAta,
      payer.publicKey,
      amount,
      decimals
    )
  );
  tx.add(createMemoInstruction(params.memo, [payer.publicKey]));

  try {
    const signature = await connection.sendTransaction(tx, [payer], {
      skipPreflight: false,
    });
    await connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      "confirmed"
    );
    return { ok: true, signature };
  } catch (e) {
    return {
      ok: false,
      reason: e instanceof Error ? e.message : "Payout failed",
    };
  }
}
