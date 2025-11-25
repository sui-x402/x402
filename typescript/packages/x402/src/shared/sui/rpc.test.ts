import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getRpcClient,
  getRpcSubscriptions,
  createTestnetRpcClient,
  createMainnetRpcClient,
} from "./rpc";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";

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
      const result = createTestnetRpcClient();

      expect(SuiJsonRpcClient).toHaveBeenCalledWith({
        url: "https://fullnode.testnet.sui.io:443",
      });
      expect(result).toBeDefined();
    });

    it("should create testnet RPC client with custom URL when provided", () => {
      const customUrl = "http://localhost:9000";

      const result = createTestnetRpcClient(customUrl);

      expect(SuiJsonRpcClient).toHaveBeenCalledWith({
        url: customUrl,
      });
      expect(result).toBeDefined();
    });
  });

  describe("createMainnetRpcClient", () => {
    it("should create mainnet RPC client with default URL when no URL provided", () => {
      const result = createMainnetRpcClient();

      expect(SuiJsonRpcClient).toHaveBeenCalledWith({
        url: "https://fullnode.mainnet.sui.io:443",
      });
      expect(result).toBeDefined();
    });

    it("should create mainnet RPC client with custom URL when provided", () => {
      const customUrl = "https://custom-mainnet-rpc.com";

      const result = createMainnetRpcClient(customUrl);

      expect(SuiJsonRpcClient).toHaveBeenCalledWith({
        url: customUrl,
      });
      expect(result).toBeDefined();
    });
  });

  describe("getRpcClient", () => {
    it("should return testnet client for sui-testnet network", () => {
      const result = getRpcClient("sui-testnet");

      expect(SuiJsonRpcClient).toHaveBeenCalledWith({
        url: "https://fullnode.testnet.sui.io:443",
      });
      expect(result).toBeDefined();
    });

    it("should return mainnet client for sui network", () => {
      const result = getRpcClient("sui");

      expect(SuiJsonRpcClient).toHaveBeenCalledWith({
        url: "https://fullnode.mainnet.sui.io:443",
      });
      expect(result).toBeDefined();
    });

    it("should use custom URL when provided for testnet", () => {
      const customUrl = "http://localhost:9000";

      const result = getRpcClient("sui-testnet", customUrl);

      expect(SuiJsonRpcClient).toHaveBeenCalledWith({
        url: customUrl,
      });
      expect(result).toBeDefined();
    });

    it("should use custom URL when provided for mainnet", () => {
      const customUrl = "https://custom-rpc.com";

      const result = getRpcClient("sui", customUrl);

      expect(SuiJsonRpcClient).toHaveBeenCalledWith({
        url: customUrl,
      });
      expect(result).toBeDefined();
    });

    it("should throw error for invalid network", () => {
      expect(() => getRpcClient("invalid-network" as any)).toThrow("Invalid network");
    });
  });

  describe("getRpcSubscriptions", () => {
    it("should return testnet subscriptions with default URL", () => {
      const result = getRpcSubscriptions("sui-testnet");

      expect(SuiJsonRpcClient).toHaveBeenCalledWith({
        url: "wss://fullnode.testnet.sui.io:443",
      });
      expect(result).toBeDefined();
    });

    it("should return mainnet subscriptions with default URL", () => {
      const result = getRpcSubscriptions("sui");

      expect(SuiJsonRpcClient).toHaveBeenCalledWith({
        url: "wss://fullnode.mainnet.sui.io:443",
      });
      expect(result).toBeDefined();
    });

    it("should use custom URL when provided (testnet)", () => {
      const customUrl = "wss://custom-rpc.com";

      const result = getRpcSubscriptions("sui-testnet", customUrl);

      expect(SuiJsonRpcClient).toHaveBeenCalledWith({
        url: customUrl,
      });
      expect(result).toBeDefined();
    });

    it("should use custom URL when provided (mainnet)", () => {
      const customUrl = "wss://custom-rpc.com";

      const result = getRpcSubscriptions("sui", customUrl);

      expect(SuiJsonRpcClient).toHaveBeenCalledWith({
        url: customUrl,
      });
      expect(result).toBeDefined();
    });

    it("should convert HTTP to WebSocket URL for testnet", () => {
      const httpUrl = "https://custom-rpc.com";

      const result = getRpcSubscriptions("sui-testnet", httpUrl);

      expect(SuiJsonRpcClient).toHaveBeenCalledWith({
        url: "wss://custom-rpc.com",
      });
      expect(result).toBeDefined();
    });

    it("should convert HTTP to WebSocket URL for mainnet", () => {
      const httpUrl = "http://custom-rpc.com";

      const result = getRpcSubscriptions("sui", httpUrl);

      expect(SuiJsonRpcClient).toHaveBeenCalledWith({
        url: "ws://custom-rpc.com",
      });
      expect(result).toBeDefined();
    });

    it("should throw error for invalid network", () => {
      expect(() => getRpcSubscriptions("invalid-network" as any)).toThrow("Invalid network");
    });
  });
});
