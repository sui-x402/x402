import { describe, it, expect } from "vitest";
import { X402Config, SvmConfig, SuiConfig } from "./config";

describe("X402Config Types", () => {
  describe("SvmConfig", () => {
    it("should accept valid SvmConfig with rpcUrl", () => {
      const config: SvmConfig = {
        rpcUrl: "http://localhost:8899",
      };

      expect(config.rpcUrl).toBe("http://localhost:8899");
    });

    it("should accept empty SvmConfig", () => {
      const config: SvmConfig = {};

      expect(config.rpcUrl).toBeUndefined();
    });
  });

  describe("SuiConfig", () => {
    it("should accept valid SuiConfig with rpcUrl", () => {
      const config: SuiConfig = {
        rpcUrl: "https://fullnode.mainnet.sui.io",
      };

      expect(config.rpcUrl).toBe("https://fullnode.mainnet.sui.io");
    });

    it("should accept empty SuiConfig", () => {
      const config: SuiConfig = {};

      expect(config.rpcUrl).toBeUndefined();
    });
  });

  describe("X402Config", () => {
    it("should accept valid X402Config with svmConfig", () => {
      const config: X402Config = {
        svmConfig: {
          rpcUrl: "https://api.mainnet-beta.solana.com",
        },
      };

      expect(config.svmConfig?.rpcUrl).toBe("https://api.mainnet-beta.solana.com");
    });

    it("should accept valid X402Config with suiConfig", () => {
      const config: X402Config = {
        suiConfig: {
          rpcUrl: "https://fullnode.mainnet.sui.io",
        },
      };

      expect(config.suiConfig?.rpcUrl).toBe("https://fullnode.mainnet.sui.io");
    });

    it("should accept valid X402Config with both svmConfig and suiConfig", () => {
      const config: X402Config = {
        svmConfig: {
          rpcUrl: "https://api.mainnet-beta.solana.com",
        },
        suiConfig: {
          rpcUrl: "https://fullnode.mainnet.sui.io",
        },
      };

      expect(config.svmConfig?.rpcUrl).toBe("https://api.mainnet-beta.solana.com");
      expect(config.suiConfig?.rpcUrl).toBe("https://fullnode.mainnet.sui.io");
    });

    it("should accept empty X402Config", () => {
      const config: X402Config = {};

      expect(config.svmConfig).toBeUndefined();
      expect(config.suiConfig).toBeUndefined();
    });

    it("should accept X402Config with empty svmConfig", () => {
      const config: X402Config = {
        svmConfig: {},
      };

      expect(config.svmConfig).toBeDefined();
      expect(config.svmConfig?.rpcUrl).toBeUndefined();
    });

    it("should accept X402Config with empty suiConfig", () => {
      const config: X402Config = {
        suiConfig: {},
      };

      expect(config.suiConfig).toBeDefined();
      expect(config.suiConfig?.rpcUrl).toBeUndefined();
    });

    it("should handle optional chaining correctly for svmConfig", () => {
      const config1: X402Config = {};
      const config2: X402Config = { svmConfig: {} };
      const config3: X402Config = { svmConfig: { rpcUrl: "http://localhost:8899" } };

      expect(config1.svmConfig?.rpcUrl).toBeUndefined();
      expect(config2.svmConfig?.rpcUrl).toBeUndefined();
      expect(config3.svmConfig?.rpcUrl).toBe("http://localhost:8899");
    });

    it("should handle optional chaining correctly for suiConfig", () => {
      const config1: X402Config = {};
      const config2: X402Config = { suiConfig: {} };
      const config3: X402Config = { suiConfig: { rpcUrl: "https://fullnode.mainnet.sui.io" } };

      expect(config1.suiConfig?.rpcUrl).toBeUndefined();
      expect(config2.suiConfig?.rpcUrl).toBeUndefined();
      expect(config3.suiConfig?.rpcUrl).toBe("https://fullnode.mainnet.sui.io");
    });
  });
});
