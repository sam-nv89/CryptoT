# DEV_LOG — CryptoTracker

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
