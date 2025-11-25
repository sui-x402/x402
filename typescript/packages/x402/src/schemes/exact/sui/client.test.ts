/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeAll, describe, expect, it, vi, beforeEach } from "vitest";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import * as suiClient from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { PaymentRequirements } from "../../../types/verify";
import * as shared from "../../../shared";
import { createPaymentHeader } from "./client";

// Mocking dependencies
vi.mock("../../../shared/sui/rpc");
vi.mock("@mysten/sui/client", async importOriginal => {
  const actual = await importOriginal<typeof suiClient>();
  return {
    ...actual,
    SuiClient: vi.fn().mockImplementation(() => ({
      getCoins: vi.fn().mockResolvedValue({ data: [] }),
    })),
    getFullnodeUrl: vi.fn().mockReturnValue("https://fullnode.testnet.sui.io:443"),
  };
});
vi.mock("@mysten/sui/transactions", async importOriginal => {
  const actual = await importOriginal<typeof Transaction>();
  return {
    ...actual,
    Transaction: vi.fn().mockImplementation(() => ({
      setSender: vi.fn(),
      setGasOwner: vi.fn(),
      gas: {},
      splitCoins: vi.fn().mockReturnValue([{}]),
      transferObjects: vi.fn(),
      object: vi.fn().mockReturnValue({}),
    })),
  };
});
vi.mock("../../../shared", async importOriginal => {
  const actual = await importOriginal<typeof shared>();
  return {
    ...actual,
    signAndSimulateTransaction: vi.fn().mockResolvedValue({
      signature: "mockSignature",
      transactionBytes: "mockTransactionBytes",
    }),
    encodeXPaymentHeader: vi.fn().mockReturnValue("encoded_payment_header"),
  };
});

