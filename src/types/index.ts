// === Exchange & Market Types ===

export type ExchangeId = 'binance' | 'bybit' | 'okx' | 'hyperliquid';

export type ExchangeType = 'cex' | 'dex';

export interface ExchangeInfo {
  id: ExchangeId;
  name: string;
  type: ExchangeType;
  logo: string;
  color: string;
  enabled: boolean;
}

export interface TickerData {
  exchange: ExchangeId;
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  volume24h: number;
  timestamp: number;
}

// === Spread Types ===

export interface SpreadEntry {
  symbol: string;
  buyExchange: ExchangeId;
  sellExchange: ExchangeId;
  buyPrice: number;
  sellPrice: number;
  spreadPercent: number;
  spreadAbsolute: number;
  volume24h: number;
  timestamp: number;
}

export interface SpreadPair {
  symbol: string;
  tickers: TickerData[];
  bestSpread: SpreadEntry | null;
  allSpreads: SpreadEntry[];
}

// === Funding Rate Types ===

export interface FundingRateEntry {
  exchange: ExchangeId;
  symbol: string;
  rate: number;
  annualizedRate: number;
  nextFundingTime: number;
  timestamp: number;
}

export interface FundingComparison {
  symbol: string;
  rates: FundingRateEntry[];
  maxRate: FundingRateEntry | null;
  minRate: FundingRateEntry | null;
  spreadPercent: number;
}

// === Alert Types ===

export type AlertType = 'spread' | 'funding' | 'whale';

export type AlertCondition = 'above' | 'below' | 'cross';

export interface AlertConfig {
  id: string;
  type: AlertType;
  symbol: string;
  condition: AlertCondition;
  threshold: number;
  exchanges?: ExchangeId[];
  enabled: boolean;
  createdAt: number;
  lastTriggered?: number;
}

export interface AlertEvent {
  id: string;
  alertId: string;
  type: AlertType;
  symbol: string;
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
}

// === Whale Types ===

export interface WhaleTransaction {
  id: string;
  hash: string;
  chain: string;
  from: string;
  to: string;
  amount: number;
  amountUsd: number;
  token: string;
  timestamp: number;
  fromLabel?: string;
  toLabel?: string;
}

// === Dashboard State ===

export interface DashboardFilters {
  symbols: string[];
  exchanges: ExchangeId[];
  minSpread: number;
  sortBy: 'spread' | 'volume' | 'symbol';
  sortOrder: 'asc' | 'desc';
}

// === API Response wrapper ===

export interface ApiResponse<T> {
  data: T;
  timestamp: number;
  cached: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: string;
}
