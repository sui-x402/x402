import { describe, it, expect, vi, beforeEach } from "vitest";
import { Transaction } from "@mysten/sui/transactions";
import { toBase64 } from "@mysten/sui/utils";
import {
  decodeTransactionFromPayload,
  getSenderFromTransaction,
  signTransactionWithSigner,
  simulateTransaction,
  signAndSimulateTransaction,
  verifyTransactionSignature,
  encodeTransaction,
  type ExactSuiPayload,
} from "./transaction";

// Mock Transaction.from
vi.mock("@mysten/sui/transactions", () => ({
  Transaction: {
    from: vi.fn(),
  },
}));

describe("decodeTransactionFromPayload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should decode a valid transaction from payload", () => {
    const mockTransaction = {
      getData: vi.fn().mockReturnValue({ sender: "0x123" }),
    };
    vi.mocked(Transaction.from).mockReturnValue(mockTransaction as any);

    const payload: ExactSuiPayload = {
      signature: "mockSignature",
      txData: toBase64(new Uint8Array([1, 2, 3, 4])),
    };

    const result = decodeTransactionFromPayload(payload);

    expect(Transaction.from).toHaveBeenCalled();
    expect(result).toBe(mockTransaction);
  });

  it("should throw an error for invalid transaction data", () => {
    vi.mocked(Transaction.from).mockImplementation(() => {
      throw new Error("Invalid transaction");
    });

    const payload: ExactSuiPayload = {
      signature: "mockSignature",
      txData: "invalid_base64",
    };

    expect(() => decodeTransactionFromPayload(payload)).toThrow(
      "invalid_exact_sui_payload_transaction",
    );
  });
});

describe("getSenderFromTransaction", () => {
  it("should extract sender address from transaction", () => {
    const mockTransaction = {
      getData: vi.fn().mockReturnValue({
        sender: "0x1234567890abcdef",
      }),
    } as any;

    const result = getSenderFromTransaction(mockTransaction);

    expect(result).toBe("0x1234567890abcdef");
    expect(mockTransaction.getData).toHaveBeenCalled();
  });

  it("should return empty string when sender is missing", () => {
    const mockTransaction = {
      getData: vi.fn().mockReturnValue({}),
    } as any;

    const result = getSenderFromTransaction(mockTransaction);

    expect(result).toBe("");
  });

  it("should return empty string on error", () => {
    const mockTransaction = {
      getData: vi.fn().mockImplementation(() => {
        throw new Error("Failed to get data");
      }),
    } as any;

    const result = getSenderFromTransaction(mockTransaction);

    expect(result).toBe("");
  });
});

describe("signTransactionWithSigner", () => {
  it("should sign transaction and return signature with transaction bytes", async () => {
    const mockSigner = {
      signTransaction: vi.fn().mockResolvedValue({
        signature: "mockBase64Signature",
        bytes: new Uint8Array([5, 6, 7, 8]),
      }),
    } as any;

    const mockTransaction = {
      build: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
    } as any;

    const result = await signTransactionWithSigner(mockSigner, mockTransaction);

    expect(mockTransaction.build).toHaveBeenCalled();
    expect(mockSigner.signTransaction).toHaveBeenCalled();
    expect(result).toHaveProperty("signature");
    expect(result).toHaveProperty("transactionBytes");
    expect(result.signature).toBe("mockBase64Signature");
  });

  it("should throw error when signing fails", async () => {
    const mockSigner = {
      signTransaction: vi.fn().mockRejectedValue(new Error("Signing failed")),
    } as any;

    const mockTransaction = {
      build: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
    } as any;

    await expect(signTransactionWithSigner(mockSigner, mockTransaction)).rejects.toThrow(
      "failed_to_sign_transaction",
    );
  });
});

describe("simulateTransaction", () => {
  it("should simulate transaction successfully", async () => {
    const mockRpc = {
      dryRunTransactionBlock: vi.fn().mockResolvedValue({
        effects: { status: { status: "success" } },
      }),
    } as any;

    const mockTransaction = {
      build: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
    } as any;

    const result = await simulateTransaction(mockTransaction, mockRpc);

    expect(mockTransaction.build).toHaveBeenCalledWith({ client: mockRpc });
    expect(mockRpc.dryRunTransactionBlock).toHaveBeenCalled();
    expect(result).toHaveProperty("effects");
  });

  it("should throw error when simulation fails", async () => {
    const mockRpc = {
      dryRunTransactionBlock: vi.fn().mockRejectedValue(new Error("Simulation failed")),
    } as any;

    const mockTransaction = {
      build: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
    } as any;

    await expect(simulateTransaction(mockTransaction, mockRpc)).rejects.toThrow(
      "transaction_simulation_failed",
    );
  });
});

describe("signAndSimulateTransaction", () => {
  it("should simulate and sign transaction", async () => {
    const mockRpc = {
      dryRunTransactionBlock: vi.fn().mockResolvedValue({
        effects: { status: { status: "success" } },
      }),
    } as any;

    const mockSigner = {
      signTransaction: vi.fn().mockResolvedValue({
        signature: "mockSignature",
        bytes: new Uint8Array([5, 6, 7, 8]),
      }),
    } as any;

    const mockTransaction = {
      build: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
    } as any;

    const result = await signAndSimulateTransaction(mockSigner, mockTransaction, mockRpc);

    expect(result).toHaveProperty("simulateResult");
    expect(result).toHaveProperty("signature");
    expect(result).toHaveProperty("transactionBytes");
  });
});

describe("verifyTransactionSignature", () => {
  it("should return false for invalid signature length", async () => {
    const payload: ExactSuiPayload = {
      signature: toBase64(new Uint8Array(50)), // Too short
      txData: toBase64(new Uint8Array([1, 2, 3, 4])),
    };

    const result = await verifyTransactionSignature(payload, "0x123");

    expect(result).toBe(false);
  });

  it("should return false for unsupported signature scheme", async () => {
    const signatureBytes = new Uint8Array(97);
    signatureBytes[0] = 0x01; // Invalid scheme flag (not Ed25519)

    const payload: ExactSuiPayload = {
      signature: toBase64(signatureBytes),
      txData: toBase64(new Uint8Array([1, 2, 3, 4])),
    };

    const result = await verifyTransactionSignature(payload, "0x123");

    expect(result).toBe(false);
  });

  it("should handle verification errors gracefully", async () => {
    const payload: ExactSuiPayload = {
      signature: "invalid_base64!!!",
      txData: toBase64(new Uint8Array([1, 2, 3, 4])),
    };

    const result = await verifyTransactionSignature(payload, "0x123");

    expect(result).toBe(false);
  });
});

describe("encodeTransaction", () => {
  it("should encode transaction to base64", async () => {
    const mockRpc = {} as any;
    const mockTransaction = {
      build: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
    } as any;

    const result = await encodeTransaction(mockTransaction, mockRpc);

    expect(mockTransaction.build).toHaveBeenCalledWith({ client: mockRpc });
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("should throw error when encoding fails", async () => {
    const mockRpc = {} as any;
    const mockTransaction = {
      build: vi.fn().mockRejectedValue(new Error("Build failed")),
    } as any;

    await expect(encodeTransaction(mockTransaction, mockRpc)).rejects.toThrow("Build failed");
  });
});
