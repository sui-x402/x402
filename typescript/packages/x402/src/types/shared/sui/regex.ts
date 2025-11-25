/**
 * Regular expression for validating Sui addresses
 *
 * Sui addresses are 32 bytes (64 hex characters) prefixed with '0x'
 * Format: 0x followed by 64 hexadecimal characters
 *
 * Examples:
 * - 0x0000000000000000000000000000000000000000000000000000000000000001
 * - 0x2
 * - 0x5
 *
 * Note: Sui addresses can be normalized (leading zeros removed) but the full
 * format is always 0x + 64 hex chars when fully expanded
 */
export const SuiAddressRegex = /^0x[a-fA-F0-9]{1,64}$/;

/**
 * Regular expression for validating full-length Sui addresses (64 hex chars)
 * This is the canonical format for Sui addresses
 */
export const SuiFullAddressRegex = /^0x[a-fA-F0-9]{64}$/;
