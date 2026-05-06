export type WhaleNetwork = 'ETH' | 'SOL' | 'BTC' | 'BSC' | 'ARB' | 'MANTLE' | 'ZKSYNC' | 'APTOS';

export interface WhaleAnalytics {
  winRate: number; // Percentage (0-100) based on profitable tokens vs total traded tokens
  totalPnL: number; // In USD (Realized Profit)
  totalUsdInvested: number; // Total USD invested in tokens
  recent30dPnL: number; // Simulated based on a fraction for now, as API only gives lifetime
  recent7dPnL: number; 
  profitableTokens: number;
  totalTradedTokens: number;
  totalTrades: number; // count_of_trades
}

export interface WhaleProfile {
  id: string; // Internal ID
  address: string; // Blockchain address
  network: WhaleNetwork;
  tags: string[]; // e.g., ['Sniper', 'Smart Money', 'Airdrop Hunter']
  lastActive: string; // ISO Date string
  balanceUsd: number; // Estimated current wallet balance
  analytics: WhaleAnalytics;
}

export interface WhaleTransaction {
  id: string; // Tx hash
  whaleId: string;
  type: 'BUY' | 'SELL' | 'SWAP' | 'TRANSFER';
  assetIn?: string; // Token symbol
  amountIn?: number;
  assetOut?: string;
  amountOut?: number;
  valueUsd: number; // Total USD value of the transaction
  feeUsd: number;
  timestamp: string; // ISO Date string
  pnl?: number; // Estimated PnL for this specific trade if applicable
  dex?: string; // e.g., 'Uniswap', 'Raydium'
}

export interface WhaleDataResponse {
  whales: WhaleProfile[];
  totalCount: number;
  page: number;
  totalPages: number;
}
