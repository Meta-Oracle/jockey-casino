declare module "@solana/spl-token" {
  import type {
    Connection,
    PublicKey,
    Signer,
    TransactionInstruction,
  } from "@solana/web3.js";

  export const TOKEN_PROGRAM_ID: PublicKey;
  export const ASSOCIATED_TOKEN_PROGRAM_ID: PublicKey;

  export function createAssociatedTokenAccountInstruction(
    payer: PublicKey,
    associatedToken: PublicKey,
    owner: PublicKey,
    mint: PublicKey,
    tokenProgramId?: PublicKey,
    associatedTokenProgramId?: PublicKey
  ): TransactionInstruction;

  export function createTransferCheckedInstruction(
    source: PublicKey,
    mint: PublicKey,
    destination: PublicKey,
    owner: PublicKey,
    amount: bigint,
    decimals: number,
    signers?: Signer[],
    tokenProgramId?: PublicKey
  ): TransactionInstruction;

  export function getAssociatedTokenAddressSync(
    mint: PublicKey,
    owner: PublicKey,
    allowOffCurve?: boolean,
    tokenProgramId?: PublicKey,
    associatedTokenProgramId?: PublicKey
  ): PublicKey;

  export function getAccount(
    connection: Connection,
    account: PublicKey
  ): Promise<any>;

  export function getMint(
    connection: Connection,
    mint: PublicKey
  ): Promise<{ decimals: number }>;
}
