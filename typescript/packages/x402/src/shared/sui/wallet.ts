import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { Keypair } from "@mysten/sui/cryptography";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { getRpcClient } from "./rpc";
import { Network, SupportedSUINetworks } from "../../types/shared";
export type { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

export interface SuiAbstractSigner {
  getAddress(): Promise<string> | string;
  signTransaction(transaction: Transaction): Promise<{ bytes: string; signature: string }>;
}

export type SuiConnectedClient = SuiJsonRpcClient;
export type SuiSigner = Keypair | SuiAbstractSigner;
export type SuiAddress = string;

/**
 * Creates a public client configured for the specified Sui network
 *
 * @param network - The network to connect to
 * @returns A public client instance connected to the specified chain
 */
export function createSuiConnectedClient(network: string): SuiConnectedClient {
  if (!SupportedSUINetworks.find(n => n === network)) {
    throw new Error(`Unsupported Sui network: ${network}`);
  }
  return getRpcClient(network as Network);
}

/**
 * Creates a Sui signer from a private key string.
 * Supports multiple formats for better developer experience:
 * - Bech32 'suiprivkey...' (Standard Sui format)
 * - Base64 encoded secret key (32 or 64 bytes)
 * - Hex encoded secret key (32 or 64 bytes)
 *
 * @param privateKey - The private key string
 * @returns A Sui signer (Ed25519Keypair)
 */
export async function createSignerFromPrivateKey(privateKey: string): Promise<Ed25519Keypair> {
  try {
    // 1. Bech32 (Standard Sui Private Key starts with 'suiprivkey')
    if (privateKey.startsWith("suiprivkey")) {
      const { secretKey } = decodeSuiPrivateKey(privateKey);
      return Ed25519Keypair.fromSecretKey(secretKey);
    }

    // 2. Raw Secret Key (Base64 or Hex)
    // Remove '0x' prefix if present for hex strings
    const cleanKey = privateKey.startsWith("0x") ? privateKey.slice(2) : privateKey;

    // Strategy A: Try Base64 (Common for keys exported from older tools)
    try {
      const bytes = Buffer.from(cleanKey, "base64");
      // Ed25519 keys are either 32 bytes (seed) or 64 bytes (seed + pub)
      if (bytes.length === 32 || bytes.length === 64) {
        return Ed25519Keypair.fromSecretKey(bytes);
      }
    } catch {}

    // Strategy B: Try Hex
    try {
      const bytes = Buffer.from(cleanKey, "hex");
      if (bytes.length === 32 || bytes.length === 64) {
        return Ed25519Keypair.fromSecretKey(bytes);
      }
    } catch {}

    throw new Error("Invalid key format. Expected 'suiprivkey...', Base64, or Hex string.");
  } catch (error) {
    throw new Error(
      `Failed to create signer from private key: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Checks if the given wallet is a Sui Ed25519Keypair wallet.
 *
 * @param wallet - The object wallet to check.
 * @returns True if the wallet is a Sui Ed25519Keypair instance.
 */
export function isSignerWallet(wallet: unknown): wallet is SuiSigner {
  return (
    typeof wallet === "object" &&
    wallet !== null &&
    (("getPublicKey" in wallet && typeof (wallet as Keypair).getPublicKey === "function") ||
      ("signTransaction" in wallet &&
        typeof (wallet as SuiAbstractSigner).signTransaction === "function"))
  );
}
