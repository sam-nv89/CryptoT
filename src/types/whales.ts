// ─── Network Types ───────────────────────────────────────────────
export type WhaleNetwork = 'ETH' | 'SOL' | 'BTC' | 'BSC' | 'ARB' | 'MANTLE' | 'ZKSYNC' | 'APTOS';

// ─── Core Analytics ──────────────────────────────────────────────
export interface WhaleAnalytics {
  winRate: number;            // 0-100 — Profitable Tokens / Total Traded Tokens
  totalPnL: number;           // Realized Profit USD (lifetime)
  totalUsdInvested: number;   // Total USD bought into tokens
  totalSoldUsd: number;       // Total USD received from selling
  roi: number;                // (totalPnL / totalUsdInvested) * 100 — Return on Investment %
  profitableTokens: number;
  totalTradedTokens: number;
  totalTrades: number;        // Aggregate count_of_trades
  avgProfitPerToken: number;  // totalPnL / totalTradedTokens
  // Real temporal PnL — null when API doesn't support the timeframe
  pnl7d: number | null;
  pnl30d: number | null;
}

// ─── Wallet Profile ──────────────────────────────────────────────
export interface WhaleProfile {
  id: string;
  address: string;
  network: WhaleNetwork;
  tags: string[];
  lastActive: string;         // ISO Date
  balanceUsd: number;
  tokenCount: number;         // Number of unique tokens currently held
  analytics: WhaleAnalytics;
}

// ─── Token Holding (current portfolio) ───────────────────────────
export interface WalletTokenHolding {
  contractAddress: string;
  symbol: string;
  name: string;
  logo: string | null;
  balance: number;
  balanceUsd: number;
  priceUsd: number;
  priceChange24h: number;
  portfolioPercentage: number;
  isSpam: boolean;
}

// ─── Per-Token PnL Entry ─────────────────────────────────────────
export interface TokenPnLEntry {
  contractAddress: string;
  symbol: string;
  name: string;
  logo: string | null;
  avgBuyPriceUsd: number;
  avgSellPriceUsd: number;
  totalBoughtUsd: number;
  totalSoldUsd: number;
  realizedProfitUsd: number;
  realizedProfitPct: number;
  countOfTrades: number;
  isCurrentlyHeld: boolean;
}

// ─── Transaction ─────────────────────────────────────────────────
export interface WhaleTransaction {
  id: string;
  whaleId: string;
  type: 'BUY' | 'SELL' | 'SWAP' | 'TRANSFER';
  assetIn?: string;
  amountIn?: number;
  assetOut?: string;
  amountOut?: number;
  valueUsd: number;
  feeUsd: number;
  timestamp: string;
  pnl?: number;
  dex?: string;
}

// ─── API Response ────────────────────────────────────────────────
export interface WhaleDataResponse {
  whales: WhaleProfile[];
  totalCount: number;
  page: number;
  totalPages: number;
}

export interface WalletTokensResponse {
  tokens: WalletTokenHolding[];
  totalValueUsd: number;
  tokenCount: number;
}

export interface WalletPnLResponse {
  entries: TokenPnLEntry[];
  summary: {
    totalRealizedPnL: number;
    totalInvested: number;
    totalSold: number;
    profitableCount: number;
    unprofitableCount: number;
    overallROI: number;
  };
}

// ─── Global Stats ────────────────────────────────────────────────
export interface WhaleGlobalStats {
  totalTracked: number;
  avgWinRate: number;
  avgROI: number;
  totalProfit: number;
  topNetwork: string;
}
