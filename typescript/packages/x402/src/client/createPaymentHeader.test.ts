import { describe, it, expect, vi, beforeAll } from "vitest";
import { generateKeyPairSigner, type TransactionSigner } from "@solana/kit";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { createPaymentHeader } from "./createPaymentHeader";
import { PaymentRequirements } from "../types/verify";
import * as exactSvmClient from "../schemes/exact/svm/client";
import * as exactSuiClient from "../schemes/exact/sui/client";

vi.mock("../schemes/exact/svm/client", () => ({
  createPaymentHeader: vi.fn(),
}));

vi.mock("../schemes/exact/sui/client", () => ({
  createPaymentHeader: vi.fn(),
}));

describe("createPaymentHeader", () => {
  let svmSigner: TransactionSigner;
  let paymentRequirements: PaymentRequirements;

  let suiSigner: Ed25519Keypair;
  let paymentRequirementsSui: PaymentRequirements;

  beforeAll(async () => {
    svmSigner = await generateKeyPairSigner();
    suiSigner = new Ed25519Keypair();
    const payToAddress = (await generateKeyPairSigner()).address;
    const assetAddress = (await generateKeyPairSigner()).address;

    paymentRequirements = {
      scheme: "exact",
      network: "solana-devnet",
      payTo: payToAddress,
      asset: assetAddress,
      maxAmountRequired: "1000",
      resource: "http://example.com/resource",
      description: "Test description",
      mimeType: "text/plain",
      maxTimeoutSeconds: 60,
      extra: {
        feePayer: svmSigner.address,
      },
    };

    paymentRequirementsSui = {
      scheme: "exact",
      network: "sui-testnet",
      payTo: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      asset: "0x2::sui::SUI",
      maxAmountRequired: "1000",
      resource: "http://example.com/resource",
      description: "Test description",
      mimeType: "text/plain",
      maxTimeoutSeconds: 60,
    };
  });

  describe("Custom RPC Configuration", () => {
    it("should propagate config to exact SVM client", async () => {
      // Arrange
      const customRpcUrl = "http://localhost:8899";
      const config = { svmConfig: { rpcUrl: customRpcUrl } };
      vi.mocked(exactSvmClient.createPaymentHeader).mockResolvedValue("mock_payment_header");

      // Act
      await createPaymentHeader(svmSigner, 1, paymentRequirements, config);

      // Assert
      expect(exactSvmClient.createPaymentHeader).toHaveBeenCalledWith(
        svmSigner,
        1,
        paymentRequirements,
        config,
      );
    });

    it("should call exact SVM client without config when not provided", async () => {
      // Arrange
      vi.mocked(exactSvmClient.createPaymentHeader).mockResolvedValue("mock_payment_header");

      // Act
      await createPaymentHeader(svmSigner, 1, paymentRequirements);

      // Assert
      expect(exactSvmClient.createPaymentHeader).toHaveBeenCalledWith(
        svmSigner,
        1,
        paymentRequirements,
        undefined,
      );
    });

    it("should call exact SVM client with empty config object", async () => {
      // Arrange
      const config = {};
      vi.mocked(exactSvmClient.createPaymentHeader).mockResolvedValue("mock_payment_header");

      // Act
      await createPaymentHeader(svmSigner, 1, paymentRequirements, config);

      // Assert
      expect(exactSvmClient.createPaymentHeader).toHaveBeenCalledWith(
        svmSigner,
        1,
        paymentRequirements,
        config,
      );
    });
  });

  describe("Sui Network Support", () => {
    it("should propagate config to exact Sui client", async () => {
      // Arrange
      const customRpcUrl = "https://fullnode.testnet.sui.io:443";
      const config = { suiConfig: { rpcUrl: customRpcUrl } };
      vi.mocked(exactSuiClient.createPaymentHeader).mockResolvedValue("mock_sui_payment_header");

      // Act
      await createPaymentHeader(suiSigner, 1, paymentRequirementsSui, config);

      // Assert
      expect(exactSuiClient.createPaymentHeader).toHaveBeenCalledWith(
        suiSigner,
        1,
        paymentRequirementsSui,
        config,
      );
    });

    it("should call exact Sui client without config when not provided", async () => {
      // Arrange
      vi.mocked(exactSuiClient.createPaymentHeader).mockResolvedValue("mock_sui_payment_header");

      // Act
      await createPaymentHeader(suiSigner, 1, paymentRequirementsSui);

      // Assert
      expect(exactSuiClient.createPaymentHeader).toHaveBeenCalledWith(
        suiSigner,
        1,
        paymentRequirementsSui,
        undefined,
      );
    });

    it("should call exact Sui client with empty config object", async () => {
      // Arrange
      const config = {};
      vi.mocked(exactSuiClient.createPaymentHeader).mockResolvedValue("mock_sui_payment_header");

      // Act
      await createPaymentHeader(suiSigner, 1, paymentRequirementsSui, config);

      // Assert
      expect(exactSuiClient.createPaymentHeader).toHaveBeenCalledWith(
        suiSigner,
        1,
        paymentRequirementsSui,
        config,
      );
    });
  });
});
