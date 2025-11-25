import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { fromBase64, toBase64 } from "@mysten/sui/utils";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";

/**
 * Payload structure for Sui exact payment scheme
 * Matches the Rust facilitator structure with BCS TransactionData
 */
export interface ExactSuiPayload {
  signature: string; // Base64 encoded signature
  txData: string; // Base64 encoded BCS TransactionData
}

/**
 * Given an object with a base64 encoded transaction, decode the
 * base64 encoded transaction into a Sui transaction object.
 *
 * @param suiPayload - The Sui payload to decode
 * @returns The decoded transaction
 */
export function decodeTransactionFromPayload(suiPayload: ExactSuiPayload): Transaction {
  try {
    const transactionBytes = fromBase64(suiPayload.txData);
    return Transaction.from(transactionBytes);
  } catch (error) {
    console.error("error", error);
    throw new Error("invalid_exact_sui_payload_transaction");
  }
}

/**
 * Extract the sender address from a Sui transaction.
 *
 * @param transaction - The transaction to extract the sender from
 * @returns The sender address as a string
 */
export function getSenderFromTransaction(transaction: Transaction): string {
  try {
    const sender = transaction.getData().sender;
    if (!sender) {
      throw new Error("Transaction has no sender");
    }
    return sender;
  } catch (error) {
    console.error("error extracting sender", error);
    return "";
  }
}

/**
 * Sign a transaction with a keypair.
 *
 * @param signer - The Ed25519Keypair that will sign the transaction
 * @param transaction - The transaction to sign
 * @returns The signed transaction with signature
 */
export async function signTransactionWithSigner(
  signer: Ed25519Keypair,
  transaction: Transaction,
): Promise<{ signature: string; transactionBytes: string }> {
  try {
    // Build the transaction to get the bytes
    const transactionBytes = await transaction.build({
      client: undefined as any, // We'll handle this in the calling context
    });

    // Sign the transaction bytes
    const signatureResult = await signer.signTransaction(transactionBytes);

    return {
      signature: signatureResult.signature,
      transactionBytes: toBase64(transactionBytes),
    };
  } catch (error) {
    console.error("error signing transaction", error);
    throw new Error("failed_to_sign_transaction");
  }
}

/**
 * Simulate a transaction to verify it will succeed.
 *
 * @param transaction - The transaction to simulate
 * @param rpc - The RPC client to use for simulation
 * @returns The transaction simulation result
 */
export async function simulateTransaction(transaction: Transaction, rpc: SuiJsonRpcClient) {
  try {
    // Build the transaction
    const transactionBytes = await transaction.build({
      client: rpc,
    });

    // Simulate the transaction
    const simulateResult = await rpc.dryRunTransactionBlock({
      transactionBlock: toBase64(transactionBytes),
    });

    return simulateResult;
  } catch (error) {
    console.error("error simulating transaction", error);
    throw new Error("transaction_simulation_failed");
  }
}

/**
 * Sign and simulate a transaction.
 *
 * @param signer - The signer that will sign the transaction
 * @param transaction - The transaction to sign and simulate
 * @param rpc - The RPC client to use to simulate the transaction
 * @returns The transaction simulation result
 */
export async function signAndSimulateTransaction(
  signer: Ed25519Keypair,
  transaction: Transaction,
  rpc: SuiJsonRpcClient,
) {
  // First simulate the transaction to verify it will succeed
  const simulateResult = await simulateTransaction(transaction, rpc);

  // If simulation succeeded, sign the transaction
  const signed = await signTransactionWithSigner(signer, transaction);

  return {
    simulateResult,
    signature: signed.signature,
    transactionBytes: signed.transactionBytes,
  };
}

/**
 * Verify a signed transaction by checking the signature.
 *
 * @param payload - The Sui payload containing signature and transaction
 * @param expectedSigner - The expected signer's address
 * @returns True if the signature is valid
 */
export async function verifyTransactionSignature(
  payload: ExactSuiPayload,
  expectedSigner: string,
): Promise<boolean> {
  try {
    const transactionBytes = fromBase64(payload.txData);
    const signatureBytes = fromBase64(payload.signature);

    // Parse the signature to extract the public key and signature scheme
    // Sui signatures are in the format: [scheme_flag (1 byte) | signature (64 bytes) | public_key (32 bytes)]
    if (signatureBytes.length < 97) {
      console.error("Invalid signature length");
      return false;
    }

    const schemeFlag = signatureBytes[0];
    const signature = signatureBytes.slice(1, 65);
    const publicKeyBytes = signatureBytes.slice(65, 97);

    // Verify the signature scheme is Ed25519 (flag = 0x00)
    if (schemeFlag !== 0x00) {
      console.error("Unsupported signature scheme");
      return false;
    }

    // Create a keypair from the public key to verify the signature
    const publicKey = new Ed25519Keypair({
      publicKey: publicKeyBytes,
      secretKey: new Uint8Array(32),
    });
    const signerAddress = publicKey.getPublicKey().toSuiAddress();

    // Verify the signer address matches the expected signer
    if (signerAddress !== expectedSigner) {
      console.error("Signer address mismatch", { signerAddress, expectedSigner });
      return false;
    }

    // Verify the signature is valid for the transaction bytes
    const isValid = await publicKey.getPublicKey().verify(transactionBytes, signature);

    return isValid;
  } catch (error) {
    console.error("error verifying signature", error);
    return false;
  }
}

/**
 * Encode a transaction to base64 string.
 *
 * @param transaction - The transaction to encode
 * @returns Base64 encoded transaction
 */
export async function encodeTransaction(
  transaction: Transaction,
  rpc: SuiJsonRpcClient,
): Promise<string> {
  const transactionBytes = await transaction.build({
    client: rpc,
  });
  return toBase64(transactionBytes);
}
