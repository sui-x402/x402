/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getRpcClient,
  getRpcSubscriptions,
  createTestnetRpcClient,
  createMainnetRpcClient,
} from "./rpc";
import * as suiJsonRpc from "@mysten/sui/jsonRpc";

// Mock the SuiJsonRpcClient
vi.mock("@mysten/sui/jsonRpc", () => ({
  SuiJsonRpcClient: vi.fn().mockImplementation((config: any) => ({
    config,
    url: config.url,
  })),
}));

describe("RPC Helper Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createTestnetRpcClient", () => {
    it("should create testnet RPC client with default URL when no URL provided", () => {
      // Arrange
      const mockRpcClient = { config: { url: "https://fullnode.testnet.sui.io:443" } };
      vi.mocked(suiJsonRpc.SuiJsonRpcClient).mockReturnValue(mockRpcClient as any);

      // Act
      const result = createTestnetRpcClient();

      // Assert
      expect(suiJsonRpc.SuiJsonRpcClient).toHaveBeenCalledWith({
        url: "https://fullnode.testnet.sui.io:443",
      });
      expect(result).toBe(mockRpcClient);
    });

    it("should create testnet RPC client with custom URL when provided", () => {
      // Arrange
      const customUrl = "http://localhost:9000";
      const mockRpcClient = { config: { url: customUrl } };
      vi.mocked(suiJsonRpc.SuiJsonRpcClient).mockReturnValue(mockRpcClient as any);

      // Act
      const result = createTestnetRpcClient(customUrl);

      // Assert
      expect(suiJsonRpc.SuiJsonRpcClient).toHaveBeenCalledWith({
        url: customUrl,
      });
      expect(result).toBe(mockRpcClient);
    });
  });

  describe("createMainnetRpcClient", () => {
    it("should create mainnet RPC client with default URL when no URL provided", () => {
      // Arrange
      const mockRpcClient = { config: { url: "https://fullnode.mainnet.sui.io:443" } };
      vi.mocked(suiJsonRpc.SuiJsonRpcClient).mockReturnValue(mockRpcClient as any);

      // Act
      const result = createMainnetRpcClient();

      // Assert
      expect(suiJsonRpc.SuiJsonRpcClient).toHaveBeenCalledWith({
        url: "https://fullnode.mainnet.sui.io:443",
      });
      expect(result).toBe(mockRpcClient);
    });

    it("should create mainnet RPC client with custom URL when provided", () => {
      // Arrange
      const customUrl = "https://custom-mainnet-rpc.com";
      const mockRpcClient = { config: { url: customUrl } };
      vi.mocked(suiJsonRpc.SuiJsonRpcClient).mockReturnValue(mockRpcClient as any);

      // Act
      const result = createMainnetRpcClient(customUrl);

      // Assert
      expect(suiJsonRpc.SuiJsonRpcClient).toHaveBeenCalledWith({
        url: customUrl,
      });
      expect(result).toBe(mockRpcClient);
    });
  });

  describe("getRpcClient", () => {
    it("should return testnet client for sui-testnet network", () => {
      // Arrange
      const mockRpcClient = { config: { url: "https://fullnode.testnet.sui.io:443" } };
      vi.mocked(suiJsonRpc.SuiJsonRpcClient).mockReturnValue(mockRpcClient as any);

      // Act
      const result = getRpcClient("sui-testnet");

      // Assert
      expect(suiJsonRpc.SuiJsonRpcClient).toHaveBeenCalledWith({
        url: "https://fullnode.testnet.sui.io:443",
      });
      expect(result).toBe(mockRpcClient);
    });

    it("should return mainnet client for sui network", () => {
      // Arrange
      const mockRpcClient = { config: { url: "https://fullnode.mainnet.sui.io:443" } };
      vi.mocked(suiJsonRpc.SuiJsonRpcClient).mockReturnValue(mockRpcClient as any);

      // Act
      const result = getRpcClient("sui");

      // Assert
      expect(suiJsonRpc.SuiJsonRpcClient).toHaveBeenCalledWith({
        url: "https://fullnode.mainnet.sui.io:443",
      });
      expect(result).toBe(mockRpcClient);
    });

    it("should use custom URL when provided for testnet", () => {
      // Arrange
      const customUrl = "http://localhost:9000";
      const mockRpcClient = { config: { url: customUrl } };
      vi.mocked(suiJsonRpc.SuiJsonRpcClient).mockReturnValue(mockRpcClient as any);

      // Act
      const result = getRpcClient("sui-testnet", customUrl);

      // Assert
      expect(suiJsonRpc.SuiJsonRpcClient).toHaveBeenCalledWith({
        url: customUrl,
      });
      expect(result).toBe(mockRpcClient);
    });

    it("should use custom URL when provided for mainnet", () => {
      // Arrange
      const customUrl = "https://custom-rpc.com";
      const mockRpcClient = { config: { url: customUrl } };
      vi.mocked(suiJsonRpc.SuiJsonRpcClient).mockReturnValue(mockRpcClient as any);

      // Act
      const result = getRpcClient("sui", customUrl);

      // Assert
      expect(suiJsonRpc.SuiJsonRpcClient).toHaveBeenCalledWith({
        url: customUrl,
      });
      expect(result).toBe(mockRpcClient);
    });

    it("should throw error for invalid network", () => {
      // Arrange & Act & Assert
      expect(() => getRpcClient("invalid-network" as any)).toThrow("Invalid network");
    });
  });

  describe("getRpcSubscriptions", () => {
    it("should return testnet subscriptions with default URL", () => {
      // Arrange
      const mockSubscriptions = { config: { url: "wss://fullnode.testnet.sui.io:443" } };
      vi.mocked(suiJsonRpc.SuiJsonRpcClient).mockReturnValue(mockSubscriptions as any);

      // Act
      const result = getRpcSubscriptions("sui-testnet");

      // Assert
      expect(suiJsonRpc.SuiJsonRpcClient).toHaveBeenCalledWith({
        url: "wss://fullnode.testnet.sui.io:443",
      });
      expect(result).toBe(mockSubscriptions);
    });

    it("should return mainnet subscriptions with default URL", () => {
      // Arrange
      const mockSubscriptions = { config: { url: "wss://fullnode.mainnet.sui.io:443" } };
      vi.mocked(suiJsonRpc.SuiJsonRpcClient).mockReturnValue(mockSubscriptions as any);

      // Act
      const result = getRpcSubscriptions("sui");

      // Assert
      expect(suiJsonRpc.SuiJsonRpcClient).toHaveBeenCalledWith({
        url: "wss://fullnode.mainnet.sui.io:443",
      });
      expect(result).toBe(mockSubscriptions);
    });

    it("should use custom URL when provided for testnet", () => {
      // Arrange
      const customUrl = "wss://custom-rpc.com";
      const mockSubscriptions = { config: { url: customUrl } };
      vi.mocked(suiJsonRpc.SuiJsonRpcClient).mockReturnValue(mockSubscriptions as any);

      // Act
      const result = getRpcSubscriptions("sui-testnet", customUrl);

      // Assert
      expect(suiJsonRpc.SuiJsonRpcClient).toHaveBeenCalledWith({
        url: customUrl,
      });
      expect(result).toBe(mockSubscriptions);
    });

    it("should use custom URL when provided for mainnet", () => {
      // Arrange
      const customUrl = "wss://custom-rpc.com";
      const mockSubscriptions = { config: { url: customUrl } };
      vi.mocked(suiJsonRpc.SuiJsonRpcClient).mockReturnValue(mockSubscriptions as any);

      // Act
      const result = getRpcSubscriptions("sui", customUrl);

      // Assert
      expect(suiJsonRpc.SuiJsonRpcClient).toHaveBeenCalledWith({
        url: customUrl,
      });
      expect(result).toBe(mockSubscriptions);
    });

    it("should convert HTTP to WebSocket URL for testnet", () => {
      // Arrange
      const httpUrl = "https://custom-rpc.com";
      const mockSubscriptions = { config: { url: "wss://custom-rpc.com" } };
      vi.mocked(suiJsonRpc.SuiJsonRpcClient).mockReturnValue(mockSubscriptions as any);

      // Act
      const result = getRpcSubscriptions("sui-testnet", httpUrl);

      // Assert
      expect(suiJsonRpc.SuiJsonRpcClient).toHaveBeenCalledWith({
        url: "wss://custom-rpc.com",
      });
      expect(result).toBe(mockSubscriptions);
    });

    it("should convert HTTP to WebSocket URL for mainnet", () => {
      // Arrange
      const httpUrl = "http://custom-rpc.com";
      const mockSubscriptions = { config: { url: "ws://custom-rpc.com" } };
      vi.mocked(suiJsonRpc.SuiJsonRpcClient).mockReturnValue(mockSubscriptions as any);

      // Act
      const result = getRpcSubscriptions("sui", httpUrl);

      // Assert
      expect(suiJsonRpc.SuiJsonRpcClient).toHaveBeenCalledWith({
        url: "ws://custom-rpc.com",
      });
      expect(result).toBe(mockSubscriptions);
    });

    it("should throw error for invalid network", () => {
      // Arrange & Act & Assert
      expect(() => getRpcSubscriptions("invalid-network" as any)).toThrow("Invalid network");
    });
  });
});
