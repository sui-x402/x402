import { describe, it, expect } from "vitest";
import { SuiAddressRegex, SuiFullAddressRegex } from "./regex";

describe("Sui Address Regex", () => {
  describe("SuiAddressRegex", () => {
    it("should match valid normalized Sui addresses", () => {
      const validAddresses = [
        "0x1",
        "0x2",
        "0x5",
        "0xa",
        "0xabc",
        "0x123456789abcdef",
        "0x0000000000000000000000000000000000000000000000000000000000000001",
        "0x0000000000000000000000000000000000000000000000000000000000000002",
      ];

      validAddresses.forEach(address => {
        expect(SuiAddressRegex.test(address)).toBe(true);
      });
    });

    it("should match valid full-length Sui addresses", () => {
      const validAddresses = [
        "0x" + "0".repeat(64),
        "0x" + "f".repeat(64),
        "0x" + "1234567890abcdef".repeat(4),
      ];

      validAddresses.forEach(address => {
        expect(SuiAddressRegex.test(address)).toBe(true);
      });
    });

    it("should not match invalid Sui addresses", () => {
      const invalidAddresses = [
        "", // empty
        "0x", // no hex chars
        "1234567890abcdef", // missing 0x prefix
        "0xg", // invalid hex character
        "0x" + "0".repeat(65), // too long
        "0x 1234", // contains space
        "0X1234", // uppercase X
      ];

      invalidAddresses.forEach(address => {
        expect(SuiAddressRegex.test(address)).toBe(false);
      });
    });

    it("should accept both uppercase and lowercase hex", () => {
      expect(SuiAddressRegex.test("0xABCDEF")).toBe(true);
      expect(SuiAddressRegex.test("0xabcdef")).toBe(true);
      expect(SuiAddressRegex.test("0xAbCdEf")).toBe(true);
    });
  });

  describe("SuiFullAddressRegex", () => {
    it("should match only full-length (64 hex chars) Sui addresses", () => {
      const validAddresses = [
        "0x" + "0".repeat(64),
        "0x" + "f".repeat(64),
        "0x" + "1234567890abcdef".repeat(4),
        "0x0000000000000000000000000000000000000000000000000000000000000001",
      ];

      validAddresses.forEach(address => {
        expect(SuiFullAddressRegex.test(address)).toBe(true);
      });
    });

    it("should not match normalized (short) Sui addresses", () => {
      const shortAddresses = ["0x1", "0x2", "0xabc", "0x123456789abcdef"];

      shortAddresses.forEach(address => {
        expect(SuiFullAddressRegex.test(address)).toBe(false);
      });
    });

    it("should not match addresses that are too long or too short", () => {
      const invalidAddresses = [
        "0x" + "0".repeat(63), // 63 chars (too short)
        "0x" + "0".repeat(65), // 65 chars (too long)
      ];

      invalidAddresses.forEach(address => {
        expect(SuiFullAddressRegex.test(address)).toBe(false);
      });
    });
  });
});
