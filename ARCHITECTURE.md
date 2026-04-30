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
- **Views**:
    - `/dashboard`: Real-time market state and spreads.
    - `/alerts`: Live signal feed with filtering and sound alerts.
    - `/reports`: Detailed arbitrage breakdowns (matching pro-bot formats).
    - `/funding`: Global funding rate matrix.

## 🛠 Integration Details

### CCXT Resilience Tweaks
To ensure maximum exchange coverage, the service implements:
- **`fetchCurrencies: false`**: Bypasses permission-restricted endpoints on Gate.io and AscendEX.
- **`fetchMarkets: ['swap']`**: Forces focus on perpetual markets, skipping potentially blocked spot endpoints.
- **Custom Hostnames**: Support for alternative endpoints (e.g., OKX `aws.okex.com`) to bypass regional blocks.

## 📁 Directory Structure

- `src/services/`: 
    - `exchange-service.ts`: Core CCXT logic and market discovery.
    - `alert-engine.ts`: Net-profit math and signal generation.
    - `report-service.ts`: Detailed reporting and data export logic (CSV/JSON).
    - `collector.ts`: Background polling orchestration.
- `src/config/`: Exchange registry, fee structures, and fallback symbols.
- `src/utils/`: Math utilities, symbol normalization, and formatting.
- `src/components/`: Reusable UI components (Dashboard, Layout, Shared).
- `src/types/`: Unified TypeScript interfaces for the entire project.
