# Project Architecture — CryptoTracker

## 🏗 System Overview

CryptoTracker is a high-frequency data ingestion and visualization platform. It consists of three main layers: the **Collector Service**, the **Discovery Engine**, and the **Interactive UI**.

### 1. Data Collection Layer (`src/services/collector.ts`)
- **Parallel Workers**: Fetches data from multiple exchanges simultaneously using `Promise.allSettled`.
- **Hybrid Data Source**: 
  - Uses **CCXT** for standardized CEX integration.
  - Uses **Native REST APIs** for DEXs (Hyperliquid, etc.) to minimize latency.
- **Ticker & Funding Sync**: Fetches tickers (last price, volume) and funding rates in parallel to provide a complete market snapshot.

### 2. Discovery Engine (`src/services/exchange-service.ts`)
- **Automated Mapping**: Scans thousands of markets across 18 exchanges to identify common trading pairs.
- **Symbol Normalization**: A unified utility (`src/utils/crypto.ts`) converts varied exchange formats (e.g., `BTC-USDT`, `BTC/USDT:USDT`, `BTC_USDT`) into a standard base/quote representation.
- **Cross-Settlement Equivalence**: Automatically matches `USDT` and `USDC` pairs to surface cross-asset arbitrage opportunities.

### 3. Data Flow & Cache (`src/services/data-cache.ts`)
- **In-Memory Store**: Fast, reactive cache that survives Next.js hot-reloads during development using a `globalThis` singleton.
- **Persistent Discovery**: Market discovery results are cached to reduce API load, with versioning (e.g., `V5`) to force refreshes when logic changes.

### 4. UI Architecture
- **Real-time Tables**: High-performance tables with inline filtering and sorting using `useMemo` for efficient rendering of large datasets.
- **Modular Shell**: A consistent layout with an adaptive sidebar (toggable icons/full view) and state-of-the-art aesthetics.
The spot arbitrage module uses a unique **Three-Tier Confidence Model** combined with **Smart Depth Estimation**:
- **🟢 Verified**: Uses real-time network fees fetched via `fetchCurrencies`. Most accurate.
- **🟡 Estimated**: Uses a specialized fallback table (`src/config/spot-config.ts`) for 90+ assets.
- **🔴 Raw**: Uses a percentage-based estimate (0.3% of trade value) for exotic tokens.
- **📈 Depth Estimation**: Since many exchanges omit order book volume in tickers, the engine estimates executable depth as 0.5% of the 24h daily volume (`DEPTH_ESTIMATE_FACTOR`), ensuring opportunities are not missed while maintaining realism.

This ensures the tool provides actionable data even when exchanges restrict access to their wallet/network APIs.

## 🛠 Integration Details

### Spot vs Futures Optimization
The system maintains two separate service layers to avoid symbol contamination and rate-limit issues:
- **Futures Service**: Specialized in perpetual swaps and funding rates.
- **Spot Service**: Focuses on the 14 most reliable spot exchanges, filtering for USDT/USDC pairs and volume thresholds.

### CCXT Resilience Tweaks
To ensure maximum exchange coverage, the service implements:
- **`fetchCurrencies: false`**: Bypasses permission-restricted endpoints on Gate.io, MEXC, and AscendEX.
- **`fetchMarkets: ['swap']`**: Forces focus on perpetual markets for the futures engine.
- **`defaultType: 'spot'`**: Explicitly used in the spot engine to ensure correct symbol resolution.

## 📁 Directory Structure

- `src/services/`: 
    - `exchange-service.ts`: Core CCXT logic for futures.
    - `spot-service.ts`: Specialized spot ticker and network fetching.
    - `spot-collector.ts`: Orchestrates spot cycles and currency caching.
    - `alert-engine.ts`: Net-profit math for futures.
    - `report-service.ts`: Detailed reporting and data export.
- `src/config/`: 
    - `exchanges.ts`: Global exchange registry.
    - `spot-config.ts`: Spot-specific fees, fallback withdrawal costs, and thresholds.
- `src/utils/`: 
    - `spot-calculator.ts`: Three-tier confidence spread logic.
    - `crypto.ts`: Symbol normalization and multipliers.
- `src/components/`: Reusable UI components (Dashboard, Layout, Shared).
- `src/types/`: Unified TypeScript interfaces.
