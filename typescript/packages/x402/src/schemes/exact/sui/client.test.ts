import { describe, it, expect, vi } from "vitest";
import { createPaymentHeader } from "./client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { PaymentRequirements } from "../../../types/verify";
import { SuiClient } from "@mysten/sui/client";

// Mock SuiClient
vi.mock("@mysten/sui/client", () => {
  return {
    SuiClient: vi.fn().mockImplementation(() => ({
      dryRunTransactionBlock: vi.fn().mockResolvedValue({
        effects: {
          status: { status: "success" },
        },
      }),
    })),
    getFullnodeUrl: vi.fn().mockReturnValue("https://fullnode.testnet.sui.io:443"),
  };
});

// Mock shared functions
vi.mock("../../../shared", async () => {
  const actual = await vi.importActual("../../../shared");
  return {
    ...actual,
    signAndSimulateTransaction: vi.fn().mockResolvedValue({
      signature: "mockSignature",
      transactionBytes: "mockTransactionBytes",
    }),
  };
});

describe("createPaymentHeader (Sui)", () => {
  it("should create a valid payment header", async () => {
    const keypair = new Ed25519Keypair();
    const paymentRequirements: PaymentRequirements = {
      scheme: "exact",
      network: "sui-testnet",
      payTo: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      maxAmountRequired: "1000",
      resource: "https://example.com/resource",
      description: "Test Payment",
      mimeType: "application/json",
      maxTimeoutSeconds: 3600,
      asset: "0x2::sui::SUI",
    };

    const header = await createPaymentHeader(keypair, 1, paymentRequirements);

    expect(header).toBeDefined();
    expect(typeof header).toBe("string");

    // Decode and verify structure
    const decoded = JSON.parse(Buffer.from(header, "base64").toString());
    expect(decoded.x402Version).toBe(1);
    expect(decoded.scheme).toBe("exact");
    expect(decoded.network).toBe("sui-testnet");
    expect(decoded.payload.signature).toBe("mockSignature");
    expect(decoded.payload.txData).toBe("mockTransactionBytes");
  });
});
