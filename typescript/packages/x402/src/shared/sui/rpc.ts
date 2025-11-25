import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { Network } from "../../types";

/**
 * Default public RPC endpoint for Sui testnet
 */
const TESTNET_RPC_URL = "https://fullnode.testnet.sui.io:443";

/**
 * Default public RPC endpoint for Sui mainnet
 */
const MAINNET_RPC_URL = "https://fullnode.mainnet.sui.io:443";

/**
 * Default public WebSocket endpoint for Sui testnet
 */
const TESTNET_WS_URL = "wss://fullnode.testnet.sui.io:443";

/**
 * Default public WebSocket endpoint for Sui mainnet
 */
const MAINNET_WS_URL = "wss://fullnode.mainnet.sui.io:443";

/**
 * Creates a Sui RPC client for the testnet network.
 *
 * @param url - Optional URL of the testnet network.
 * @returns A Sui RPC client.
 */
export function createTestnetRpcClient(url?: string): SuiJsonRpcClient {
  return new SuiJsonRpcClient({
    url: url ? url : TESTNET_RPC_URL,
  });
}

/**
 * Creates a Sui RPC client for the mainnet network.
 *
 * @param url - Optional URL of the mainnet network.
 * @returns A Sui RPC client.
 */
export function createMainnetRpcClient(url?: string): SuiJsonRpcClient {
  return new SuiJsonRpcClient({
    url: url ? url : MAINNET_RPC_URL,
  });
}

/**
 * Gets the RPC client for the given network.
 *
 * @param network - The network to get the RPC client for
 * @param url - Optional URL of the network. If not provided, the default URL will be used.
 * @returns The RPC client for the given network
 */
export function getRpcClient(network: Network, url?: string): SuiJsonRpcClient {
  // TODO: should the networks be replaced with enum references?
  if (network === "sui-testnet") {
    return createTestnetRpcClient(url);
  } else if (network === "sui") {
    return createMainnetRpcClient(url);
  } else {
    throw new Error("Invalid network");
  }
}

/**
 * Gets the RPC subscriptions for the given network.
 *
 * @param network - The network to get the RPC subscriptions for
 * @param url - Optional URL of the network. If not provided, the default URL will be used.
 * @returns The RPC subscriptions for the given network
 */
export function getRpcSubscriptions(network: Network, url?: string): SuiJsonRpcClient {
  // TODO: should the networks be replaced with enum references?
  if (network === "sui-testnet") {
    return new SuiJsonRpcClient({
      url: url ? httpToWs(url) : TESTNET_WS_URL,
    });
  } else if (network === "sui") {
    return new SuiJsonRpcClient({
      url: url ? httpToWs(url) : MAINNET_WS_URL,
    });
  } else {
    throw new Error("Invalid network");
  }
}

/**
 *
 * Converts an HTTP URL to a WebSocket URL
 *
 * @param url - The URL to convert to a WebSocket URL
 * @returns The WebSocket URL
 */
function httpToWs(url: string): string {
  if (url.startsWith("http")) {
    return url.replace("http", "ws");
  }
  return url;
}
