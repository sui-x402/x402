/**
 * Configuration options for Solana (SVM) RPC connections.
 */
export interface SvmConfig {
  /**
   * Custom RPC URL for Solana connections.
   * If not provided, defaults to public Solana RPC endpoints based on network.
   */
  rpcUrl?: string;
}

/**
 * Configuration options for Sui RPC connections.
 */
export interface SuiConfig {
  /**
   * Custom RPC URL for Sui connections.
   * If not provided, defaults to public Sui RPC endpoints based on network.
   */
  rpcUrl?: string;
}

/**
 * Configuration options for X402 client and facilitator operations.
 */
export interface X402Config {
  /** Configuration for Solana (SVM) operations */
  svmConfig?: SvmConfig;
  /** Configuration for Sui operations */
  suiConfig?: SuiConfig;
  // Future: evmConfig?: EvmConfig for EVM-specific configurations
}
