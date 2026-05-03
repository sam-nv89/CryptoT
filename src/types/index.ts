// === Exchange & Market Types ===

export type ExchangeId =
  | 'binance' | 'bybit' | 'okx' | 'gate' | 'bitget'
  | 'kucoin' | 'mexc' | 'htx' | 'phemex' | 'bingx' | 'coinex'
  | 'hyperliquid' | 'dydx' | 'apex' | 'poloniex' | 'xt' | 'bitmart' | 'ascendex';

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
  bidVolume: number;
  askVolume: number;
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
  buyVolume: number;
  sellVolume: number;
  maxQuantity: number;
  estimatedProfit: number;
  timestamp: number;
}

export interface NetworkInfo {
  network: string;
  depositEnable: boolean;
  withdrawEnable: boolean;
  withdrawFee: number;
}

export interface SpotSpreadEntry extends SpreadEntry {
  withdrawNetwork?: string;
  depositNetwork?: string;
  withdrawFeeUsd: number;
  netProfit: number; // estimatedProfit - withdrawFeeUsd - tradingFees
}

export interface SpreadPair {
  symbol: string;
  tickers: TickerData[];
  bestSpread: SpreadEntry | null;
  allSpreads: SpreadEntry[];
}

// === Spread Table Controls ===

export type SpreadSortKey =
  | 'spreadPercent'
  | 'spreadAbsolute'
  | 'symbol'
  | 'volume24h'
  | 'buyExchange'
  | 'sellExchange'
  | 'buyPrice'
  | 'sellPrice';

export type SortDirection = 'asc' | 'desc';

export interface SpreadSortConfig {
  key: SpreadSortKey;
  direction: SortDirection;
}

export interface SpreadFilterConfig {
  /** Free-text symbol search (e.g. "BTC", "SOL") */
  search: string;
  /** Show only spreads involving these exchanges (empty = all) */
  exchanges: ExchangeId[];
  /** Minimum spread % threshold */
  minSpreadPercent: number;
  /** Minimum 24h volume (USD) */
  minVolume: number;
  /** Maximum number of rows to display */
  pageSize: number;
}

export const DEFAULT_SPREAD_FILTERS: SpreadFilterConfig = {
  search: '',
  exchanges: [],
  minSpreadPercent: 0,
  minVolume: 0,
  pageSize: 50,
};

// === Refresh Control ===

export type RefreshIntervalOption = 5 | 10 | 15 | 30 | 60;

export interface RefreshConfig {
  /** Auto-refresh enabled */
  autoRefresh: boolean;
  /** Interval in seconds */
  intervalSeconds: RefreshIntervalOption;
}

// === Funding Rate Types ===

export interface FundingRateEntry {
  exchange: ExchangeId;
  symbol: string;
  rate: number;
  annualizedRate: number;
  nextFundingTime: number;
  timestamp: number;
  price?: number;
  volume24h?: number;
  nextRate?: number;
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

// === Dashboard State (legacy — kept for compat) ===

export interface DashboardFilters {
  symbols: string[];
  exchanges: ExchangeId[];
  minSpread: number;
  sortBy: 'spread' | 'volume' | 'symbol';
  sortOrder: 'asc' | 'desc';
}

// === API Response wrapper ===

// === Futures Arbitrage Report (Export) ===

export interface ExchangePositionReport {
  exchange: ExchangeId;
  fundingRate: number;
  fundingForecast?: number;
  url: string;
  nextFundingTime: number;
  ask: number;
  bid: number;
  takerFee: number;
  volume24h: number;
  timeframe: string;
}

export interface FuturesArbitrageReport {
  symbol: string;
  shortPosition: ExchangePositionReport;
  longPosition: ExchangePositionReport;
  avgTakerFee: number;
  entrySpread: number;
  exitSpread: number;
  fundingDiff: number;
  timestamp: number;
}

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

