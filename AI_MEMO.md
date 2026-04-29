# AI_MEMO — CryptoTracker Technical Context

## Core Technologies
- **Framework**: Next.js 16.2.4 (Turbopack)
- **Styling**: Tailwind CSS 4
- **API Integration**: CCXT 4.5.50 (unified CEX) + Native REST (Hyperliquid)
- **State Management**: Zustand
- **Visualization**: Lightweight Charts (TradingView)

## Architecture Notes
- **Data Flow**: `src/services/collector.ts` fetches data -> `src/services/data-cache.ts` stores it (singleton) -> API routes serve it.
- **Normalization**: All tickers and symbols are standardized via `src/utils/crypto.ts` to handle varied exchange formats.
- **Arbitrage Logic**: `src/services/alert-engine.ts` calculates net spreads including real-world taker fees.

## Current Environment
- **Server**: Running at http://localhost:3000
- **Status**: Development mode with Turbopack enabled.
- **Dependencies**: Freshly installed.

## Known Issues / Observations / Fixes
- **Hydration Fix**: `suppressHydrationWarning` added to `<html>` to ignore browser extension injections (Bybit wallet, etc.).
- OKX and Binance might have intermittent connectivity depending on the runner's location (proxy/VPN might be needed for full coverage).
- Gate.io and AscendEX have restricted endpoints (market discovery handles this by skipping `fetchCurrencies`).
