# Crypto Tracker & Arbitrage Dashboard

A premium cryptocurrency monitoring dashboard designed for real-time tracking of spreads, funding rates, and arbitrage opportunities across 18+ Centralized (CEX) and Decentralized (DEX) exchanges.

## 🚀 Key Features

- **Spot Arbitrage Engine**: High-fidelity tracking of spot price discrepancies with a three-tier confidence model (Verified, Estimated, Raw) for withdrawal fees.
- **Futures Arbitrage & Funding**: Real-time comparison of funding rates and perpetual futures spreads.
- **Dynamic Market Discovery**: Automatic scanning and mapping of 700+ assets across 18+ exchanges.
- **Smart Fee Calculation**: Intelligent net-profit estimation factoring in trading fees and network withdrawal costs.
- **Whale Tracker (v2)**: Advanced on-chain monitoring with 100% real PnL, WinRate, and investment analytics powered by Moralis DeFi API.
- **Premium UX**: Professional-grade dashboard with glassmorphism, real-time "flash" updates, and sound alerts for high-yield signals.

## 🏛 Supported Exchanges

### Centralized (CEX)
- Binance, Bybit, OKX, Gate.io, MEXC, Bitget, KuCoin, HTX, Phemex, BingX, CoinEx, Poloniex, XT.com, BitMart, AscendEX.

### Decentralized (DEX)
- Hyperliquid, dYdX v4, ApeX Protocol.

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS, Framer Motion.
- **Backend Service**: Node.js, CCXT (CryptoCurrency eXchange Trading Library).
- **State Management**: React Hooks + Custom Data Cache.
- **Market Data**: Multi-stream collector with parallel ticker and funding rate fetching.

## 📦 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run development server**:
   ```bash
   npm run dev
   ```

3. **Open Dashboard**:
   Navigate to [http://localhost:3000](http://localhost:3000).

## ⚠️ Important Note
Some exchanges (e.g., OKX, Gate.io) may require a **VPN** or specific **Proxy** configuration depending on your regional IP address to bypass API restrictions.

---
*Built with precision and high-tier engineering.*
