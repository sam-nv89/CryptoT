# DEV_LOG — CryptoTracker

## 2026-04-29 — Exchange Expansion & Connection Resilience
- **Major Expansion**: Integrated 6 additional exchanges: **OKX, Poloniex, CoinEx, XT.com, BitMart, AscendEX**. Total supported platforms increased to **18**.
- **Connectivity Fixes**:
  - Disabled `fetchCurrencies` and `fetchSpotMarkets` for problematic exchanges (Gate.io, AscendEX, BitMart) to prevent API permission/Forbidden errors during market discovery.
  - Reverted OKX hostname to default after VPN tests confirmed connectivity to `www.okx.com`.
  - Added modern `User-Agent` headers to all CCXT requests to avoid bot-detection blocks.
- **UI & UX Refinement**:
  - **Filter Logic**: Updated `SpreadTable` filter to show ALL enabled exchanges, regardless of whether they have active spreads, providing a complete overview of the ecosystem.
  - **Symbol Formatting**: Enhanced `formatSymbol` utility to support `USDC` settlement and handle multi-exchange separators (`-`, `_`, `:`).
  - **Data Cache**: Incremented cache key to `V5` to ensure fresh normalization and market discovery data after structural changes.
- **Scanner Verification**: Verified 16/18 exchanges now successfully pass market discovery under VPN/Proxy environments.
- **Bug Fix (Spreads Not Showing)**: Fixed an issue where the dashboard returned empty spreads because `calculateSpreads` lacked bid/ask data for most exchanges.
- **CCXT Configuration**:
  - Added `options: { defaultType: 'swap' }` to the exchange instance constructor. CCXT defaults to `spot` for unified exchanges (e.g. OKX, Gate, MEXC), causing futures symbols to be completely ignored or skipped in our `discover` module. This ensures perpetual swap symbols are consistently discovered and matched.
  - Reset the `globalThis` Next.js development cache key to force a clean instantiation of `DataCache`, ensuring hot-reloads clear outdated spot symbols and fetch fresh futures data.
- **Data Enrichment**:
  - Refactored `fetchTickers` in `exchange-service.ts`. Since `fetchTickers` for many exchanges (like Binance) provides 24h stats but omits `bid` and `ask` prices, we now fetch both `fetchTickers()` and `fetchBidsAsks()` concurrently using `Promise.all` (and gracefully catching rejection) and merge the results. This provides the `last` and `volume24h` for the price grid, while ensuring `bid` and `ask` are populated for spread arbitrage calculations.## 2026-04-29 — Dashboard UI Overhaul & Dynamic Market Discovery
- **Discovery Service**: Refactored `exchange-service.ts` to fetch all available markets via `loadMarkets()` instead of relying on hardcoded symbols.
- **Batch Ticker Fetching**: Optimized data fetching by retrieving all tickers in one API call per exchange using `fetchTickers()`.
- **UI Components**:
  - `RefreshControl`: Added manual and auto-refresh toggle with configurable polling intervals and a "Data Age" monitor. Includes a "Find All Coins" trigger.
  - `SpreadTable`: Fully rewritten with interactive sorting, inline filtering (symbol, multi-exchange, min spread, min volume), and pagination. Highlights changed rows.
  - `PriceGrid` & `FundingTable`: Refactored to dynamically group and display available symbols instead of relying on static configuration.
- **Expanded Coverage**: Increased exchange coverage to **12 exchanges**: Binance, Bybit, OKX, Gate.io, Bitget, KuCoin, MEXC, HTX, Phemex, BingX, CoinEx, Hyperliquid.
- **Bug Fix**: Fixed `useMarketData` argument in `FundingPage` and updated fee reference grids to iterate dynamically over `EXCHANGE_FEES`.

## 2026-04-29 — Spread Arbitrage Alert System (Full Implementation)

### Changes
- **Alert Engine** (`src/services/alert-engine.ts`): Fee-adjusted arbitrage evaluation engine with real taker fees for 6 exchanges, slippage estimation, net-profit-per-$1K calculation, tier classification (HOT ≥ 0.15%, WARM ≥ 0.05%, COLD), in-memory ring-buffer history (200 entries)
- **API Routes**: `/api/alerts` (evaluated signals with configurable thresholds via query params), `/api/alerts/history` (time-windowed history)
- **Client Hook** (`src/hooks/useSpreadAlerts.ts`): Real-time polling with new-signal detection, Web Audio API notification chimes for HOT signals, configurable threshold state
- **UI Components** (4 new):
  - `OpportunityCard` — premium card with buy/sell exchange flow, gross/net spread, fees, profit-per-$1K, tier-based gradients
  - `AlertFeed` — scrollable live history feed with tier dots, exchange flow, relative timestamps
  - `SpreadAlertPanel` — collapsible settings with range sliders (gross/net spread, volume), sound toggle, fee reference table
- **Alerts Page** — replaced placeholder with full-featured module: stats row, settings panel, signal grid + history feed
- **Exchange Expansion**: Added Gate.io (`gate`) and Bitget (`bitget`) — now 6 exchanges total (Binance, Bybit, OKX, Gate.io, Bitget, Hyperliquid)
- **Type System**: Extended `ExchangeId` union with `gate` | `bitget`

### Exchange Fee Schedule (Taker)
| Exchange     | Taker Fee |
|-------------|-----------|
| Binance      | 0.04%     |
| Bybit        | 0.06%     |
| OKX          | 0.05%     |
| Gate.io      | 0.05%     |
| Bitget       | 0.06%     |
| Hyperliquid  | 0.035%    |

### Status
- ✅ Build passes cleanly (TypeScript + Turbopack)
- ✅ Live data fetching from all 6 exchanges confirmed
- ✅ Real-time signal history populating (DOGE/USDT detected across Gate.io, Bitget, Bybit, Hyperliquid)
- ✅ Net-spread calculation correctly filters out unprofitable opportunities
- 🔜 Telegram bot integration for push alerts
- 🔜 WebSocket upgrade for sub-second latency

## 2026-04-28 — Запуск сервера
- Запущен сервер разработки Next.js (npm run dev)
- Проект доступен по адресу: http://localhost:3000

## 2026-04-27 — MVP: Initial Project Setup

### Changes
- Initialized Next.js 16 + TypeScript + Tailwind CSS v4 project
- Created full architecture: types, config, services, API routes, UI components
- **Exchange Service**: CCXT integration for Binance, Bybit; native REST for Hyperliquid DEX
- **API Routes**: `/api/spreads`, `/api/funding`, `/api/tickers`, `/api/collect`
- **Dashboard**: Stats cards, price grid, spread table, funding rate matrix
- **Pages**: Dashboard, Funding, Alerts (placeholder), Whales (placeholder), Settings
- **Sidebar**: Premium navigation with glassmorphism, active state indicators
- **Design System**: Dark theme, neon accents, ambient glows, animations, skeleton loading

### Tech Stack
- Next.js 16.2.4, React 19, TypeScript 5, Tailwind CSS 4
- CCXT 4.5.50 (unified exchange API), grammY (Telegram bot — scaffolded)
- Lightweight Charts (TradingView), Lucide React, Zustand, clsx

### Status
- ✅ Build passes, dev server runs, real data from exchanges displayed
- ⚠️ OKX data not loading (possible geo-restriction), Binance intermittent
- 🔜 Alerts module, Telegram bot, Whale tracking — next phases
