export type WhaleNetwork = 'ETH' | 'SOL' | 'BTC' | 'BSC' | 'ARB' | 'MANTLE' | 'ZKSYNC' | 'APTOS';

export interface WhaleAnalytics {
  winRate: number; // Percentage (0-100)
  riskRewardRatio: number; // e.g., 2.5
  totalPnL: number; // In USD
  recent30dPnL: number; // In USD
  recent7dPnL: number; // In USD
  averageHoldTimeDays: number;
  tradingExperienceDays: number;
  totalTrades: number;
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