describe("Sui Client", () => {
  let signer: Ed25519Keypair;
  let paymentRequirements: PaymentRequirements;

  beforeAll(() => {
    signer = new Ed25519Keypair();
    const payToAddress = new Ed25519Keypair().getPublicKey().toSuiAddress();
    paymentRequirements = {
      scheme: "exact",
      network: "sui-testnet",
      payTo: payToAddress,
      asset: "0x2::sui::SUI",
      maxAmountRequired: "1000",
      resource: "https://example.com/resource",
      description: "Test Payment",
      mimeType: "application/json",
      maxTimeoutSeconds: 3600,
    };
  });

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock the signer's signTransaction method
    vi.spyOn(signer, "signTransaction" as any).mockResolvedValue({
      signature: "mockSignature",
      bytes: "mockTransactionBytes",
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("createPaymentHeader", () => {
    it("should create a payment header string", async () => {
      // Arrange
      vi.mocked(shared.encodeXPaymentHeader).mockReturnValue("encoded_header");

      // Act
      const header = await createPaymentHeader(signer, 1, paymentRequirements);

      // Assert
      expect(shared.encodeXPaymentHeader).toHaveBeenCalledOnce();
      expect(header).toBe("encoded_header");
    });

    it("should handle different x402 versions", async () => {
      // Arrange
      const encodeSpy = vi.mocked(shared.encodeXPaymentHeader).mockReturnValue("encoded_header");

      // Act
      await createPaymentHeader(signer, 2, paymentRequirements);

      // Assert
      expect(encodeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          x402Version: 2,
        }),
      );
    });

    it("should throw an error if signing fails", async () => {
      // Arrange
      vi.spyOn(signer, "signTransaction" as any).mockRejectedValue(new Error("Signing failed"));

      // Act & Assert
      await expect(createPaymentHeader(signer, 1, paymentRequirements)).rejects.toThrow(
        "Signing failed",
      );
    });

    it("should throw an error if encoding fails", async () => {
      // Arrange
      vi.mocked(shared.encodeXPaymentHeader).mockImplementation(() => {
        throw new Error("Encoding failed");
      });

      // Act & Assert
      await expect(createPaymentHeader(signer, 1, paymentRequirements)).rejects.toThrow(
        "Encoding failed",
      );
    });
  });

  describe("Asset Handling", () => {
    it("should handle SUI asset (native token)", async () => {
      // Arrange
      const suiRequirements = { ...paymentRequirements, asset: "0x2::sui::SUI" };
      const encodeSpy = vi.mocked(shared.encodeXPaymentHeader).mockReturnValue("encoded_header");

      // Act
      const header = await createPaymentHeader(signer, 1, suiRequirements);

      // Assert
      expect(header).toBe("encoded_header");
      expect(encodeSpy).toHaveBeenCalled();
    });

    it("should handle custom token asset", async () => {
      // Arrange
      const customTokenRequirements = {
        ...paymentRequirements,
        asset: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890::usdc::USDC",
      };
      // Mock the SuiClient instance and its getCoins method
      const mockSuiClientInstance = {
        getCoins: vi.fn().mockResolvedValue({
          data: [
            {
              coinObjectId: "0x1111111111111111111111111111111111111111111111111111111111111111",
              balance: "5000",
              version: "1",
              digest: "abc",
            },
          ],
        }),
      };
      vi.mocked(suiClient.SuiClient).mockImplementation(() => mockSuiClientInstance as any);
      const encodeSpy = vi.mocked(shared.encodeXPaymentHeader).mockReturnValue("encoded_header");

      // Act
      const header = await createPaymentHeader(signer, 1, customTokenRequirements);

      // Assert
      expect(header).toBe("encoded_header");
      expect(encodeSpy).toHaveBeenCalled();
    });

    it("should throw error when no coins found for custom token", async () => {
      // Arrange
      const customTokenRequirements = {
        ...paymentRequirements,
        asset: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890::usdc::USDC",
      };
      const mockSuiClientInstance = {
        getCoins: vi.fn().mockResolvedValue({ data: [] }),
      };
      vi.mocked(suiClient.SuiClient).mockImplementation(() => mockSuiClientInstance as any);

      // Act & Assert
      await expect(createPaymentHeader(signer, 1, customTokenRequirements)).rejects.toThrow(
        "No coins found for asset",
      );
    });

    it("should throw error when insufficient balance for custom token", async () => {
      // Arrange
      const customTokenRequirements = {
        ...paymentRequirements,
        maxAmountRequired: "10000",
        asset: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890::usdc::USDC",
      };
      const mockSuiClientInstance = {
        getCoins: vi.fn().mockResolvedValue({
          data: [
            {
              coinObjectId: "0x1111111111111111111111111111111111111111111111111111111111111111",
              balance: "1000",
              version: "1",
              digest: "abc",
            },
          ],
        }),
      };
      vi.mocked(suiClient.SuiClient).mockImplementation(() => mockSuiClientInstance as any);

      // Act & Assert
      await expect(createPaymentHeader(signer, 1, customTokenRequirements)).rejects.toThrow(
        "Insufficient balance",
      );
    });
  });

  describe("Custom RPC Configuration", () => {
    it("should use custom RPC URL from config for testnet", async () => {
      // Arrange
      const customRpcUrl = "https://custom-testnet.sui.io";
      const config = { suiConfig: { rpcUrl: customRpcUrl } };
      const suiClientSpy = vi.mocked(suiClient.SuiClient);
      vi.mocked(shared.encodeXPaymentHeader).mockReturnValue("encoded_header");

      // Act
      await createPaymentHeader(signer, 1, paymentRequirements, config);

      // Assert
      expect(suiClientSpy).toHaveBeenCalledWith({ url: customRpcUrl });
    });

    it("should use custom RPC URL from config for mainnet", async () => {
      // Arrange
      const customRpcUrl = "https://custom-mainnet.sui.io";
      const config = { suiConfig: { rpcUrl: customRpcUrl } };
      const mainnetRequirements = { ...paymentRequirements, network: "sui" as const };
      const suiClientSpy = vi.mocked(suiClient.SuiClient);
      vi.mocked(shared.encodeXPaymentHeader).mockReturnValue("encoded_header");

      // Act
      await createPaymentHeader(signer, 1, mainnetRequirements, config);

      // Assert
      expect(suiClientSpy).toHaveBeenCalledWith({ url: customRpcUrl });
    });

    it("should use default RPC URL for testnet when config is undefined", async () => {
      // Arrange
      const suiClientSpy = vi.mocked(suiClient.SuiClient);
      const getFullnodeUrlSpy = vi.mocked(suiClient.getFullnodeUrl);
      vi.mocked(shared.encodeXPaymentHeader).mockReturnValue("encoded_header");

      // Act
      await createPaymentHeader(signer, 1, paymentRequirements, undefined);

      // Assert
      expect(getFullnodeUrlSpy).toHaveBeenCalledWith("testnet");
      expect(suiClientSpy).toHaveBeenCalled();
    });

    it("should use default RPC URL for mainnet", async () => {
      // Arrange
      const mainnetRequirements = { ...paymentRequirements, network: "sui" as const };
      const suiClientSpy = vi.mocked(suiClient.SuiClient);
      const getFullnodeUrlSpy = vi.mocked(suiClient.getFullnodeUrl);
      vi.mocked(shared.encodeXPaymentHeader).mockReturnValue("encoded_header");

      // Act
      await createPaymentHeader(signer, 1, mainnetRequirements);

      // Assert
      expect(getFullnodeUrlSpy).toHaveBeenCalledWith("mainnet");
      expect(suiClientSpy).toHaveBeenCalled();
    });

    it("should propagate config through createPaymentHeader", async () => {
      // Arrange
      const customRpcUrl = "https://custom-testnet.sui.io";
      const config = { suiConfig: { rpcUrl: customRpcUrl } };
      const suiClientSpy = vi.mocked(suiClient.SuiClient);
      const encodeSpy = vi.mocked(shared.encodeXPaymentHeader).mockReturnValue("encoded_header");

      // Act
      await createPaymentHeader(signer, 1, paymentRequirements, config);

      // Assert
      expect(suiClientSpy).toHaveBeenCalledWith({ url: customRpcUrl });
      expect(encodeSpy).toHaveBeenCalled();
    });
  });
});
