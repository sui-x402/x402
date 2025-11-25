/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Transaction } from "@mysten/sui/transactions";
import { toBase64 } from "@mysten/sui/utils";
import {
  decodeTransactionFromPayload,
  getSenderFromTransaction,
  signTransactionWithSigner,
  simulateTransaction,
  signAndSimulateTransaction,
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

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should decode a valid transaction from payload", () => {
    // Arrange
    const mockTransaction = {
      getData: vi.fn().mockReturnValue({ sender: "0x123" }),
    };
    vi.mocked(Transaction.from).mockReturnValue(mockTransaction as any);

    const payload: ExactSuiPayload = {
      signature: "mockSignature",
      txData: toBase64(new Uint8Array([1, 2, 3, 4])),
    };

    // Act
    const result = decodeTransactionFromPayload(payload);

    // Assert
    expect(Transaction.from).toHaveBeenCalled();
    expect(result).toBe(mockTransaction);
  });

  it("should throw an error for invalid transaction data", () => {
    // Arrange
    vi.mocked(Transaction.from).mockImplementation(() => {
      throw new Error("Invalid transaction");
    });

    const payload: ExactSuiPayload = {
      signature: "mockSignature",
      txData: "invalid_base64",
    };

    // Act & Assert
    expect(() => decodeTransactionFromPayload(payload)).toThrow(
      "invalid_exact_sui_payload_transaction",
    );
  });
});

describe("getSenderFromTransaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should extract sender address from transaction", () => {
    // Arrange
    const mockTransaction = {
      getData: vi.fn().mockReturnValue({
        sender: "0x1234567890abcdef",
      }),
    } as any;

    // Act
    const result = getSenderFromTransaction(mockTransaction);

    // Assert
    expect(result).toBe("0x1234567890abcdef");
    expect(mockTransaction.getData).toHaveBeenCalled();
  });

  it("should return empty string when sender is missing", () => {
    // Arrange
    const mockTransaction = {
      getData: vi.fn().mockReturnValue({}),
    } as any;

    // Act
    const result = getSenderFromTransaction(mockTransaction);

    // Assert
    expect(result).toBe("");
  });

  it("should return empty string on error", () => {
    // Arrange
    const mockTransaction = {
      getData: vi.fn().mockImplementation(() => {
        throw new Error("Failed to get data");
      }),
    } as any;

    // Act
    const result = getSenderFromTransaction(mockTransaction);

    // Assert
    expect(result).toBe("");
  });
});

describe("signTransactionWithSigner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should sign transaction with SuiAbstractSigner", async () => {
    // Arrange
    const mockSigner = {
      signTransaction: vi.fn().mockResolvedValue({
        signature: "mockBase64Signature",
        bytes: "mockBase64Bytes",
      }),
    } as any;

    const mockTransaction = {
      build: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
    } as any;

    // Act
    const result = await signTransactionWithSigner(mockSigner, mockTransaction);

    // Assert
    expect(mockTransaction.build).toHaveBeenCalled();
    expect(mockSigner.signTransaction).toHaveBeenCalledWith(mockTransaction);
    expect(result).toEqual({
      signature: "mockBase64Signature",
      transactionBytes: expect.any(String),
    });
  });

  it("should sign transaction with Ed25519Keypair", async () => {
    // Arrange
    const mockSigner = {
      signMessage: vi.fn(),
      signTransaction: vi.fn().mockResolvedValue({
        signature: "mockSignature",
        bytes: "mockBytes",
      }),
    } as any;

    const mockTransaction = {
      build: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
    } as any;

    // Act
    const result = await signTransactionWithSigner(mockSigner, mockTransaction);

    // Assert
    expect(mockTransaction.build).toHaveBeenCalled();
    expect(mockSigner.signTransaction).toHaveBeenCalled();
    expect(result).toHaveProperty("signature");
    expect(result).toHaveProperty("transactionBytes");
  });

  it("should throw error when signing fails", async () => {
    // Arrange
    const mockSigner = {
      signTransaction: vi.fn().mockRejectedValue(new Error("Signing failed")),
    } as any;

    const mockTransaction = {
      build: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
    } as any;

    // Act & Assert
    await expect(signTransactionWithSigner(mockSigner, mockTransaction)).rejects.toThrow(
      "failed_to_sign_transaction",
    );
  });

  it("should throw error when signer does not support signing", async () => {
    // Arrange
    const mockSigner = {} as any;

    const mockTransaction = {
      build: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
    } as any;

    // Act & Assert
    await expect(signTransactionWithSigner(mockSigner, mockTransaction)).rejects.toThrow(
      "failed_to_sign_transaction",
    );
  });
});

describe("simulateTransaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should simulate transaction successfully", async () => {
    // Arrange
    const mockSimulateResult = {
      effects: { status: { status: "success" } },
    };

    const mockRpc = {
      dryRunTransactionBlock: vi.fn().mockResolvedValue(mockSimulateResult),
    } as any;

    const mockTransaction = {
      build: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
    } as any;

    // Act
    const result = await simulateTransaction(mockTransaction, mockRpc);

    // Assert
    expect(mockTransaction.build).toHaveBeenCalledWith({ client: mockRpc });
    expect(mockRpc.dryRunTransactionBlock).toHaveBeenCalled();
    expect(result).toEqual(mockSimulateResult);
  });

  it("should throw error when simulation fails", async () => {
    // Arrange
    const mockRpc = {
      dryRunTransactionBlock: vi.fn().mockRejectedValue(new Error("Simulation failed")),
    } as any;

    const mockTransaction = {
      build: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
    } as any;

    // Act & Assert
    await expect(simulateTransaction(mockTransaction, mockRpc)).rejects.toThrow(
      "transaction_simulation_failed",
    );
  });
});

describe("signAndSimulateTransaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should simulate and then sign transaction", async () => {
    // Arrange
    const mockSimulateResult = {
      effects: { status: { status: "success" } },
    };

    const mockRpc = {
      dryRunTransactionBlock: vi.fn().mockResolvedValue(mockSimulateResult),
    } as any;

    const mockSigner = {
      signTransaction: vi.fn().mockResolvedValue({
        signature: "mockSignature",
        bytes: "mockBytes",
      }),
    } as any;

    const mockTransaction = {
      build: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
    } as any;

    // Act
    const result = await signAndSimulateTransaction(mockSigner, mockTransaction, mockRpc);

    // Assert
    expect(mockRpc.dryRunTransactionBlock).toHaveBeenCalled();
    expect(mockSigner.signTransaction).toHaveBeenCalled();
    expect(result).toEqual({
      simulateResult: mockSimulateResult,
      signature: "mockSignature",
      transactionBytes: expect.any(String),
    });
  });

  it("should propagate simulation errors", async () => {
    // Arrange
    const mockRpc = {
      dryRunTransactionBlock: vi.fn().mockRejectedValue(new Error("RPC error")),
    } as any;

    const mockSigner = {
      signTransaction: vi.fn(),
    } as any;

    const mockTransaction = {
      build: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
    } as any;

    // Act & Assert
    await expect(signAndSimulateTransaction(mockSigner, mockTransaction, mockRpc)).rejects.toThrow(
      "transaction_simulation_failed",
    );
  });
});
