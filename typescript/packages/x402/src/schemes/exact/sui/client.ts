import { Transaction } from "@mysten/sui/transactions";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import {
  Ed25519Keypair,
  encodeXPaymentHeader,
  signAndSimulateTransaction,
  SuiAbstractSigner,
  SuiSigner,
} from "../../../shared";
import { PaymentRequirements } from "../../../types/verify";
import { X402Config } from "../../../types/config";
import { ExactSuiPayload } from "../../../shared";

/**
 * Creates a payment header for the exact Sui payment scheme.
 *
 * @param signer - The Ed25519Keypair to sign the transaction with
 * @param x402Version - The x402 protocol version
 * @param paymentRequirements - The payment requirements
 * @param config - Optional configuration
 * @returns The base64 encoded payment header
 */
export async function createPaymentHeader(
  signer: SuiSigner,
  x402Version: number,
  paymentRequirements: PaymentRequirements,
  config?: X402Config,
): Promise<string> {
  // 1. Setup RPC client
  let rpcUrl: string = getFullnodeUrl(
    paymentRequirements.network === "sui" ? "mainnet" : "testnet",
  );
  if (config?.suiConfig?.rpcUrl) {
    rpcUrl = config.suiConfig.rpcUrl;
  }
  const client = new SuiClient({ url: rpcUrl });

  // 2. Parse payment requirements
  const recipient = paymentRequirements.payTo;
  const amount = BigInt(paymentRequirements.maxAmountRequired);

  // 3. Determine sender address first (needed for fetching coins)
  let senderAddress: string;
  if ("getAddress" in signer && typeof signer.getAddress === "function") {
    senderAddress = await signer.getAddress();
  } else if ("getPublicKey" in signer) {
    senderAddress = signer.getPublicKey().toSuiAddress();
  } else {
    throw new Error("Invalid Signer: Cannot determine sender address");
  }

  // 4. Create transaction
  const tx = new Transaction();
  tx.setSender(senderAddress);

  // Set fee payer if provided
  if (paymentRequirements.extra?.feePayer) {
    tx.setGasOwner(paymentRequirements.extra.feePayer);
  }

  let coinToSplit;

  // Check if asset is SUI (default) or a specific token
  const isSui =
    !paymentRequirements.asset ||
    paymentRequirements.asset === "0x2::sui::SUI" ||
    paymentRequirements.asset ===
      "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI";

  if (isSui) {
    coinToSplit = tx.gas;
  } else {
    // Fetch coins for the specific asset
    const coins = await client.getCoins({
      owner: senderAddress,
      coinType: paymentRequirements.asset,
    });

    if (coins.data.length === 0) {
      throw new Error(`No coins found for asset ${paymentRequirements.asset}`);
    }

    // For simplicity, use the first coin that has enough balance
    // In a production app, you might want to merge coins
    const coin = coins.data.find(c => BigInt(c.balance) >= amount);
    if (!coin) {
      throw new Error(`Insufficient balance for asset ${paymentRequirements.asset}`);
    }

    coinToSplit = tx.object(coin.coinObjectId);
  }

  const [coin] = tx.splitCoins(coinToSplit, [amount]);
  tx.transferObjects([coin], recipient);

  let signature: string;
  let txBytes: string;

  if (
    "signTransaction" in signer &&
    typeof (signer as SuiAbstractSigner).signTransaction === "function"
  ) {
    const result = await (signer as SuiAbstractSigner).signTransaction(tx);
    signature = result.signature;
    txBytes = result.bytes;
  } else {
    const result = await signAndSimulateTransaction(signer as Ed25519Keypair, tx, client);
    signature = result.signature;
    txBytes = result.transactionBytes;
  }

  const payload: ExactSuiPayload = {
    signature,
    txData: txBytes,
  };

  return encodeXPaymentHeader({
    x402Version,
    scheme: "exact",
    network: paymentRequirements.network,
    payload,
  });
}
