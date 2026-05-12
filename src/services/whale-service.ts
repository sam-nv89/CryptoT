import {
  WhaleProfile, WhaleTransaction, WhaleNetwork,
  WalletTokenHolding, TokenPnLEntry, WalletTokensResponse,
  WalletPnLResponse, WhaleGlobalStats,
} from '../types/whales';
import { WalletSearchFilters } from '../types/whale-filters';

const CACHE_TTL = { profile: 5 * 60_000, tokens: 2 * 60_000, profitability: 10 * 60_000 };

interface CacheEntry<T> { data: T; ts: number; }

// ─── Known wallets registry ─────────────────────────────────────
const ACTIVE_WHALES = [
  { address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', name: 'Vitalik Buterin', tags: ['Smart Money', 'Creator'], network: 'ETH' as WhaleNetwork, chainParam: 'eth' },
  { address: '0xAb5801a7D12705464d87B000255522c8F35a6646', name: 'Vitalik (Vb2)', tags: ['Smart Money', 'Holder'], network: 'ETH' as WhaleNetwork, chainParam: 'eth' },
  { address: '0x3DdfA8eC3052539b6C9549F12cEA2C295cfF5296', name: 'Justin Sun', tags: ['Whale', 'DEX Trader'], network: 'ETH' as WhaleNetwork, chainParam: 'eth' },
  { address: '0x6cC5F688a315f3dC28A7781717a9A73330ee0167', name: 'Wintermute', tags: ['Market Maker', 'CEX'], network: 'ETH' as WhaleNetwork, chainParam: 'eth' },
  { address: '0xf584f8728b874a6a5c7a8d4d387c9aae9172d621', name: 'Jump Trading', tags: ['Market Maker', 'Institutional'], network: 'ETH' as WhaleNetwork, chainParam: 'eth' },
  { address: '0xe8c19db00287e3536075114b2576c70773e039bd', name: 'Andrew Kang', tags: ['Smart Money', 'Trader'], network: 'ETH' as WhaleNetwork, chainParam: 'eth' },
  { address: '0x28c6c06298d514db089934071355e5743bf21d60', name: 'Binance 14', tags: ['Exchange', 'CEX'], network: 'BSC' as WhaleNetwork, chainParam: 'bsc' },
  { address: '0xd6347a3A3317A0F2418309C27c7c10A2E8B99173', name: 'GSR Markets', tags: ['Market Maker'], network: 'BSC' as WhaleNetwork, chainParam: 'bsc' },
  { address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', name: 'Vitalik (ARB)', tags: ['Smart Money', 'L2'], network: 'ARB' as WhaleNetwork, chainParam: 'arbitrum' },
  { address: '0x06959153B974D0D5fDfd87D561db6d8d4FA0bb0B', name: 'ARB Smart Whale', tags: ['Smart Money', 'Sniper'], network: 'ARB' as WhaleNetwork, chainParam: 'arbitrum' },
  { address: '0x00000000219ab540356cBB839Cbe05303d7705Fa', name: 'ETH Staking', tags: ['Protocol', 'Staking'], network: 'ETH' as WhaleNetwork, chainParam: 'eth' },
  { address: 'FWznbcNXWQuHTawe9RxvQ2LdCENssh12dsznf4RiouN5', name: 'Solana Whale', tags: ['Solana', 'Holder'], network: 'SOL' as WhaleNetwork, chainParam: 'mainnet' },
];

// ─── Deterministic seed from address string ─────────────────────
function addrSeed(addr: string): number {
  let h = 0;
  for (let i = 0; i < addr.length; i++) { h = ((h << 5) - h + addr.charCodeAt(i)) | 0; }
  return Math.abs(h);
}
function seededRand(seed: number, idx: number): number {
  const x = Math.sin(seed + idx) * 10000;
  return x - Math.floor(x);
}

// ─── Service ────────────────────────────────────────────────────
class WhaleService {
  private cache = new Map<string, CacheEntry<unknown>>();
  private get hasApiKey() { return !!process.env.MORALIS_API_KEY; }

  // ── Moralis EVM fetcher ──
  private async moralis<T>(endpoint: string, address: string, ttl = CACHE_TTL.profile): Promise<T | null> {
    const apiKey = process.env.MORALIS_API_KEY;
    if (!apiKey) return null;
    const key = `evm_${endpoint}_${address}`;
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.ts < ttl) return hit.data as T;
    try {
      const url = `https://deep-index.moralis.io/api/v2.2/${endpoint.replace('{address}', address)}`;
      const res = await fetch(url, { headers: { Accept: 'application/json', 'X-API-Key': apiKey }, next: { revalidate: 300 } });
      if (!res.ok) return null;
      const data = await res.json();
      this.cache.set(key, { data, ts: Date.now() });
      return data as T;
    } catch { return null; }
  }

  // ── Moralis Solana fetcher ──
  private async moralisSol<T>(endpoint: string, ttl = CACHE_TTL.profile): Promise<T | null> {
    const apiKey = process.env.MORALIS_API_KEY;
    if (!apiKey) return null;
    const key = `sol_${endpoint}`;
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.ts < ttl) return hit.data as T;
    try {
      const url = `https://solana-gateway.moralis.io/account/${endpoint}`;
      const res = await fetch(url, { headers: { Accept: 'application/json', 'X-API-Key': apiKey }, next: { revalidate: 300 } });
      if (!res.ok) return null;
      const data = await res.json();
      this.cache.set(key, { data, ts: Date.now() });
      return data as T;
    } catch { return null; }
  }

  private genId(addr: string, net: WhaleNetwork) { return `whale_${net.toLowerCase()}_${addr.toLowerCase()}`; }

  private chainParam(net: WhaleNetwork): string {
    const map: Record<string, string> = { ETH: 'eth', BSC: 'bsc', ARB: 'arbitrum', SOL: 'mainnet', MANTLE: 'mantle', ZKSYNC: 'zksync' };
    return map[net] || 'eth';
  }

  // ─── Parse whale def from ID ───
  private parseDef(id: string) {
    const preset = ACTIVE_WHALES.find(w => this.genId(w.address, w.network) === id);
    if (preset) return preset;
    if (!id.startsWith('whale_')) return null;
    const parts = id.split('_');
    if (parts.length < 3) return null;
    const net = parts[1].toUpperCase() as WhaleNetwork;
    const addr = parts.slice(2).join('_'); // handle addresses with underscores
    return { address: addr, network: net, name: `Wallet ${addr.substring(0, 6)}`, tags: ['Custom', 'Tracked'], chainParam: this.chainParam(net) };
  }

  // ═══════════════════════════════════════════════════════════════
  //  PUBLIC: Get wallet profile
  // ═══════════════════════════════════════════════════════════════
  public async getWhaleById(id: string, presetData?: { address: string; name: string; tags: string[]; network: WhaleNetwork; chainParam: string }): Promise<WhaleProfile | undefined> {
    const def = presetData || this.parseDef(id);
    if (!def) return undefined;

    let balanceUsd = 0, tokenCount = 0;
    let totalPnL = 0, winRate = 0, totalTrades = 0;
    let totalUsdInvested = 0, totalSoldUsd = 0;
    let profitableTokens = 0, totalTradedTokens = 0;

    if (def.network === 'SOL') {
      const portfolio = await this.moralisSol<{ nativeBalance?: { solana?: string } }>(`${def.chainParam}/${def.address}/portfolio`);
      const solBal = portfolio?.nativeBalance?.solana ? parseFloat(portfolio.nativeBalance.solana) : 0;
      balanceUsd = solBal * 150;
    } else {
      const [netWorth, profitData] = await Promise.all([
        this.moralis<{ total_networth_usd?: string }>(`wallets/{address}/net-worth?chain=${def.chainParam}&exclude_spam=true&exclude_unverified_contracts=true`, def.address),
        this.moralis<{ result?: Array<Record<string, unknown>> }>(`wallets/{address}/profitability?chain=${def.chainParam}`, def.address, CACHE_TTL.profitability),
      ]);

      balanceUsd = netWorth?.total_networth_usd ? parseFloat(netWorth.total_networth_usd as string) : 0;

      if (profitData?.result) {
        for (const token of profitData.result) {
          if (token.possible_spam === true) continue;
          const sym = (token.token_symbol as string) || '';
          if (sym.length > 20) continue;
          const profit = parseFloat((token.realized_profit_usd as string) || '0');
          const invested = parseFloat((token.total_usd_invested as string) || '0');
          const sold = parseFloat((token.total_sold_usd as string) || '0');
          const trades = parseInt((token.count_of_trades as string) || '0', 10);
          totalPnL += profit; totalUsdInvested += invested; totalSoldUsd += sold;
          totalTrades += trades; totalTradedTokens++;
          if (profit > 0) profitableTokens++;
        }
        winRate = totalTradedTokens > 0 ? (profitableTokens / totalTradedTokens) * 100 : 0;
      }

      const tokensData = await this.moralis<{ result?: unknown[] }>(`wallets/{address}/tokens?chain=${def.chainParam}&exclude_spam=true`, def.address, CACHE_TTL.tokens);
      tokenCount = tokensData?.result?.length || 0;
    }

    // ── Demo data fallback when no API key ──
    if (!this.hasApiKey) {
      const s = addrSeed(def.address);
      balanceUsd = 5000 + seededRand(s, 1) * 2_000_000;
      totalTradedTokens = 8 + Math.floor(seededRand(s, 2) * 80);
      profitableTokens = Math.floor(totalTradedTokens * (0.3 + seededRand(s, 3) * 0.5));
      winRate = (profitableTokens / totalTradedTokens) * 100;
      totalTrades = totalTradedTokens * (2 + Math.floor(seededRand(s, 4) * 8));
      totalUsdInvested = 10000 + seededRand(s, 5) * 500_000;
      totalPnL = totalUsdInvested * (-0.3 + seededRand(s, 6) * 1.5);
      totalSoldUsd = totalUsdInvested + totalPnL;
      tokenCount = 3 + Math.floor(seededRand(s, 7) * 25);
    }

    const isExchange = def.tags.includes('Exchange') || def.tags.includes('CEX');
    if (isExchange) { winRate = 0; totalPnL = 0; totalUsdInvested = 0; totalSoldUsd = 0; }

    const roi = totalUsdInvested > 0 ? (totalPnL / totalUsdInvested) * 100 : 0;
    const avgProfitPerToken = totalTradedTokens > 0 ? totalPnL / totalTradedTokens : 0;

    return {
      id: this.genId(def.address, def.network),
      address: def.address,
      network: def.network,
      tags: def.tags,
      lastActive: new Date().toISOString(),
      balanceUsd,
      tokenCount,
      analytics: {
        winRate, totalPnL, totalUsdInvested, totalSoldUsd, roi,
        profitableTokens, totalTradedTokens, totalTrades,
        avgProfitPerToken,
        pnl7d: null,  // API does not support time-range PnL on free tier
        pnl30d: null,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════
  //  PUBLIC: List whales with filters
  // ═══════════════════════════════════════════════════════════════
  public async getWhales(filters: WalletSearchFilters) {
    const filtered = filters.network
      ? ACTIVE_WHALES.filter(w => w.network === filters.network)
      : ACTIVE_WHALES;

    const raw = await Promise.all(filtered.map(w => this.getWhaleById(this.genId(w.address, w.network))));
    let profiles = raw.filter((p): p is WhaleProfile => p !== undefined);

    // Apply filters
    if (filters.minWinRate !== undefined) profiles = profiles.filter(p => p.analytics.winRate >= filters.minWinRate!);
    if (filters.maxWinRate !== undefined) profiles = profiles.filter(p => p.analytics.winRate <= filters.maxWinRate!);
    if (filters.minPnL !== undefined) profiles = profiles.filter(p => p.analytics.totalPnL >= filters.minPnL!);
    if (filters.maxPnL !== undefined) profiles = profiles.filter(p => p.analytics.totalPnL <= filters.maxPnL!);
    if (filters.minBalance !== undefined) profiles = profiles.filter(p => p.balanceUsd >= filters.minBalance!);
    if (filters.minTrades !== undefined) profiles = profiles.filter(p => p.analytics.totalTrades >= filters.minTrades!);
    if (filters.minROI !== undefined) profiles = profiles.filter(p => p.analytics.roi >= filters.minROI!);

    // Sort
    const dir = filters.sortOrder === 'asc' ? 1 : -1;
    profiles.sort((a, b) => {
      const valMap: Record<string, (p: WhaleProfile) => number> = {
        pnl: p => p.analytics.totalPnL,
        winRate: p => p.analytics.winRate,
        balance: p => p.balanceUsd,
        roi: p => p.analytics.roi,
        trades: p => p.analytics.totalTrades,
        avgProfit: p => p.analytics.avgProfitPerToken,
      };
      const fn = valMap[filters.sortBy] || valMap.pnl;
      return (fn(a) - fn(b)) * dir;
    });

    const total = profiles.length;
    const totalPages = Math.ceil(total / filters.limit);
    const paginated = profiles.slice((filters.page - 1) * filters.limit, filters.page * filters.limit);

    return { whales: paginated, totalCount: total, page: filters.page, totalPages };
  }

  // ═══════════════════════════════════════════════════════════════
  //  PUBLIC: Token holdings
  // ═══════════════════════════════════════════════════════════════
  public async getTokenHoldings(id: string): Promise<WalletTokensResponse> {
    const def = this.parseDef(id);
    if (!def) return { tokens: [], totalValueUsd: 0, tokenCount: 0 };

    // Demo fallback when no API key
    if (!this.hasApiKey) {
      const s = addrSeed(def.address);
      const demoTokens = ['WETH','USDC','USDT','LINK','UNI','AAVE','ARB','OP','MATIC','PEPE','SHIB','CRV','LDO','RPL','MKR','SNX','COMP','DYDX'];
      const count = 5 + Math.floor(seededRand(s, 10) * 13);
      let totalValue = 0;
      const holdings: WalletTokenHolding[] = [];
      for (let i = 0; i < count && i < demoTokens.length; i++) {
        const price = i < 2 ? (i === 0 ? 3200 + seededRand(s, 20+i)*200 : 1) : 0.5 + seededRand(s, 20+i) * 500;
        const bal = 10 + seededRand(s, 40+i) * 50000;
        const val = bal * price;
        const ch = -15 + seededRand(s, 60+i) * 30;
        holdings.push({ contractAddress: `0x${i.toString(16).padStart(40,'0')}`, symbol: demoTokens[i], name: demoTokens[i] + ' Token', logo: null, balance: bal, balanceUsd: val, priceUsd: price, priceChange24h: ch, portfolioPercentage: 0, isSpam: false });
        totalValue += val;
      }
      holdings.forEach(h => { h.portfolioPercentage = totalValue > 0 ? (h.balanceUsd / totalValue) * 100 : 0; });
      holdings.sort((a, b) => b.balanceUsd - a.balanceUsd);
      return { tokens: holdings, totalValueUsd: totalValue, tokenCount: holdings.length };
    }

    if (def.network === 'SOL') return { tokens: [], totalValueUsd: 0, tokenCount: 0 };

    const data = await this.moralis<{ result?: Array<Record<string, unknown>> }>(
      `wallets/{address}/tokens?chain=${def.chainParam}&exclude_spam=true&exclude_unverified_contracts=true`,
      def.address, CACHE_TTL.tokens
    );

    if (!data?.result) return { tokens: [], totalValueUsd: 0, tokenCount: 0 };

    let totalValue = 0;
    const holdings: WalletTokenHolding[] = [];

    for (const t of data.result) {
      const sym = (t.symbol as string) || '';
      if (sym.length > 20 || t.possible_spam === true) continue;

      const balance = parseFloat((t.balance_formatted as string) || '0');
      const price = parseFloat((t.usd_price as string) || '0');
      const value = balance * price;
      const change24h = parseFloat((t.usd_price_24hr_percent_change as string) || '0');

      if (value < 0.01) continue; // skip dust

      holdings.push({
        contractAddress: (t.token_address as string) || '',
        symbol: sym,
        name: (t.name as string) || sym,
        logo: (t.logo as string) || (t.thumbnail as string) || null,
        balance, balanceUsd: value, priceUsd: price,
        priceChange24h: change24h,
        portfolioPercentage: 0, // calculated below
        isSpam: false,
      });
      totalValue += value;
    }

    // Compute portfolio percentages & sort by value desc
    holdings.forEach(h => { h.portfolioPercentage = totalValue > 0 ? (h.balanceUsd / totalValue) * 100 : 0; });
    holdings.sort((a, b) => b.balanceUsd - a.balanceUsd);

    return { tokens: holdings, totalValueUsd: totalValue, tokenCount: holdings.length };
  }

  // ═══════════════════════════════════════════════════════════════
  //  PUBLIC: PnL Breakdown per token
  // ═══════════════════════════════════════════════════════════════
  public async getPnLBreakdown(id: string): Promise<WalletPnLResponse> {
    const empty: WalletPnLResponse = { entries: [], summary: { totalRealizedPnL: 0, totalInvested: 0, totalSold: 0, profitableCount: 0, unprofitableCount: 0, overallROI: 0 } };
    const def = this.parseDef(id);
    if (!def) return empty;

    // Demo fallback
    if (!this.hasApiKey) {
      const s = addrSeed(def.address);
      const symbols = ['PEPE','SHIB','ARB','OP','LINK','UNI','AAVE','CRV','LDO','MKR','SNX','COMP','DYDX','RPL'];
      const entries: TokenPnLEntry[] = [];
      let tI = 0, tS = 0, tP = 0, pC = 0, uC = 0;
      const cnt = 6 + Math.floor(seededRand(s, 80) * 8);
      for (let i = 0; i < cnt && i < symbols.length; i++) {
        const bought = 500 + seededRand(s, 100+i) * 50000;
        const profitPct = -60 + seededRand(s, 120+i) * 200;
        const profit = bought * profitPct / 100;
        const sold = bought + profit;
        const avgBuy = 0.1 + seededRand(s, 140+i) * 100;
        const avgSell = avgBuy * (1 + profitPct / 100);
        const trades = 2 + Math.floor(seededRand(s, 160+i) * 20);
        entries.push({ contractAddress: `0x${i.toString(16).padStart(40,'0')}`, symbol: symbols[i], name: symbols[i], logo: null, avgBuyPriceUsd: avgBuy, avgSellPriceUsd: Math.max(0, avgSell), totalBoughtUsd: bought, totalSoldUsd: Math.max(0, sold), realizedProfitUsd: profit, realizedProfitPct: profitPct, countOfTrades: trades, isCurrentlyHeld: seededRand(s, 180+i) > 0.5 });
        tI += bought; tS += Math.max(0, sold); tP += profit;
        if (profit > 0) pC++; else uC++;
      }
      entries.sort((a, b) => b.realizedProfitUsd - a.realizedProfitUsd);
      return { entries, summary: { totalRealizedPnL: tP, totalInvested: tI, totalSold: tS, profitableCount: pC, unprofitableCount: uC, overallROI: tI > 0 ? (tP / tI) * 100 : 0 } };
    }

    if (def.network === 'SOL') return empty;

    const data = await this.moralis<{ result?: Array<Record<string, unknown>> }>(
      `wallets/{address}/profitability?chain=${def.chainParam}`, def.address, CACHE_TTL.profitability
    );

    if (!data?.result) return empty;

    const entries: TokenPnLEntry[] = [];
    let totalInvested = 0, totalSold = 0, totalPnL = 0, profitable = 0, unprofitable = 0;

    for (const t of data.result) {
      if (t.possible_spam === true) continue;
      const sym = (t.token_symbol as string) || '';
      if (sym.length > 20) continue;

      const bought = parseFloat((t.total_usd_invested as string) || '0');
      const sold = parseFloat((t.total_sold_usd as string) || '0');
      const profit = parseFloat((t.realized_profit_usd as string) || '0');
      const profitPct = parseFloat((t.realized_profit_percentage as string) || '0');
      const trades = parseInt((t.count_of_trades as string) || '0', 10);
      const avgBuy = parseFloat((t.avg_buy_price_usd as string) || '0');
      const avgSell = parseFloat((t.avg_sell_price_usd as string) || '0');

      entries.push({
        contractAddress: (t.token_address as string) || '',
        symbol: sym,
        name: (t.token_name as string) || sym,
        logo: (t.token_logo as string) || null,
        avgBuyPriceUsd: avgBuy, avgSellPriceUsd: avgSell,
        totalBoughtUsd: bought, totalSoldUsd: sold,
        realizedProfitUsd: profit, realizedProfitPct: profitPct,
        countOfTrades: trades,
        isCurrentlyHeld: bought > sold,
      });

      totalInvested += bought;
      totalSold += sold;
      totalPnL += profit;
      if (profit > 0) profitable++; else unprofitable++;
    }

    entries.sort((a, b) => b.realizedProfitUsd - a.realizedProfitUsd);

    return {
      entries,
      summary: {
        totalRealizedPnL: totalPnL, totalInvested, totalSold,
        profitableCount: profitable, unprofitableCount: unprofitable,
        overallROI: totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════
  //  PUBLIC: Transactions
  // ═══════════════════════════════════════════════════════════════
  public async getWhaleTransactions(id: string, limit = 20): Promise<WhaleTransaction[]> {
    const def = this.parseDef(id);
    if (!def) return [];

    // Solana — no transaction analytics available on free tier
    if (def.network === 'SOL') return [];

    const data = await this.moralis<{ result?: Array<Record<string, unknown>> }>(
      `{address}/erc20/transfers?chain=${def.chainParam}&limit=${limit}`, def.address
    );
    if (!data?.result) return [];

    const STABLES = new Set(['USDC', 'USDT', 'DAI', 'USDE', 'FDUSD', 'BUSD', 'TUSD']);
    const ETH_LIKE = new Set(['ETH', 'WETH', 'STETH', 'CBETH', 'RETH']);

    return data.result
      .filter((tx) => {
        if (tx.possible_spam === true) return false;
        const sym = (tx.token_symbol as string) || '';
        return sym.length > 0 && sym.length <= 10;
      })
      .map((tx): WhaleTransaction => {
        const isIncoming = ((tx.to_address as string) || '').toLowerCase() === def.address.toLowerCase();
        const amount = Number(tx.value_decimal) || 0;
        const symbol = (tx.token_symbol as string) || 'TOKEN';

        // Price estimation: stables $1, ETH-likes $3200, others via Moralis usd_price or $1 fallback
        let price = 1;
        if (STABLES.has(symbol.toUpperCase())) price = 1;
        else if (ETH_LIKE.has(symbol.toUpperCase())) price = 3200;
        else price = 100; // rough fallback for unknowns

        return {
          id: (tx.transaction_hash as string) || '',
          whaleId: id,
          type: isIncoming ? 'BUY' : 'SELL',
          assetIn: symbol, amountIn: amount,
          assetOut: symbol, amountOut: amount,
          valueUsd: amount * price,
          feeUsd: 0,
          timestamp: (tx.block_timestamp as string) || new Date().toISOString(),
          dex: (tx.from_address_label as string) || (tx.to_address_label as string) || 'Transfer',
        };
      });
  }

  // ═══════════════════════════════════════════════════════════════
  //  PUBLIC: Global stats
  // ═══════════════════════════════════════════════════════════════
  public async getGlobalStats(): Promise<WhaleGlobalStats> {
    const profiles = await Promise.all(ACTIVE_WHALES.map(w => this.getWhaleById(this.genId(w.address, w.network))));
    const active = profiles.filter((p): p is WhaleProfile => p !== undefined);

    const n = active.length || 1;
    const avgWinRate = active.reduce((s, w) => s + w.analytics.winRate, 0) / n;
    const avgROI = active.reduce((s, w) => s + w.analytics.roi, 0) / n;
    const totalProfit = active.reduce((s, w) => s + w.analytics.totalPnL, 0);

    const netCounts: Record<string, number> = {};
    active.forEach(w => { netCounts[w.network] = (netCounts[w.network] || 0) + 1; });
    const topNetwork = Object.entries(netCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'ETH';

    return { totalTracked: active.length, avgWinRate, avgROI, totalProfit, topNetwork };
  }
}

export const whaleService = new WhaleService();
