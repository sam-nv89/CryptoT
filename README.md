# Crypto Tracker & Arbitrage Dashboard

A premium cryptocurrency monitoring dashboard designed for real-time tracking of spreads, funding rates, and arbitrage opportunities across 18+ Centralized (CEX) and Decentralized (DEX) exchanges.

## 🚀 Key Features

- **Cross-Exchange Spreads**: Real-time identification of price discrepancies between platforms.
- **Funding Rate Monitor**: Comparison of funding rates for perpetual futures.
- **Dynamic Market Discovery**: Automatic scanning and matching of thousands of trading pairs.
- **Multi-Chain Support**: Integrated with native DEX protocols (Hyperliquid, dYdX, ApeX).
- **Advanced Filtering**: Granular control over volume, spread percentage, and specific exchanges.
- **Premium UI**: Modern, high-performance interface with glassmorphism and real-time updates.

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
