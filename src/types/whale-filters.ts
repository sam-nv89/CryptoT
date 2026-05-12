import { WhaleNetwork } from './whales';

// ─── Filter/Sort Configuration ───────────────────────────────────
export type WhaleSortKey = 'pnl' | 'winRate' | 'balance' | 'roi' | 'trades' | 'avgProfit';
export type SortOrder = 'asc' | 'desc';

export interface WalletSearchFilters {
  network?: WhaleNetwork;
  minWinRate?: number;
  maxWinRate?: number;
  minPnL?: number;
  maxPnL?: number;
  minBalance?: number;
  minTrades?: number;
  minROI?: number;
  sortBy: WhaleSortKey;
  sortOrder: SortOrder;
  page: number;
  limit: number;
}

// ─── Quick Filter Presets ────────────────────────────────────────
export interface FilterPreset {
  id: string;
  label: string;
  icon: string;
  filters: Partial<WalletSearchFilters>;
}

export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'top-winners',
    label: 'Top Winners',
    icon: '🏆',
    filters: { minWinRate: 60, minPnL: 1000, sortBy: 'pnl', sortOrder: 'desc' },
  },
  {
    id: 'high-roi',
    label: 'High ROI',
    icon: '📈',
    filters: { minROI: 50, minTrades: 10, sortBy: 'roi', sortOrder: 'desc' },
  },
  {
    id: 'active-traders',
    label: 'Active Traders',
    icon: '⚡',
    filters: { minTrades: 100, sortBy: 'trades', sortOrder: 'desc' },
  },
  {
    id: 'big-balance',
    label: 'Big Balance',
    icon: '💰',
    filters: { minBalance: 100000, sortBy: 'balance', sortOrder: 'desc' },
  },
];

// ─── Default filter state ────────────────────────────────────────
export const DEFAULT_FILTERS: WalletSearchFilters = {
  sortBy: 'pnl',
  sortOrder: 'desc',
  page: 1,
  limit: 20,
};
