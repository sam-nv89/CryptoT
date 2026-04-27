/**
 * In-memory data cache for exchange data.
 *
 * Stores the latest snapshot of tickers, spreads, and funding rates
 * so API routes can serve them instantly without waiting for exchange calls.
 */
import type { TickerData, SpreadEntry, FundingRateEntry } from '@/types';

interface CacheEntry<T> {
  data: T;
  updatedAt: number;
}

class DataCache {
  private tickers: CacheEntry<TickerData[]> = { data: [], updatedAt: 0 };
  private spreads: CacheEntry<SpreadEntry[]> = { data: [], updatedAt: 0 };
  private funding: CacheEntry<FundingRateEntry[]> = { data: [], updatedAt: 0 };

  // --- Tickers ---

  setTickers(data: TickerData[]): void {
    this.tickers = { data, updatedAt: Date.now() };
  }

  getTickers(): CacheEntry<TickerData[]> {
    return this.tickers;
  }

  // --- Spreads ---

  setSpreads(data: SpreadEntry[]): void {
    this.spreads = { data, updatedAt: Date.now() };
  }

  getSpreads(): CacheEntry<SpreadEntry[]> {
    return this.spreads;
  }

  // --- Funding ---

  setFunding(data: FundingRateEntry[]): void {
    this.funding = { data, updatedAt: Date.now() };
  }

  getFunding(): CacheEntry<FundingRateEntry[]> {
    return this.funding;
  }

  // --- Utils ---

  isStale(entry: CacheEntry<unknown>, maxAgeMs: number): boolean {
    return Date.now() - entry.updatedAt > maxAgeMs;
  }
}

// Singleton — survives across hot-reloads in development
const globalForCache = globalThis as unknown as { dataCache: DataCache };
export const dataCache = globalForCache.dataCache ?? new DataCache();
if (process.env.NODE_ENV !== 'production') globalForCache.dataCache = dataCache;
